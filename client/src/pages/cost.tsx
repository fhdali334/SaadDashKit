"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Brain,
  Zap,
  DollarSign,
  RefreshCw,
  TestTube,
  ShoppingCart,
  Clock,
  CreditCard,
  ArrowRight,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SimulateUsageModal } from "@/components/simulate-usage-modal"
import { BuyCreditsModal } from "@/components/buy-credits-modal"
import { TopUpModal } from "@/components/top-up-modal"

const TAILADMIN_BLUE = "#465FFF"
const TAILADMIN_BLUE_LIGHT = "rgba(70, 95, 255, 0.08)"

interface UsageData {
  openai: {
    tokensUsed: number
    costUsd: number
    systemCost: number
    tokensChange?: number
    costChange?: number
  }
  chatbot: {
    creditsUsed: number
    creditsTotal: number
    creditsRemaining: number
    creditsChange?: number
  }
  account: {
    initialBalance: number
    remainingBalance: number
    resetAt: string
  }
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  change,
  progress,
}: {
  title: string
  value: string
  subtitle?: string
  icon: any
  change?: number
  progress?: { current: number; max: number }
}) {
  const isPositive = change !== undefined && change >= 0

  return (
    <Card className="border-border rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: TAILADMIN_BLUE_LIGHT }}
          >
            <Icon className="w-6 h-6" style={{ color: TAILADMIN_BLUE }} />
          </div>
          {change !== undefined && (
            <div
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold ${
                isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
              }`}
            >
              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {isPositive ? "+" : ""}
              {change.toFixed(1)}%
            </div>
          )}
        </div>
        <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">{value}</h3>
        <p className="text-sm text-muted-foreground">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {progress && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Used</span>
              <span>{((progress.current / progress.max) * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((progress.current / progress.max) * 100, 100)}%`,
                  backgroundColor: TAILADMIN_BLUE,
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function UsagePanel({
  title,
  subtitle,
  icon: Icon,
  used,
  total,
  remaining,
  showUsd = false,
  onBuy,
}: {
  title: string
  subtitle: string
  icon: any
  used: number
  total: number
  remaining: number
  showUsd?: boolean
  onBuy: () => void
}) {
  const percentage = total > 0 ? (used / total) * 100 : 0
  const isLow = percentage > 80

  return (
    <Card className="border-border rounded-2xl overflow-hidden">
      <CardHeader className="pb-4 px-6 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: TAILADMIN_BLUE_LIGHT }}
            >
              <Icon className="w-6 h-6" style={{ color: TAILADMIN_BLUE }} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <Button onClick={onBuy} className="rounded-xl text-white px-5" style={{ backgroundColor: TAILADMIN_BLUE }}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Buy More
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-4xl font-bold text-foreground">
              {showUsd ? `$${used.toFixed(2)}` : used.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              of {showUsd ? `$${total.toFixed(2)}` : total.toLocaleString()} {showUsd ? "" : "credits"}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${isLow ? "text-red-500" : "text-emerald-500"}`}>
              {showUsd ? `$${remaining.toFixed(2)}` : remaining.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">remaining</p>
          </div>
        </div>

        <div className="relative">
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: isLow ? "#ef4444" : TAILADMIN_BLUE,
              }}
            />
          </div>
          <div className="flex justify-between mt-3 text-xs text-muted-foreground">
            <span className="font-medium">{percentage.toFixed(1)}% used</span>
            <span className="font-medium">{(100 - percentage).toFixed(1)}% remaining</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ResetTimerCard({
  resetAt,
  onAccelerate,
  isAccelerating,
}: {
  resetAt: string
  onAccelerate: () => void
  isAccelerating: boolean
}) {
  const resetDate = new Date(resetAt)
  const now = new Date()
  const diff = resetDate.getTime() - now.getTime()
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
  const hours = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))

  return (
    <Card className="border-border rounded-2xl">
      <CardHeader className="pb-4 px-6 pt-6">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: TAILADMIN_BLUE_LIGHT }}
          >
            <Clock className="w-6 h-6" style={{ color: TAILADMIN_BLUE }} />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Billing Cycle Reset</CardTitle>
            <p className="text-sm text-muted-foreground">Time until balance refresh</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-muted/50 rounded-2xl p-6 text-center border border-border/50">
            <p className="text-4xl font-bold" style={{ color: TAILADMIN_BLUE }}>
              {days}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Days</p>
          </div>
          <div className="bg-muted/50 rounded-2xl p-6 text-center border border-border/50">
            <p className="text-4xl font-bold" style={{ color: TAILADMIN_BLUE }}>
              {hours}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Hours</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Next reset:{" "}
          <span className="font-medium text-foreground">
            {resetDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </p>

        <Button
          onClick={onAccelerate}
          disabled={isAccelerating}
          variant="outline"
          className="w-full rounded-xl border-border hover:bg-muted h-12 bg-transparent"
        >
          {isAccelerating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Resetting...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Now
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

export default function Cost() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showSimulateModal, setShowSimulateModal] = useState(false)
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false)
  const [showTopUpModal, setShowTopUpModal] = useState(false)
  const [purchaseType, setPurchaseType] = useState<"chatbot" | "openai" | null>(null)
  const [topUpType, setTopUpType] = useState<"balance" | "chatbot_credits">("balance")

  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ["/api/account"],
  })

  const { data: usageRecords, isLoading: usageLoading } = useQuery({
    queryKey: ["/api/usage-records"],
  })

  const usageData: UsageData | null =
    account && usageRecords
      ? (() => {
          const creditLimit = Number.parseFloat(account.creditLimit || "0")
          const creditsUsed = Number.parseFloat(account.creditsUsed || "0")

          const now = new Date()
          const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

          let openaiTokensUsed = 0
          let openaiCostUsd = 0
          let openaiTokensUsedPrevMonth = 0
          let openaiCostUsdPrevMonth = 0

          usageRecords.forEach((record: any) => {
            const recordDate = new Date(record.createdAt)
            const isCurrentMonth = recordDate >= currentMonth
            const isPreviousMonth = recordDate >= previousMonth && recordDate < currentMonth

            if (
              record.tokens &&
              (record.category === "api_calls" || record.description?.toLowerCase().includes("openai"))
            ) {
              const recordCost = (record.tokens / 1000) * 0.002

              if (isCurrentMonth) {
                openaiTokensUsed += record.tokens || 0
                openaiCostUsd += recordCost
              } else if (isPreviousMonth) {
                openaiTokensUsedPrevMonth += record.tokens || 0
                openaiCostUsdPrevMonth += recordCost
              }
            }
          })

          const openaiTokensChange =
            openaiTokensUsedPrevMonth > 0
              ? ((openaiTokensUsed - openaiTokensUsedPrevMonth) / openaiTokensUsedPrevMonth) * 100
              : 0
          const openaiCostChange =
            openaiCostUsdPrevMonth > 0 ? ((openaiCostUsd - openaiCostUsdPrevMonth) / openaiCostUsdPrevMonth) * 100 : 0

          const chatbotCreditsTotal = Number.parseFloat(account.voiceflowCredits || "0")
          const chatbotCreditsUsed = Number.parseFloat(account.voiceflowCreditsUsed || "0")
          const chatbotCreditsRemaining = chatbotCreditsTotal - chatbotCreditsUsed

          const remainingBalance = creditLimit - creditsUsed
          const resetAt =
            account.billingPeriod?.resetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

          return {
            openai: {
              tokensUsed: openaiTokensUsed,
              costUsd: openaiCostUsd,
              systemCost: openaiCostUsd,
              tokensChange: openaiTokensChange,
              costChange: openaiCostChange,
            },
            chatbot: {
              creditsUsed: chatbotCreditsUsed,
              creditsTotal: chatbotCreditsTotal,
              creditsRemaining: chatbotCreditsRemaining,
              creditsChange: 0,
            },
            account: {
              initialBalance: creditLimit,
              remainingBalance,
              resetAt,
            },
          }
        })()
      : null

  const syncChatbotMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/usage/sync-voiceflow", {
        method: "POST",
        credentials: "include",
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to sync chatbot usage")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/usage-records"] })
      queryClient.invalidateQueries({ queryKey: ["/api/account"] })
    },
  })

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/budget/reset/" + (account?.id || "default"), {
        method: "POST",
        credentials: "include",
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to reset")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account"] })
      queryClient.invalidateQueries({ queryKey: ["/api/usage-records"] })
      toast({
        title: "Usage reset",
        description: "Usage has been reset successfully",
      })
    },
  })

  useEffect(() => {
    syncChatbotMutation.mutate()
  }, [])

  const isLoading = accountLoading || usageLoading

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full mx-auto mb-4"
            style={{ borderColor: `${TAILADMIN_BLUE} transparent ${TAILADMIN_BLUE} ${TAILADMIN_BLUE}` }}
          />
          <p className="text-muted-foreground">Loading usage data...</p>
        </div>
      </div>
    )
  }

  if (!usageData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No usage data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-6 lg:px-8 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: TAILADMIN_BLUE }}
              >
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Usage & Cost Management</h1>
                <p className="text-sm text-muted-foreground">
                  Track your OpenAI API usage and Chatbot credit consumption
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => syncChatbotMutation.mutate()}
                disabled={syncChatbotMutation.isPending}
                className="rounded-xl border-border hover:bg-muted"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncChatbotMutation.isPending ? "animate-spin" : ""}`} />
                Sync Usage
              </Button>
              <Button
                onClick={() => setShowSimulateModal(true)}
                className="rounded-xl text-white px-5"
                style={{ backgroundColor: TAILADMIN_BLUE }}
              >
                <TestTube className="h-4 w-4 mr-2" />
                Simulate
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Tokens Used"
            value={usageData.openai.tokensUsed.toLocaleString()}
            subtitle="OpenAI API consumption"
            icon={Brain}
            change={usageData.openai.tokensChange}
          />
          <StatCard
            title="Chatbot Credits"
            value={usageData.chatbot.creditsUsed.toLocaleString()}
            subtitle="Voiceflow credits used"
            icon={Zap}
            change={usageData.chatbot.creditsChange}
          />
          <StatCard
            title="Remaining Balance"
            value={`$${usageData.account.remainingBalance.toFixed(2)}`}
            subtitle={`of $${usageData.account.initialBalance.toFixed(2)}`}
            icon={Wallet}
            progress={{
              current: usageData.account.initialBalance - usageData.account.remainingBalance,
              max: usageData.account.initialBalance,
            }}
          />
          <StatCard
            title="API Cost"
            value={`$${usageData.openai.costUsd.toFixed(2)}`}
            subtitle="This billing cycle"
            icon={DollarSign}
            change={usageData.openai.costChange}
          />
        </div>

        {/* Usage Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UsagePanel
            title="OpenAI Usage"
            subtitle="Balance usage"
            icon={Brain}
            used={usageData.openai.costUsd}
            total={usageData.account.initialBalance}
            remaining={usageData.account.remainingBalance}
            showUsd={true}
            onBuy={() => {
              setPurchaseType("openai")
              setShowBuyCreditsModal(true)
            }}
          />
          <UsagePanel
            title="Chatbot Credits"
            subtitle="Credit consumption"
            icon={Zap}
            used={usageData.chatbot.creditsUsed}
            total={usageData.chatbot.creditsTotal}
            remaining={usageData.chatbot.creditsRemaining}
            onBuy={async () => {
              try {
                const res = await fetch("/api/purchase/chatbot-credits", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ amount: 30 }),
                })
                if (!res.ok) {
                  const error = await res.json()
                  throw new Error(error.error || "Purchase failed")
                }
                const data = await res.json()
                toast({
                  title: "Purchase Successful",
                  description: `Successfully purchased ${data.credits.toLocaleString()} chatbot credits!`,
                })
                queryClient.invalidateQueries({ queryKey: ["/api/account"] })
              } catch (error: any) {
                toast({
                  title: "Purchase Failed",
                  description: error.message || "An error occurred",
                  variant: "destructive",
                })
              }
            }}
          />
        </div>

        {/* Reset Timer and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ResetTimerCard
              resetAt={usageData.account.resetAt}
              onAccelerate={() => resetMutation.mutate()}
              isAccelerating={resetMutation.isPending}
            />
          </div>

          {/* Quick Actions */}
          <Card className="border-border rounded-2xl">
            <CardHeader className="pb-4 px-6 pt-6">
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-3">
              <Button
                className="w-full justify-start h-12 rounded-xl text-white"
                style={{ backgroundColor: TAILADMIN_BLUE }}
                onClick={() => {
                  setTopUpType("balance")
                  setShowTopUpModal(true)
                }}
              >
                <PiggyBank className="w-5 h-5 mr-3" />
                Top Up Balance
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-12 rounded-xl border-border hover:bg-muted bg-transparent"
                onClick={() => {
                  setTopUpType("chatbot_credits")
                  setShowTopUpModal(true)
                }}
              >
                <CreditCard className="w-5 h-5 mr-3" />
                Buy Chatbot Credits
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-12 rounded-xl border-border hover:bg-muted bg-transparent"
                onClick={() => setShowSimulateModal(true)}
              >
                <BarChart3 className="w-5 h-5 mr-3" />
                View Usage Report
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modals */}
      <SimulateUsageModal open={showSimulateModal} onClose={() => setShowSimulateModal(false)} />
      <BuyCreditsModal open={showBuyCreditsModal} onClose={() => setShowBuyCreditsModal(false)} type={purchaseType} />
      <TopUpModal open={showTopUpModal} onClose={() => setShowTopUpModal(false)} type={topUpType} />
    </div>
  )
}
