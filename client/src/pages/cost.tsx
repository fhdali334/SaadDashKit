"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Zap,
  DollarSign,
  RefreshCw,
  TestTube,
  ShoppingCart,
  Clock,
  CreditCard,
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
import { TailAdminBarChart } from "@/components/tailadmin-bar-chart"
import { TailAdminSmoothLineChart } from "@/components/tailadmin-smooth-line-chart"

const TAILADMIN_BLUE = "#3b82f6"
const TAILADMIN_BLUE_LIGHT = "rgba(59, 130, 246, 0.08)"

function generateCostChartData() {
  const data = []
  const now = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    // Generate realistic fluctuating data with trends
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    // Base values with some randomness
    const baseTokens = isWeekend ? 400 : 700
    const tokenVariance = Math.random() * 300 - 150
    const aiTokens = Math.round(Math.max(200, baseTokens + tokenVariance + (29 - i) * 15))

    const baseCredits = isWeekend ? 100 : 180
    const creditVariance = Math.random() * 80 - 40
    const chatbotCredits = Math.round(Math.max(50, baseCredits + creditVariance + (29 - i) * 5))

    // Cost calculation based on usage
    const aiCost = Number((aiTokens * 0.001).toFixed(2))
    const chatbotCost = Number((chatbotCredits * 0.001).toFixed(2))

    data.push({
      name: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      aiTokens,
      chatbotCredits,
      aiCost,
      chatbotCost,
    })
  }

  return data
}

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
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [showTopUpModal, setShowTopUpModal] = useState(false)

  const chartData = useMemo(() => generateCostChartData(), [])

  const totalAiTokens = useMemo(() => chartData.reduce((sum, d) => sum + d.aiTokens, 0), [chartData])
  const totalChatbotCredits = useMemo(() => chartData.reduce((sum, d) => sum + d.chatbotCredits, 0), [chartData])
  const totalAiCost = useMemo(() => chartData.reduce((sum, d) => sum + d.aiCost, 0), [chartData])
  const totalChatbotCost = useMemo(() => chartData.reduce((sum, d) => sum + d.chatbotCost, 0), [chartData])

  const usageData: UsageData = useMemo(
    () => ({
      openai: {
        tokensUsed: totalAiTokens,
        costUsd: Number(totalAiCost.toFixed(2)),
        systemCost: Number((totalAiCost * 0.15).toFixed(2)),
        tokensChange: 12.5,
        costChange: 8.3,
      },
      chatbot: {
        creditsUsed: totalChatbotCredits,
        creditsTotal: 10000,
        creditsRemaining: 10000 - totalChatbotCredits,
        creditsChange: -5.2,
      },
      account: {
        initialBalance: 100,
        remainingBalance: Math.max(0, 100 - totalAiCost - totalChatbotCost),
        resetAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
    }),
    [totalAiTokens, totalChatbotCredits, totalAiCost, totalChatbotCost],
  )

  const openaiData = usageData.openai
  const chatbotData = usageData.chatbot
  const accountData = usageData.account

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4 mb-2">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: TAILADMIN_BLUE }}
            >
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Usage & Cost Management</h1>
              <p className="text-sm text-muted-foreground">Track your OpenAI API and Chatbot credit usage</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-8 py-8 space-y-8">
        {/* Top Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="OpenAI Tokens Used"
            value={openaiData.tokensUsed.toLocaleString()}
            change={openaiData.tokensChange || 12.5}
            icon={Zap}
            subtitle="API requests this month"
          />
          <StatCard
            title="Chatbot Credits Used"
            value={chatbotData.creditsUsed.toLocaleString()}
            change={chatbotData.creditsChange || -5.2}
            icon={CreditCard}
            subtitle="Out of monthly allocation"
          />
          <StatCard
            title="Remaining Balance"
            value={`$${accountData.remainingBalance.toFixed(2)}`}
            change={3.8}
            icon={Wallet}
            subtitle="of $100.00 total"
          />
        </div>

        {/* Cost Breakdown Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-border rounded-2xl">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: TAILADMIN_BLUE_LIGHT }}
                >
                  <DollarSign className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Total Cost</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">OpenAI API</p>
                  <p className="text-2xl font-bold" style={{ color: TAILADMIN_BLUE }}>
                    ${openaiData.costUsd.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">System cost: ${openaiData.systemCost.toFixed(2)}</p>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                  <p className="text-3xl font-bold" style={{ color: TAILADMIN_BLUE }}>
                    ${(openaiData.costUsd + openaiData.systemCost).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Of $100.00 budget</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border rounded-2xl">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: TAILADMIN_BLUE_LIGHT }}
                >
                  <Zap className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">AI Tokens</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Daily Average</p>
                  <p className="text-2xl font-bold" style={{ color: TAILADMIN_BLUE }}>
                    ~{Math.round(openaiData.tokensUsed / 30).toLocaleString()} tokens
                  </p>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-muted-foreground">Burn Rate</p>
                    <p className="text-xs font-semibold text-emerald-500">-2.5% daily</p>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: "65%", backgroundColor: TAILADMIN_BLUE }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border rounded-2xl">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: TAILADMIN_BLUE_LIGHT }}
                >
                  <CreditCard className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Chatbot Credits</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Credits Remaining</p>
                  <p className="text-2xl font-bold" style={{ color: TAILADMIN_BLUE }}>
                    {chatbotData.creditsRemaining.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">of {chatbotData.creditsTotal.toLocaleString()} total</p>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-muted-foreground">Utilization</p>
                    <p className="text-xs font-semibold text-emerald-500">
                      {((chatbotData.creditsUsed / chatbotData.creditsTotal) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(chatbotData.creditsUsed / chatbotData.creditsTotal) * 100}%`,
                        backgroundColor: TAILADMIN_BLUE,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TailAdminSmoothLineChart
            title="AI Tokens vs Chatbot Credits"
            data={chartData.map((d) => ({
              name: d.name,
              value1: d.aiTokens,
              value2: d.chatbotCredits,
            }))}
            height={350}
            series1Label="AI Tokens"
            series2Label="Chatbot Credits"
          />

          <TailAdminBarChart
            title="Daily Token Usage"
            data={chartData.map((d) => ({
              name: d.name,
              value: d.aiTokens,
            }))}
            height={350}
            series1Label="AI Tokens"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TailAdminBarChart
            title="Chatbot Credits Used"
            data={chartData.map((d) => ({
              name: d.name,
              value: d.chatbotCredits,
            }))}
            height={350}
            series1Label="Credits"
          />

          <TailAdminSmoothLineChart
            title="Cost Trends"
            data={chartData.map((d) => ({
              name: d.name,
              value1: Number.parseFloat(d.aiCost.toFixed(2)),
              value2: Number.parseFloat(d.chatbotCost.toFixed(2)),
            }))}
            height={350}
            series1Label="AI Cost ($)"
            series2Label="Chatbot Cost ($)"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Button
            onClick={() => setShowSimulateModal(true)}
            className="h-12 rounded-xl text-white"
            style={{ backgroundColor: TAILADMIN_BLUE }}
          >
            <TestTube className="w-4 h-4 mr-2" />
            Simulate Usage
          </Button>
          <Button
            onClick={() => setShowBuyModal(true)}
            className="h-12 rounded-xl text-white"
            style={{ backgroundColor: TAILADMIN_BLUE }}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Buy Credits
          </Button>
          <Button
            onClick={() => setShowTopUpModal(true)}
            className="h-12 rounded-xl text-white"
            style={{ backgroundColor: TAILADMIN_BLUE }}
          >
            <PiggyBank className="w-4 h-4 mr-2" />
            Top Up Balance
          </Button>
        </div>
      </main>

      {/* Modals */}
      {showSimulateModal && (
        <SimulateUsageModal isOpen={showSimulateModal} onClose={() => setShowSimulateModal(false)} />
      )}
      {showBuyModal && <BuyCreditsModal isOpen={showBuyModal} onClose={() => setShowBuyModal(false)} />}
      {showTopUpModal && <TopUpModal isOpen={showTopUpModal} onClose={() => setShowTopUpModal(false)} />}
    </div>
  )
}
