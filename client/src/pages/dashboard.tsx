"use client"

import { useQuery, useMutation } from "@tanstack/react-query"
import {
  Activity,
  CreditCard,
  MessageSquare,
  FileText,
  Plus,
  Minus,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Calendar,
  Globe,
  Users,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import type { UsageStats } from "@shared/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { apiRequest, queryClient } from "@/lib/queryClient"
import { CircularProgress } from "@/components/circular-progress"
import { Skeleton } from "@/components/ui/skeleton"
import { WorldMapHero } from "@/components/world-map-hero"
import { TailAdminLineChart } from "@/components/tailadmin-line-chart"

const TAILADMIN_BLUE = "#465FFF"
const TAILADMIN_BLUE_LIGHT = "rgba(70, 95, 255, 0.08)"

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  subtitle,
}: {
  title: string
  value: string | number
  change?: number
  icon: any
  subtitle?: string
}) {
  const isPositive = change !== undefined && change >= 0

  return (
    <div className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: TAILADMIN_BLUE_LIGHT }}
            >
              <Icon className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl lg:text-3xl font-bold text-foreground">{value}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold ${
              isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
            }`}
          >
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {isPositive ? "+" : ""}
            {change.toFixed(2)}%
          </div>
        )}
      </div>
    </div>
  )
}

function GeographicCard({
  region,
  users,
  percentage,
  change,
  flag,
}: {
  region: string
  users: string
  percentage: number
  change: number
  flag?: string
}) {
  const isPositive = change >= 0
  return (
    <div className="flex items-center gap-4 py-4 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {flag && <span className="text-xl">{flag}</span>}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground truncate">{region}</span>
            <span className="text-sm text-muted-foreground">{users}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${percentage}%`, backgroundColor: TAILADMIN_BLUE }}
            />
          </div>
        </div>
      </div>
      <div
        className={`text-xs font-semibold px-2 py-1 rounded-full ${
          isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
        }`}
      >
        {isPositive ? "+" : ""}
        {change}%
      </div>
    </div>
  )
}

function QuickStatItem({ label, value, trend }: { label: string; value: string; trend?: "up" | "down" }) {
  return (
    <div className="text-center p-4 rounded-xl bg-muted/50">
      <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {trend && (
        <div
          className={`flex items-center justify-center gap-1 mt-2 ${trend === "up" ? "text-emerald-500" : "text-red-500"}`}
        >
          {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { toast } = useToast()
  const [creditAmount, setCreditAmount] = useState("1000")

  const { data: stats, isLoading: statsLoading } = useQuery<UsageStats>({
    queryKey: ["/api/usage/stats"],
  })

  const { data: budgetStatus, isLoading: budgetLoading } = useQuery<any>({
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
      <div className="min-h-screen bg-background p-6 lg:p-8">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  const totalUsage = stats?.totalUsage || 0
  const activeConversations = stats?.activeConversations || 0
  const files = stats?.filesInKB || 0
  const creditsUsed = stats?.creditsUsed || 0

  const budget = budgetStatus?.budget || 60
  const spent = budgetStatus?.current_cost || 0

  const history = stats?.usageHistory || []
  const totalRequestsSum = history.reduce((acc: any, curr: any) => acc + curr.totalRequests, 0)
  const successRequestsSum = history.reduce((acc: any, curr: any) => acc + curr.successfulRequests, 0)
  const successRate = totalRequestsSum > 0 ? (successRequestsSum / totalRequestsSum) * 100 : 99.3

  const chartLabels = history.map((d: any) =>
    new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  )
  const chartData = history.map((d: any) => d.totalRequests)

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-6 lg:px-8 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: TAILADMIN_BLUE }}
                >
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground" data-testid="text-dashboard-title">
                  Dashboard
                </h1>
              </div>
              <p className="text-sm text-muted-foreground ml-[52px]">
                Welcome back! Here's your AI analytics overview.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-muted rounded-xl text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Last 30 days</span>
              </div>
              <Button className="text-white rounded-xl px-5" style={{ backgroundColor: TAILADMIN_BLUE }}>
                <ChevronRight className="w-4 h-4 mr-2" />
                View Reports
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Usage"
            value={totalUsage.toLocaleString()}
            change={11.01}
            icon={Activity}
            subtitle="API requests this month"
          />
          <StatCard
            title="Credits Used"
            value={creditsUsed.toLocaleString()}
            change={-9.05}
            icon={CreditCard}
            subtitle="Out of monthly allocation"
          />
          <StatCard
            title="Active Conversations"
            value={activeConversations.toLocaleString()}
            change={8.5}
            icon={MessageSquare}
            subtitle="Currently active sessions"
          />
          <StatCard
            title="Files Stored (KB)"
            value={files.toString()}
            change={5.2}
            icon={FileText}
            subtitle="Knowledge base storage"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Map - takes 2 columns */}
          <div className="xl:col-span-2 bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: TAILADMIN_BLUE_LIGHT }}
                >
                  <Globe className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Global Distribution</h3>
                  <p className="text-sm text-muted-foreground">User activity by region</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <WorldMapHero />
            </div>
          </div>

          {/* Regional Stats */}
          <div className="bg-card rounded-2xl border border-border">
            <div className="px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: TAILADMIN_BLUE_LIGHT }}
                >
                  <MapPin className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Regional Metrics</h3>
                  <p className="text-sm text-muted-foreground">Usage by geography</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <GeographicCard region="United States" users="12,847" percentage={45} change={12.5} flag="🇺🇸" />
              <GeographicCard region="United Kingdom" users="5,234" percentage={22} change={8.2} flag="🇬🇧" />
              <GeographicCard region="Germany" users="3,891" percentage={18} change={-3.1} flag="🇩🇪" />
              <GeographicCard region="Canada" users="2,456" percentage={12} change={15.4} flag="🇨🇦" />
              <GeographicCard region="Australia" users="1,823" percentage={8} change={6.7} flag="🇦🇺" />

              {/* Quick summary */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="grid grid-cols-3 gap-3">
                  <QuickStatItem label="Countries" value="24" trend="up" />
                  <QuickStatItem label="Cities" value="156" trend="up" />
                  <QuickStatItem label="Growth" value="+18%" trend="up" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Line Chart */}
          <div className="xl:col-span-2">
            {history.length > 0 && (
              <TailAdminLineChart
                title="Usage Statistics"
                subtitle="API requests over the selected period"
                labels={chartLabels}
                data={chartData}
                dataLabel="Requests"
                height={380}
                icon={<BarChart3 className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />}
              />
            )}
          </div>

          {/* Monthly Target */}
          <div className="xl:col-span-1">
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

        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: TAILADMIN_BLUE_LIGHT }}
            >
              <Users className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Performance Overview</h3>
              <p className="text-sm text-muted-foreground">Key metrics at a glance</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 rounded-2xl bg-muted/30 border border-border/50">
              <p className="text-3xl font-bold mb-2" style={{ color: TAILADMIN_BLUE }}>
                {successRate.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <div className="flex items-center justify-center gap-1 mt-2 text-emerald-500 text-xs font-medium">
                <ArrowUpRight className="w-3 h-3" />
                +2.3%
              </div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-muted/30 border border-border/50">
              <p className="text-3xl font-bold mb-2" style={{ color: TAILADMIN_BLUE }}>
                362.7
              </p>
              <p className="text-sm text-muted-foreground">Avg Messages/Session</p>
              <div className="flex items-center justify-center gap-1 mt-2 text-emerald-500 text-xs font-medium">
                <ArrowUpRight className="w-3 h-3" />
                +5.1%
              </div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-muted/30 border border-border/50">
              <p className="text-3xl font-bold mb-2" style={{ color: TAILADMIN_BLUE }}>
                {files}
              </p>
              <p className="text-sm text-muted-foreground">Storage Used (KB)</p>
              <div className="flex items-center justify-center gap-1 mt-2 text-emerald-500 text-xs font-medium">
                <ArrowUpRight className="w-3 h-3" />
                +1.8%
              </div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-muted/30 border border-border/50">
              <p className="text-3xl font-bold mb-2" style={{ color: TAILADMIN_BLUE }}>
                1.2s
              </p>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
              <div className="flex items-center justify-center gap-1 mt-2 text-red-500 text-xs font-medium">
                <ArrowDownRight className="w-3 h-3" />
                -0.3s
              </div>
            </div>
          </div>
        </div>

        {budgetStatus && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: TAILADMIN_BLUE_LIGHT }}
                >
                  <CreditCard className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Manual Credit Adjustment</h3>
                  <p className="text-sm text-muted-foreground">Add or subtract credits from your balance</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl">
                <span className="text-sm text-muted-foreground">Current:</span>
                <span className="font-semibold text-foreground">
                  {budgetStatus.credits_used.toLocaleString()} credits
                </span>
                <span className="text-sm text-muted-foreground">(${budgetStatus.current_cost.toFixed(2)})</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="flex-1 h-12 rounded-xl border-border bg-muted/30"
                placeholder="Enter amount"
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleAddCredits}
                  disabled={addCreditsMutation.isPending}
                  className="flex-1 sm:flex-none h-12 px-6 text-white rounded-xl"
                  style={{ backgroundColor: TAILADMIN_BLUE }}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Credits
                </Button>
                <Button
                  onClick={handleSubtractCredits}
                  disabled={subtractCreditsMutation.isPending}
                  variant="outline"
                  className="flex-1 sm:flex-none h-12 px-6 rounded-xl border-border hover:bg-muted bg-transparent"
                >
                  <Minus className="w-4 h-4 mr-2" /> Subtract
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
