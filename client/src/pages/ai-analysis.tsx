import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Brain, Download, TrendingUp, TrendingDown, FileText, Hash, MessageSquare, Sparkles, BarChart3, Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import {
  ResponsiveContainer,
  LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Legend, Tooltip, CartesianGrid, XAxis, YAxis, BarChart, Bar
} from "recharts";

interface Analysis {
  id: string;
  projectId: string;
  analysisDate: string;
  conversionRate: number;
  averageSentiment: number;
  totalTranscripts: number;
  reportUrl?: string;
  createdAt: string;
  insights?: string[];
  patterns?: string[];
}

interface AnalysisDetails extends Analysis {
  keywords: Array<{
    id: string;
    keyword: string;
    frequency: number;
    relevanceScore: number;
    category?: string;
  }>;
  keyphrases: Array<{
    id: string;
    keyphrase: string;
    frequency: number;
    relevanceScore: number;
    context?: string;
  }>;
}

interface UsageRecord {
  id: string;
  accountId: string;
  amount: string;
  tokens: number;
  category: string;
  description: string;
  metadata: string;
  createdAt: string | Date;
}

export default function AiAnalysis() {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Fetch account balance
  const { data: account } = useQuery({
    queryKey: ["/api/account"],
  });

  // Fetch all analyses
  const { data: analyses = [], isLoading: isLoadingAnalyses } = useQuery<Analysis[]>({
    queryKey: ["/api/ai-analysis"],
  });

  // Fetch usage records for token chart
  const { data: usageRecords = [] } = useQuery<UsageRecord[]>({
    queryKey: ["/api/usage-records"],
  });

  // Filter analyses by date range
  const filteredAnalyses = analyses.filter((analysis) => {
    const analysisDate = new Date(analysis.analysisDate);
    if (startDate && analysisDate < startDate) return false;
    if (endDate && analysisDate > endDate) return false;
    return true;
  });

  // Sort analyses by date (newest first)
  const sortedAnalyses = [...filteredAnalyses].sort(
    (a, b) => new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime()
  );

  // Always select the latest analysis (or first if none selected)
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);

  useEffect(() => {
    if (sortedAnalyses.length > 0 && !selectedAnalysisId) {
      setSelectedAnalysisId(sortedAnalyses[0].id);
    }
  }, [sortedAnalyses, selectedAnalysisId]);

  // Fetch specific analysis details
  const { data: analysisDetails, isLoading: isLoadingDetails } = useQuery<AnalysisDetails>({
    queryKey: [`/api/ai-analysis/${selectedAnalysisId}`],
    enabled: !!selectedAnalysisId,
  });

  // Run analysis mutation
  const runAnalysis = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai-analysis/analyze", {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        // Preserve the error code and details for better error handling
        const errorObj = new Error(error.error || "Failed to run analysis");
        (errorObj as any).code = error.code;
        (errorObj as any).details = error;
        throw errorObj;
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-analysis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage-records"] });
      setSelectedAnalysisId(data.analysis.id);
    },
  });

  // Calculate remaining balance
  const creditLimit = account ? parseFloat(account.creditLimit || "0") : 0;
  const creditsUsed = account ? parseFloat(account.creditsUsed || "0") : 0;
  const remainingBalance = creditLimit - creditsUsed;

  const downloadReport = (filename: string) => {
    window.open(`/api/ai-analysis/report/${filename}`, "_blank");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 0.3) return "text-green-500";
    if (sentiment >= -0.3) return "text-yellow-500";
    return "text-red-500";
  };

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment >= 0.3) return "Positive";
    if (sentiment >= -0.3) return "Neutral";
    return "Negative";
  };

  // Prepare token usage chart data (grouped by date)
  const tokenUsageData = (() => {
    const grouped = new Map<string, number>();
    usageRecords.forEach((record) => {
      const date = new Date(record.createdAt).toLocaleDateString();
      const tokens = record.tokens || 0;
      grouped.set(date, (grouped.get(date) || 0) + tokens);
    });
    return Array.from(grouped.entries())
      .map(([date, tokens]) => ({ date, tokens }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days
  })();

  // Prepare conversion & sentiment trend data
  // Use actual timestamps for proper time-based ordering
  const trendData = sortedAnalyses
    .slice()
    .sort((a, b) => new Date(a.analysisDate).getTime() - new Date(b.analysisDate).getTime())
    .map((a) => {
      const date = new Date(a.analysisDate);
      return {
        date: format(date, "MMM dd, yyyy"),
        timestamp: date.getTime(), // Keep timestamp for proper sorting
        conversion: Math.round(a.conversionRate * 100),
        sentiment: Math.round(a.averageSentiment * 100),
      };
    });

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8" />
              AI Transcript Analysis
            </h1>
            <p className="text-muted-foreground mt-2">
              Analyze Voiceflow transcripts with AI to discover insights, keywords, and patterns
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => runAnalysis.mutate()}
            disabled={runAnalysis.isPending || remainingBalance <= 0}
            className="gap-2"
          >
            {runAnalysis.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Run New Analysis
              </>
            )}
          </Button>
        </div>

        {remainingBalance <= 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Insufficient Balance:</strong> You don't have enough balance to run an AI analysis. 
              Please add credits to your account in the Cost Management page.
              <br />
              <span className="text-sm mt-1 block">
                Current balance: ${remainingBalance.toFixed(2)}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {runAnalysis.error && (
          <Alert variant="destructive">
            <AlertDescription>
              {runAnalysis.error instanceof Error ? (
                <>
                  {runAnalysis.error.message}
                  {(runAnalysis.error as any).code === "INSUFFICIENT_BALANCE" && (runAnalysis.error as any).details && (
                    <div className="mt-2 text-sm">
                      <p>Estimated cost: ${(runAnalysis.error as any).details.estimatedCostUsd}</p>
                      <p>Your balance: ${(runAnalysis.error as any).details.remainingBalance}</p>
                      <p className="mt-2">
                        Please add credits to your account in the <strong>Cost Management</strong> page.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                "An error occurred"
              )}
            </AlertDescription>
          </Alert>
        )}

        {runAnalysis.isPending && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription className="ml-2">
              Fetching transcripts from Voiceflow and analyzing with AI... This may take a few minutes.
            </AlertDescription>
          </Alert>
        )}

        {isLoadingAnalyses ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : analyses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No analyses yet</h3>
              <p className="text-muted-foreground mb-4">
                Click "Run New Analysis" to analyze your transcripts with AI
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Date Range Filter */}
            <Card>
              <CardHeader>
                <CardTitle>Filter Analyses by Date</CardTitle>
                <CardDescription>Select a date range to filter analyses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStartDate(undefined);
                      setEndDate(undefined);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Main Content: Charts + Scroll Box + Charts */}
            <div className="grid grid-cols-12 gap-4">
              {/* Left Chart - AI Token Usage */}
              <div className="col-span-12 lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">AI Token Usage</CardTitle>
                    <CardDescription className="text-xs">Last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tokenUsageData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={tokenUsageData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(value: any) => [`${value.toLocaleString()} tokens`, "Tokens"]} />
                          <Bar dataKey="tokens" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                        No usage data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Middle: Scroll Box with Analyses List */}
              <div className="col-span-12 lg:col-span-9">
                <Card>
                  <CardHeader>
                    <CardTitle>Analysis History ({filteredAnalyses.length})</CardTitle>
                    <CardDescription>Click an analysis to view details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {sortedAnalyses.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            No analyses found in selected date range
                          </div>
                        ) : (
                          sortedAnalyses.map((analysis) => (
                            <Card
                              key={analysis.id}
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                selectedAnalysisId === analysis.id ? "ring-2 ring-primary ring-offset-2" : ""
                              }`}
                              onClick={() => setSelectedAnalysisId(analysis.id)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">
                                      {formatDate(analysis.analysisDate)}
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                      <span>{analysis.totalTranscripts} transcripts</span>
                                      <span>{(analysis.conversionRate * 100).toFixed(1)}% conversion</span>
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
                                        e.stopPropagation();
                                        downloadReport(analysis.reportUrl!.split("/").pop()!);
                                      }}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

            </div>

            {/* Analysis Details */}
            {selectedAnalysisId && (
              <>
                {isLoadingDetails ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="space-y-4">
                        <Skeleton className="h-8 w-3/4 mx-auto" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ) : analysisDetails ? (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {(analysisDetails.conversionRate * 100).toFixed(1)}%
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Success ratio of conversations
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Average Sentiment</CardTitle>
                          {analysisDetails.averageSentiment >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className={`text-2xl font-bold ${getSentimentColor(analysisDetails.averageSentiment)}`}>
                            {getSentimentLabel(analysisDetails.averageSentiment)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Score: {analysisDetails.averageSentiment.toFixed(2)} (Scale: -1 to 1)
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Transcripts Analyzed</CardTitle>
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{analysisDetails.totalTranscripts}</div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(analysisDetails.analysisDate)}
                          </p>
                        </CardContent>
                      </Card>
                    </div>


                    {/* Insights and Patterns */}
                    {(analysisDetails.insights || analysisDetails.patterns) && (
                      <div className="grid gap-4 md:grid-cols-2">
                        {analysisDetails.insights && analysisDetails.insights.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5" />
                                Key Insights
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ScrollArea className="max-h-[400px]">
                                <ul className="space-y-3">
                                  {analysisDetails.insights.map((insight, index) => (
                                    <li key={index} className="flex gap-2">
                                      <span className="text-primary font-semibold">{index + 1}.</span>
                                      <span>{insight}</span>
                                    </li>
                                  ))}
                                </ul>
                              </ScrollArea>
                            </CardContent>
                          </Card>
                        )}

                        {analysisDetails.patterns && analysisDetails.patterns.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Identified Patterns
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ScrollArea className="max-h-[400px]">
                                <ul className="space-y-3">
                                  {analysisDetails.patterns.map((pattern, index) => (
                                    <li key={index} className="flex gap-2">
                                      <span className="text-primary font-semibold">{index + 1}.</span>
                                      <span>{pattern}</span>
                                    </li>
                                  ))}
                                </ul>
                              </ScrollArea>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}

                    {/* Keywords and Keyphrases */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Hash className="h-5 w-5" />
                          Keywords & Keyphrases
                        </CardTitle>
                        <CardDescription>Business-relevant terms and phrases identified by AI</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Tabs defaultValue="keywords">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="keywords">
                              Keywords ({analysisDetails.keywords?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value="keyphrases">
                              Keyphrases ({analysisDetails.keyphrases?.length || 0})
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="keywords" className="mt-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Hexagon Radar for top keywords */}
                              {analysisDetails.keywords && analysisDetails.keywords.length > 0 && (
                                <ResponsiveContainer width="100%" height={360}>
                                  <RadarChart
                                    data={analysisDetails.keywords
                                      .sort((a, b) => (b.relevanceScore * b.frequency) - (a.relevanceScore * a.frequency))
                                      .slice(0, 8)
                                      .map((kw) => ({
                                        subject: kw.keyword.length > 18 ? kw.keyword.substring(0, 18) + '…' : kw.keyword,
                                        score: Math.round(kw.relevanceScore * 100),
                                        frequency: Math.min(100, Math.round(kw.frequency / (analysisDetails.totalTranscripts || 1) * 100)),
                                      }))}
                                    outerRadius={120}
                                  >
                                    <PolarGrid gridType="polygon" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[-20, 20]} tickFormatter={(v) => `${v}%`} />
                                    <Radar name="Relevance %" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.35} />
                                    <Radar name="Frequency %" dataKey="frequency" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                                    <Legend />
                                    <Tooltip formatter={(value: any, name: string) => [`${value}%`, name]} />
                                  </RadarChart>
                                </ResponsiveContainer>
                              )}

                              {/* Keyword list */}
                              <ScrollArea className="max-h-[360px]">
                                <div className="space-y-3">
                                  {analysisDetails.keywords?.map((kw) => (
                                    <div key={kw.id} className="flex items-center justify-between p-3 border rounded-lg">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold">{kw.keyword}</span>
                                          {kw.category && (
                                            <Badge variant="outline" className="text-xs">
                                              {kw.category}
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                          Frequency: {kw.frequency}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-sm font-medium">
                                          {(kw.relevanceScore * 100).toFixed(0)}%
                                        </div>
                                        <div className="text-xs text-muted-foreground">Relevance</div>
                                      </div>
                                    </div>
                                  ))}
                                  {(!analysisDetails.keywords || analysisDetails.keywords.length === 0) && (
                                    <div className="text-center py-8 text-muted-foreground">
                                      No keywords found
                                    </div>
                                  )}
                                </div>
                              </ScrollArea>
                            </div>
                          </TabsContent>

                          <TabsContent value="keyphrases" className="mt-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Hexagon Radar for top keyphrases */}
                              {analysisDetails.keyphrases && analysisDetails.keyphrases.length > 0 && (
                                <ResponsiveContainer width="100%" height={360}>
                                  <RadarChart
                                    data={analysisDetails.keyphrases
                                      .sort((a, b) => (b.relevanceScore * b.frequency) - (a.relevanceScore * a.frequency))
                                      .slice(0, 8)
                                      .map((kp) => ({
                                        subject: kp.keyphrase.length > 18 ? kp.keyphrase.substring(0, 18) + '…' : kp.keyphrase,
                                        score: Math.round(kp.relevanceScore * 100),
                                        frequency: Math.min(100, Math.round(kp.frequency / (analysisDetails.totalTranscripts || 1) * 100)),
                                      }))}
                                    outerRadius={120}
                                  >
                                    <PolarGrid gridType="polygon" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[-20, 20]} tickFormatter={(v) => `${v}%`} />
                                    <Radar name="Relevance %" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.35} />
                                    <Radar name="Frequency %" dataKey="frequency" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                                    <Legend />
                                    <Tooltip formatter={(value: any, name: string) => [`${value}%`, name]} />
                                  </RadarChart>
                                </ResponsiveContainer>
                              )}

                              {/* Keyphrase list */}
                              <ScrollArea className="max-h-[360px]">
                                <div className="space-y-3">
                                  {analysisDetails.keyphrases?.map((kp) => (
                                    <div key={kp.id} className="p-3 border rounded-lg">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="font-semibold">{kp.keyphrase}</div>
                                          {kp.context && (
                                            <p className="text-sm text-muted-foreground mt-1">{kp.context}</p>
                                          )}
                                          <div className="text-sm text-muted-foreground mt-1">
                                            Frequency: {kp.frequency}
                                          </div>
                                        </div>
                                        <div className="text-right ml-4">
                                          <div className="text-sm font-medium">
                                            {(kp.relevanceScore * 100).toFixed(0)}%
                                          </div>
                                          <div className="text-xs text-muted-foreground">Relevance</div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  {(!analysisDetails.keyphrases || analysisDetails.keyphrases.length === 0) && (
                                    <div className="text-center py-8 text-muted-foreground">
                                      No keyphrases found
                                    </div>
                                  )}
                                </div>
                              </ScrollArea>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>

                    {/* Download Report */}
                    {analysisDetails.reportUrl && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Analysis Report
                          </CardTitle>
                          <CardDescription>Download the complete analysis report</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button
                            onClick={() => downloadReport(analysisDetails.reportUrl!.split("/").pop()!)}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download Report
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
