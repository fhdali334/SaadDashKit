"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { KeywordHexagonChart } from "@/components/keyword-hexagon-chart"
import { TailAdminSmoothLineChart } from "@/components/tailadmin-smooth-line-chart"
import { TailAdminBarChart } from "@/components/tailadmin-bar-chart"
import { AdvancedHexagonChart } from "@/components/advanced-hexagon charts"
import {
  Brain,
  Download,
  TrendingUp,
  FileText,
  MessageSquare,
  Sparkles,
  Loader2,
  CalendarIcon,
  Activity,
  Zap,
  Target,
  PieChart,
  BarChart3,
} from "lucide-react"
import { format } from "date-fns"

const TAILADMIN_BLUE = "#3b82f6"
const TAILADMIN_BLUE_LIGHT = "rgba(59, 130, 246, 0.08)"
const TAILADMIN_PURPLE = "#8b5cf6"
const TAILADMIN_EMERALD = "#10b981"

interface Analysis {
  id: string
  projectId: string
  analysisDate: string
  conversionRate: number
  averageSentiment: number
  totalTranscripts: number
  reportUrl?: string
  createdAt: string
  insights?: string[]
  patterns?: string[]
}

interface AnalysisDetails extends Analysis {
  keywords: Array<{
    id: string
    keyword: string
    frequency: number
    relevanceScore: number
    category?: string
  }>
  keyphrases: Array<{
    id: string
    keyphrase: string
    frequency: number
    relevanceScore: number
    context?: string
  }>
}

interface UsageRecord {
  id: string
  accountId: string
  amount: string
  tokens: number
  category: string
  description: string
  metadata: string
  createdAt: string | Date
}

export default function AiAnalysis() {
  const queryClient = useQueryClient()
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)

  const { data: account } = useQuery({
    queryKey: ["/api/account"],
  })

  const { data: analyses = [], isLoading: isLoadingAnalyses } = useQuery<Analysis[]>({
    queryKey: ["/api/ai-analysis"],
  })

  const { data: usageRecords = [] } = useQuery<UsageRecord[]>({
    queryKey: ["/api/usage-records"],
  })

  const filteredAnalyses = analyses.filter((analysis) => {
    const analysisDate = new Date(analysis.analysisDate)
    if (startDate && analysisDate < startDate) return false
    if (endDate && analysisDate > endDate) return false
    return true
  })

  const sortedAnalyses = [...filteredAnalyses].sort(
    (a, b) => new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime(),
  )

  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null)

  useEffect(() => {
    if (sortedAnalyses.length > 0 && !selectedAnalysisId) {
      setSelectedAnalysisId(sortedAnalyses[0].id)
    }
  }, [sortedAnalyses, selectedAnalysisId])

  const { data: analysisDetails, isLoading: isLoadingDetails } = useQuery<AnalysisDetails>({
    queryKey: [`/api/ai-analysis/${selectedAnalysisId}`],
    enabled: !!selectedAnalysisId,
  })

  const runAnalysis = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai-analysis/analyze", {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) {
        const error = await response.json()
        const errorObj = new Error(error.error || "Failed to run analysis")
        ;(errorObj as any).code = error.code
        ;(errorObj as any).details = error
        throw errorObj
      }

      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-analysis"] })
      queryClient.invalidateQueries({ queryKey: ["/api/account"] })
      queryClient.invalidateQueries({ queryKey: ["/api/usage-records"] })
      setSelectedAnalysisId(data.analysis.id)
    },
  })

  const creditLimit = account ? Number.parseFloat(account.creditLimit || "0") : 0
  const creditsUsed = account ? Number.parseFloat(account.creditsUsed || "0") : 0
  const remainingBalance = creditLimit - creditsUsed

  const downloadReport = (filename: string) => {
    window.open(`/api/ai-analysis/report/${filename}`, "_blank")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 0.3) return "text-emerald-500"
    if (sentiment >= -0.3) return "text-amber-500"
    return "text-red-500"
  }

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment >= 0.3) return "Positive"
    if (sentiment >= -0.3) return "Neutral"
    return "Negative"
  }

  const tokenUsageData = (() => {
    const grouped = new Map<string, { tokens: number; cost: number }>()
    usageRecords.forEach((record) => {
      const date = new Date(record.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      const tokens = record.tokens || 0
      const cost = Number.parseFloat(record.amount) || 0
      const existing = grouped.get(date) || { tokens: 0, cost: 0 }
      grouped.set(date, { tokens: existing.tokens + tokens, cost: existing.cost + cost })
    })
    return Array.from(grouped.entries())
      .map(([date, data]) => ({ date, tokens: data.tokens, cost: data.cost }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14) // Last 14 days
  })()

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10 relative overflow-hidden">
        {/* Gradient accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(90deg, ${TAILADMIN_BLUE}, ${TAILADMIN_PURPLE})` }}
        />
        <div className="px-6 lg:px-8 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg relative"
                style={{
                  background: `linear-gradient(135deg, ${TAILADMIN_BLUE}, ${TAILADMIN_PURPLE})`,
                  boxShadow: `0 4px 20px ${TAILADMIN_BLUE}40`,
                }}
              >
                <Brain className="w-7 h-7 text-white" />
                <Sparkles className="w-3 h-3 text-white/80 absolute -top-1 -right-1" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">AI Transcript Analysis</h1>
                <p className="text-sm text-muted-foreground">
                  Analyze Voiceflow transcripts with AI to discover insights
                </p>
              </div>
            </div>
            <Button
              onClick={() => runAnalysis.mutate()}
              disabled={runAnalysis.isPending || remainingBalance <= 0}
              className="h-12 rounded-xl text-white px-6 shadow-lg transition-all hover:shadow-xl hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${TAILADMIN_BLUE}, ${TAILADMIN_PURPLE})`,
              }}
            >
              {runAnalysis.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Run New Analysis
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-8 py-8 space-y-8">
        {remainingBalance <= 0 && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertDescription>
              <strong>Insufficient Balance:</strong> You don't have enough balance to run an AI analysis. Current
              balance: ${remainingBalance.toFixed(2)}
            </AlertDescription>
          </Alert>
        )}

        {runAnalysis.error && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertDescription>
              {runAnalysis.error instanceof Error ? runAnalysis.error.message : "An error occurred"}
            </AlertDescription>
          </Alert>
        )}

        {runAnalysis.isPending && (
          <Alert className="rounded-xl bg-muted border-border">
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: TAILADMIN_BLUE }} />
            <AlertDescription className="ml-2 text-foreground">
              Fetching transcripts from Voiceflow and analyzing with AI... This may take a few minutes.
            </AlertDescription>
          </Alert>
        )}

        {isLoadingAnalyses ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : analyses.length === 0 ? (
          <Card className="border-border bg-card rounded-3xl overflow-hidden">
            <CardContent className="py-16 text-center relative">
              <div
                className="absolute inset-0 opacity-5"
                style={{ background: `linear-gradient(135deg, ${TAILADMIN_BLUE}, ${TAILADMIN_PURPLE})` }}
              />
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 relative"
                style={{
                  background: `linear-gradient(135deg, ${TAILADMIN_BLUE}15, ${TAILADMIN_PURPLE}15)`,
                }}
              >
                <Brain className="w-12 h-12" style={{ color: TAILADMIN_BLUE }} />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">No analyses yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Click "Run New Analysis" to analyze your transcripts with AI
              </p>
              <Button
                onClick={() => runAnalysis.mutate()}
                disabled={runAnalysis.isPending || remainingBalance <= 0}
                className="h-12 rounded-xl text-white px-8 hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${TAILADMIN_BLUE}, ${TAILADMIN_PURPLE})` }}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Start First Analysis
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-border bg-card rounded-3xl shadow-sm">
              <CardHeader className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: TAILADMIN_BLUE_LIGHT }}
                  >
                    <CalendarIcon className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />
                  </div>
                  <CardTitle className="text-lg font-semibold text-foreground">Filter Analyses by Date</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-muted-foreground text-sm mb-2 block">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start h-11 rounded-xl border-border hover:bg-muted bg-transparent text-foreground"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          {startDate ? format(startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-card border-border">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-muted-foreground text-sm mb-2 block">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start h-11 rounded-xl border-border hover:bg-muted bg-transparent text-foreground"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          {endDate ? format(endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-card border-border">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStartDate(undefined)
                      setEndDate(undefined)
                    }}
                    className="h-11 rounded-xl border-border hover:bg-muted bg-transparent text-foreground"
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Analysis History card - takes 2 columns */}
              <Card className="border-border bg-card rounded-3xl shadow-sm hover:shadow-md transition-all xl:col-span-2 overflow-hidden relative">
                <div
                  className="absolute top-0 left-0 right-0 h-1 opacity-50"
                  style={{ background: `linear-gradient(90deg, ${TAILADMIN_BLUE}, ${TAILADMIN_PURPLE})` }}
                />
                <CardHeader className="px-6 pt-6 pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${TAILADMIN_BLUE}15, ${TAILADMIN_PURPLE}15)` }}
                    >
                      <Activity className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-foreground">
                        Analysis History ({filteredAnalyses.length})
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Click an analysis to view details
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-3">
                      {sortedAnalyses.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No analyses found in selected date range
                        </div>
                      ) : (
                        sortedAnalyses.map((analysis) => (
                          <div
                            key={analysis.id}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${
                              selectedAnalysisId === analysis.id
                                ? "border-2 bg-blue-50/50 dark:bg-blue-950/30"
                                : "border-border bg-card hover:border-blue-300 dark:hover:border-blue-700 hover:bg-muted/50"
                            }`}
                            style={selectedAnalysisId === analysis.id ? { borderColor: TAILADMIN_BLUE } : {}}
                            onClick={() => setSelectedAnalysisId(analysis.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-foreground">
                                  {formatDate(analysis.analysisDate)}
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" />
                                    {analysis.totalTranscripts} transcripts
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    {(analysis.conversionRate * 100).toFixed(1)}% conversion
                                  </span>
                                  <span className={getSentimentColor(analysis.averageSentiment)}>
                                    {getSentimentLabel(analysis.averageSentiment)}
                                  </span>
                                </div>
                              </div>
                              {analysis.reportUrl && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    downloadReport(analysis.reportUrl!.split("/").pop()!)
                                  }}
                                  className="rounded-lg hover:bg-muted"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="border-border bg-card rounded-3xl shadow-sm overflow-hidden relative">
                <div
                  className="absolute top-0 left-0 right-0 h-1 opacity-50"
                  style={{ background: `linear-gradient(90deg, ${TAILADMIN_PURPLE}, ${TAILADMIN_EMERALD})` }}
                />
                <CardHeader className="px-6 pt-6 pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${TAILADMIN_PURPLE}15, ${TAILADMIN_EMERALD}15)` }}
                    >
                      <BarChart3 className="w-5 h-5" style={{ color: TAILADMIN_PURPLE }} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-foreground">Token Usage</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Daily AI token consumption
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {tokenUsageData.length > 0 ? (
                    <TailAdminBarChart
                      title=""
                      data={tokenUsageData.map((d) => ({
                        name: d.date,
                        value: d.tokens,
                      }))}
                      height={200}
                      series1Label="Tokens"
                    />
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                      No token usage data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {selectedAnalysisId && analysisDetails && !isLoadingDetails && (
              <div className="grid gap-6 md:grid-cols-3">
                {/* Conversion Rate Card */}
                <Card className="border-border bg-card rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div
                    className="h-1"
                    style={{ background: `linear-gradient(90deg, ${TAILADMIN_BLUE}, ${TAILADMIN_BLUE}80)` }}
                  />
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${TAILADMIN_BLUE}15, ${TAILADMIN_BLUE}25)` }}
                      >
                        <Target className="w-6 h-6" style={{ color: TAILADMIN_BLUE }} />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">Conversion Rate</span>
                    </div>
                    <p className="text-4xl font-bold" style={{ color: TAILADMIN_BLUE }}>
                      {(analysisDetails.conversionRate * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Success ratio of conversations</p>
                  </CardContent>
                </Card>

                {/* Sentiment Card */}
                <Card className="border-border bg-card rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div
                    className="h-1"
                    style={{ background: `linear-gradient(90deg, ${TAILADMIN_EMERALD}, ${TAILADMIN_EMERALD}80)` }}
                  />
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${TAILADMIN_EMERALD}15, ${TAILADMIN_EMERALD}25)`,
                        }}
                      >
                        <Zap className="w-6 h-6" style={{ color: TAILADMIN_EMERALD }} />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">Avg Sentiment</span>
                    </div>
                    <p className={`text-4xl font-bold ${getSentimentColor(analysisDetails.averageSentiment)}`}>
                      {getSentimentLabel(analysisDetails.averageSentiment)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Score: {analysisDetails.averageSentiment.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                {/* Transcripts Card */}
                <Card className="border-border bg-card rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div
                    className="h-1"
                    style={{ background: `linear-gradient(90deg, ${TAILADMIN_PURPLE}, ${TAILADMIN_PURPLE}80)` }}
                  />
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${TAILADMIN_PURPLE}15, ${TAILADMIN_PURPLE}25)` }}
                      >
                        <PieChart className="w-6 h-6" style={{ color: TAILADMIN_PURPLE }} />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">Transcripts Analyzed</span>
                    </div>
                    <p className="text-4xl font-bold" style={{ color: TAILADMIN_PURPLE }}>
                      {analysisDetails.totalTranscripts}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Total conversations processed</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedAnalysisId && analysisDetails && !isLoadingDetails && (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Primary hexagon chart for keywords */}
                <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div
                    className="h-1"
                    style={{ background: `linear-gradient(90deg, ${TAILADMIN_BLUE}, ${TAILADMIN_PURPLE})` }}
                  />
                  <div className="px-6 py-5 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${TAILADMIN_BLUE}15, ${TAILADMIN_PURPLE}15)` }}
                      >
                        <FileText className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Keywords Analysis</h3>
                        <p className="text-sm text-muted-foreground">Business-relevant terms identified by AI</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <KeywordHexagonChart keywords={analysisDetails.keywords} />
                  </div>
                </div>

                <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div
                    className="h-1"
                    style={{ background: `linear-gradient(90deg, ${TAILADMIN_PURPLE}, ${TAILADMIN_BLUE})` }}
                  />
                  <div className="px-6 py-5 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${TAILADMIN_PURPLE}15, ${TAILADMIN_BLUE}15)` }}
                      >
                        <Activity className="w-5 h-5" style={{ color: TAILADMIN_PURPLE }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Analysis Trends</h3>
                        <p className="text-sm text-muted-foreground">Conversion rate and sentiment over time</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    {sortedAnalyses.length > 1 ? (
                      <TailAdminSmoothLineChart
                        title=""
                        data={sortedAnalyses
                          .slice(0, 12)
                          .reverse()
                          .map((a) => ({
                            name: new Date(a.analysisDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            }),
                            value1: Math.round(a.conversionRate * 100),
                            value2: Math.round((a.averageSentiment + 1) * 50), // Normalize -1 to 1 => 0 to 100
                          }))}
                        height={300}
                        series1Label="Conversion %"
                        series2Label="Sentiment Score"
                      />
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Run more analyses to see trends
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Phrases with Advanced Hexagon Chart */}
                <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all lg:col-span-2">
                  <div
                    className="h-1"
                    style={{
                      background: `linear-gradient(90deg, ${TAILADMIN_EMERALD}, ${TAILADMIN_BLUE}, ${TAILADMIN_PURPLE})`,
                    }}
                  />
                  <div className="px-6 py-5 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${TAILADMIN_EMERALD}15, ${TAILADMIN_BLUE}15)` }}
                      >
                        <MessageSquare className="w-5 h-5" style={{ color: TAILADMIN_EMERALD }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Key Phrases</h3>
                        <p className="text-sm text-muted-foreground">
                          Important phrases and expressions found in conversations
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    {analysisDetails.keyphrases && analysisDetails.keyphrases.length > 0 ? (
                      <div className="grid gap-6 lg:grid-cols-2">
                        {/* Advanced Hexagon Chart for keyphrases */}
                        <div className="lg:col-span-1">
                          <AdvancedHexagonChart
                            keywords={analysisDetails.keyphrases.slice(0, 6).map((kp) => ({
                              id: kp.id,
                              keyword: kp.keyphrase,
                              frequency: kp.frequency,
                              relevanceScore: kp.relevanceScore,
                            }))}
                            height={280}
                            showLegend={true}
                          />
                        </div>
                        {/* Keyphrase list */}
                        <div className="lg:col-span-1">
                          <div className="grid gap-3 sm:grid-cols-2">
                            {analysisDetails.keyphrases.slice(0, 8).map((kp) => (
                              <div
                                key={kp.id}
                                className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <span className="font-medium text-foreground text-sm">{kp.keyphrase}</span>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                                  >
                                    {Math.round(kp.relevanceScore * 100)}%
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>Frequency: {kp.frequency}</span>
                                </div>
                                {kp.context && (
                                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{kp.context}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No key phrases available for this analysis
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isLoadingDetails && selectedAnalysisId && (
              <div className="grid gap-6 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-40 rounded-3xl" />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
