"use client"

import { useQuery, useMutation } from "@tanstack/react-query"
import { Activity, CreditCard, MessageSquare, FileText, Plus, Minus } from "lucide-react"
import type { UsageStats } from "@shared/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { apiRequest, queryClient } from "@/lib/queryClient"
import { SalesChart } from "@/components/sales-chart"
import { StatisticsChart } from "@/components/statistics-chart"
import { CircularProgress } from "@/components/circular-progress"
import { CreditStatusCard } from "@/components/credit-status-card"
import { QuickStatsCard } from "@/components/quick-stats-card"
import { CustomersMap } from "@/components/customers-map"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCardEnhanced } from "@/components/metric-card-enhanced" // Import MetricCardEnhanced

interface BudgetStatus {
  status: string
  over_budget: boolean
  project_id: string
  budget: number
  credits_used: number
  current_cost: number
  remaining: number
  credits_remaining: number
  reset_date: string
  days_remaining: number
}

export default function Dashboard() {
  const { toast } = useToast()
  const [creditAmount, setCreditAmount] = useState("1000")

  const { data: stats, isLoading: statsLoading } = useQuery<UsageStats>({
    queryKey: ["/api/usage/stats"],
  })

  const { data: budgetStatus, isLoading: budgetLoading } = useQuery<BudgetStatus>({
    queryKey: ["/api/budget/check"],
    refetchInterval: 30000,
  })

  const addCreditsMutation = useMutation({
    mutationFn: async (credits: number) => {
      return apiRequest("POST", "/api/credits/add", { credits })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget/check"] })
      queryClient.invalidateQueries({ queryKey: ["/api/usage/stats"] })
      toast({
        title: "Credits updated",
        description: "Successfully added credits",
      })
      setCreditAmount("1000")
    },
  })

  const subtractCreditsMutation = useMutation({
    mutationFn: async (credits: number) => {
      return apiRequest("POST", "/api/credits/add", { credits: -credits })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget/check"] })
      queryClient.invalidateQueries({ queryKey: ["/api/usage/stats"] })
      toast({
        title: "Credits updated",
        description: "Successfully subtracted credits",
      })
      setCreditAmount("1000")
    },
  })

  const handleAddCredits = () => {
    const amount = Number.parseInt(creditAmount)
    if (isNaN(amount) || amount <= 0) return
    addCreditsMutation.mutate(amount)
  }

  const handleSubtractCredits = () => {
    const amount = Number.parseInt(creditAmount)
    if (isNaN(amount) || amount <= 0) return
    subtractCreditsMutation.mutate(amount)
  }

  const isLoading = statsLoading || budgetLoading

  if (isLoading) {
    return (
      <div className="flex-1 p-6 md:p-8 space-y-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  // Data preparation
  const totalUsage = stats?.totalUsage || 0
  const activeConversations = stats?.activeConversations || 0
  const files = stats?.filesInKB || 0
  const creditsUsed = stats?.creditsUsed || 0

  const budget = budgetStatus?.budget || 60 // Default to $60 (10k credits)
  const spent = budgetStatus?.current_cost || 0

  // Calculate success rate from history
  const history = stats?.usageHistory || []
  const totalRequestsSum = history.reduce((acc:any, curr:any) => acc + curr.totalRequests, 0)
  const successRequestsSum = history.reduce((acc:any, curr:any) => acc + curr.successfulRequests, 0)
  const successRate = totalRequestsSum > 0 ? (successRequestsSum / totalRequestsSum) * 100 : 99.3

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight" data-testid="text-dashboard-title">
          Dashboard
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCardEnhanced
          title="Total Usage"
          value={totalUsage.toLocaleString()}
          percentageChange={11.01}
          icon={Activity}
          iconBg="blue"
        />
        <MetricCardEnhanced
          title="Credits Used"
          value={creditsUsed.toLocaleString()}
          percentageChange={-9.0}
          icon={CreditCard}
          iconBg="red"
        />
        <MetricCardEnhanced
          title="Active Conversations"
          value={activeConversations.toLocaleString()}
          percentageChange={8.5}
          icon={MessageSquare}
          iconBg="green"
        />
        <MetricCardEnhanced
          title="Files in KB"
          value={files.toString()}
          percentageChange={5.2}
          icon={FileText}
          iconBg="orange"
        />
      </div>

      {/* Credit Status and Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <CreditStatusCard
          budget={budget}
          spent={spent}
          creditsUsed={creditsUsed}
          totalCredits={10000} // Assuming 10k is the limit for $60
          resetDate={budgetStatus?.reset_date || null}
        />
        <QuickStatsCard
          successRate={successRate}
          avgMessagesPerSession={362.7} // Using static/mock value as per requirement since not in API
          storageUsed={files}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <SalesChart data={stats?.usageHistory || []} />
        </div>
        <div className="col-span-3">
          {/* Kept Circular Progress as alternative view or removed if redundant. Keeping as 'Monthly Target' variant */}
          <CircularProgress
            value={spent}
            max={budget}
            title="Monthly Target"
            subtitle="Budget utilization"
            message="Your credit usage is within safe limits."
            className="h-full"
          />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1">
        <StatisticsChart data={stats?.usageHistory || []} />
      </div>

      <div className="grid gap-4 grid-cols-1">
        <div className="col-span-1">
          <CustomersMap />
        </div>
      </div>

      {/* Legacy Manual Credit Adjustment - Kept for functionality but styled simply */}
      {budgetStatus && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manual Credit Adjustment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddCredits} disabled={addCreditsMutation.isPending}>
                  <Plus className="w-4 h-4 mr-2" /> Add
                </Button>
                <Button onClick={handleSubtractCredits} disabled={subtractCreditsMutation.isPending} variant="outline">
                  <Minus className="w-4 h-4 mr-2" /> Subtract
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Current: {budgetStatus.credits_used.toLocaleString()} credits used ($
                {budgetStatus.current_cost.toFixed(2)})
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
