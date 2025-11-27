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
import { AdvancedHexagonChart } from "@/components/advanced-hexagon charts"

import {
  Brain,
  Download,
  TrendingUp,
  FileText,
  MessageSquare,
  Sparkles,
  BarChart3,
  Loader2,
  CalendarIcon,
  Zap,
  Activity,
} from "lucide-react"
import { format } from "date-fns"
import { ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, BarChart, Bar } from "recharts"

const TAILADMIN_BLUE = "#465FFF"
const TAILADMIN_BLUE_LIGHT = "rgba(70, 95, 255, 0.08)"

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
    const grouped = new Map<string, number>()
    usageRecords.forEach((record) => {
      const date = new Date(record.createdAt).toLocaleDateString()
      const tokens = record.tokens || 0
      grouped.set(date, (grouped.get(date) || 0) + tokens)
    })
    return Array.from(grouped.entries())
      .map(([date, tokens]) => ({ date, tokens }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)
  })()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-6 lg:px-8 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: TAILADMIN_BLUE }}
              >
                <Brain className="w-6 h-6 text-white" />
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
              className="h-12 rounded-xl text-white px-6"
              style={{ backgroundColor: TAILADMIN_BLUE }}
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
            <AlertDescription className="ml-2">
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
          <Card className="border-border rounded-2xl">
            <CardContent className="py-16 text-center">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: TAILADMIN_BLUE_LIGHT }}
              >
                <Brain className="w-10 h-10" style={{ color: TAILADMIN_BLUE }} />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">No analyses yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Click "Run New Analysis" to analyze your transcripts with AI
              </p>
              <Button
                onClick={() => runAnalysis.mutate()}
                disabled={runAnalysis.isPending || remainingBalance <= 0}
                className="h-12 rounded-xl text-white px-8"
                style={{ backgroundColor: TAILADMIN_BLUE }}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Start First Analysis
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Date Filter */}
            <Card className="border-border rounded-2xl">
              <CardHeader className="px-6 pt-6 pb-4">
                <CardTitle className="text-lg font-semibold">Filter Analyses by Date</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-muted-foreground text-sm mb-2 block">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start h-11 rounded-xl border-border hover:bg-muted bg-transparent"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          {startDate ? format(startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
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
                          className="w-full justify-start h-11 rounded-xl border-border hover:bg-muted bg-transparent"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          {endDate ? format(endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
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
                    className="h-11 rounded-xl border-border hover:bg-muted"
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Charts and History */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <Card className="border-border rounded-3xl shadow-sm hover:shadow-md transition-all">
                <CardHeader className="px-6 pt-6 pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: TAILADMIN_BLUE_LIGHT }}
                    >
                      <Zap className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">AI Token Usage</CardTitle>
                      <CardDescription className="text-xs">Last 30 days</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  {tokenUsageData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={tokenUsageData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip
                          formatter={(value: any) => [`${value.toLocaleString()} tokens`, "Tokens"]}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "12px",
                          }}
                        />
                        <Bar dataKey="tokens" fill={TAILADMIN_BLUE} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                      No usage data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border rounded-3xl shadow-sm hover:shadow-md transition-all xl:col-span-3">
                <CardHeader className="px-6 pt-6 pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: TAILADMIN_BLUE_LIGHT }}
                    >
                      <Activity className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">
                        Analysis History ({filteredAnalyses.length})
                      </CardTitle>
                      <CardDescription className="text-xs">Click an analysis to view details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <ScrollArea className="h-[200px]">
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
                                ? "border-2 bg-muted/30"
                                : "border-border hover:border-muted-foreground/30"
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
            </div>

            {/* Analysis Details */}
            {selectedAnalysisId && analysisDetails && !isLoadingDetails && (
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-border rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: TAILADMIN_BLUE_LIGHT }}
                      >
                        <BarChart3 className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">Conversion Rate</span>
                    </div>
                    <p className="text-3xl font-bold" style={{ color: TAILADMIN_BLUE }}>
                      {(analysisDetails.conversionRate * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Success ratio of conversations</p>
                  </CardContent>
                </Card>

                <Card className="border-border rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: TAILADMIN_BLUE_LIGHT }}
                      >
                        <MessageSquare className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">Avg Sentiment</span>
                    </div>
                    <p className={`text-3xl font-bold ${getSentimentColor(analysisDetails.averageSentiment)}`}>
                      {getSentimentLabel(analysisDetails.averageSentiment)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Score: {analysisDetails.averageSentiment.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: TAILADMIN_BLUE_LIGHT }}
                      >
                        <FileText className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">Transcripts Analyzed</span>
                    </div>
                    <p className="text-3xl font-bold" style={{ color: TAILADMIN_BLUE }}>
                      {analysisDetails.totalTranscripts}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Total conversations processed</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Keywords and Keyphrases */}
            {selectedAnalysisId && analysisDetails && !isLoadingDetails && (
              <div className="grid gap-6 lg:grid-cols-2">
                <KeywordHexagonChart keywords={analysisDetails.keywords} />
                <AdvancedHexagonChart keywords={analysisDetails.keywords} />

                <Card className="border-border rounded-2xl">
                  <CardHeader className="px-6 pt-6 pb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: TAILADMIN_BLUE_LIGHT }}
                      >
                        <FileText className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">Key Phrases</CardTitle>
                        <CardDescription>Common expressions and patterns</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="space-y-3">
                      {(analysisDetails.keyphrases ?? []).slice(0, 10).map((kp) => (
                        <div key={kp.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                          <span className="text-sm font-medium text-foreground">{kp.keyphrase}</span>
                          <Badge variant="outline" className="rounded-lg">
                            {kp.frequency}x
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
