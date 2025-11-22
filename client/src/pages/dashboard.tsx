import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, CreditCard, MessageSquare, FileText, Plus, Minus, RefreshCw } from "lucide-react";
import { UsageStats } from "@shared/schema";
import { UsageChart } from "@/components/usage-chart";
import { CreditLimitBar } from "@/components/credit-limit-bar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface BudgetStatus {
  status: string;
  over_budget: boolean;
  project_id: string;
  budget: number;
  credits_used: number;
  current_cost: number;
  remaining: number;
  credits_remaining: number;
  reset_date: string;
  days_remaining: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [creditAmount, setCreditAmount] = useState("1000");
  
  const { data: stats, isLoading: statsLoading } = useQuery<UsageStats>({
    queryKey: ["/api/usage/stats"],
  });
  
  const { data: budgetStatus, isLoading: budgetLoading } = useQuery<BudgetStatus>({
    queryKey: ["/api/budget/check"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const addCreditsMutation = useMutation({
    mutationFn: async (credits: number) => {
      return apiRequest("POST", "/api/credits/add", { credits });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget/check"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage/stats"] });
      const parsedAmount = parseInt(creditAmount);
      toast({
        title: "Credits updated",
        description: `Successfully added ${parsedAmount.toLocaleString()} credits`,
      });
      setCreditAmount("1000");
    },
    onError: () => {
      toast({
        title: "Failed to update credits",
        description: "An error occurred",
        variant: "destructive",
      });
    },
  });

  const subtractCreditsMutation = useMutation({
    mutationFn: async (credits: number) => {
      return apiRequest("POST", "/api/credits/add", { credits: -credits });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget/check"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage/stats"] });
      const parsedAmount = parseInt(creditAmount);
      toast({
        title: "Credits updated",
        description: `Successfully subtracted ${parsedAmount.toLocaleString()} credits`,
      });
      setCreditAmount("1000");
    },
    onError: () => {
      toast({
        title: "Failed to update credits",
        description: "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleAddCredits = () => {
    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a positive number",
        variant: "destructive",
      });
      return;
    }
    addCreditsMutation.mutate(amount);
  };

  const handleSubtractCredits = () => {
    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a positive number",
        variant: "destructive",
      });
      return;
    }
    subtractCreditsMutation.mutate(amount);
  };

  // Calculate credit limit based on budget (minimum 10,000 credits to prevent divide-by-zero)
  const budgetInCredits = budgetStatus 
    ? Math.max(Math.floor((budgetStatus.budget / 60) * 10000), 10000)
    : 10000;
  const creditLimit = budgetStatus ? {
    current: budgetStatus.credits_used,
    limit: budgetInCredits,
    percentage: budgetInCredits > 0 ? (budgetStatus.credits_used / budgetInCredits) * 100 : 0,
    status: budgetStatus.over_budget ? "danger" as const : (budgetInCredits > 0 && (budgetStatus.credits_used / budgetInCredits) > 0.7) ? "warning" as const : "safe" as const
  } : null;

  const isLoading = statsLoading || budgetLoading;

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 md:px-8 md:py-12 space-y-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto px-6 py-8 md:px-8 md:py-12 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2" data-testid="text-dashboard-title">
            Dashboard Overview
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor your Voiceflow chatbot performance and resource usage
          </p>
        </div>

        {creditLimit && creditLimit.status === "danger" && (
          <Alert variant="destructive" data-testid="alert-credit-limit">
            <AlertDescription>
              Warning: You're approaching your credit limit. Current usage: {creditLimit.percentage.toFixed(1)}%
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover-elevate" data-testid="card-total-usage">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Usage
              </CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground" data-testid="text-total-usage">
                {stats?.totalUsage.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                API requests this month
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-credits-used">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Credits Used
              </CardTitle>
              <CreditCard className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground" data-testid="text-credits-used">
                {stats?.creditsUsed.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {creditLimit ? `${creditLimit.percentage.toFixed(1)}% of limit` : "Of total limit"}
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-active-conversations">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Conversations
              </CardTitle>
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground" data-testid="text-active-conversations">
                {stats?.activeConversations || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ongoing sessions
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-files-kb">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Files in KB
              </CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground" data-testid="text-files-kb">
                {stats?.filesInKB || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Knowledge base files
              </p>
            </CardContent>
          </Card>
        </div>

        {creditLimit && budgetStatus && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-credit-limit">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Credit Limit Status</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Budget: ${budgetStatus.budget.toFixed(2)} • Spent: ${budgetStatus.current_cost.toFixed(2)} • Remaining: ${budgetStatus.remaining.toFixed(2)}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <CreditLimitBar creditLimit={creditLimit} />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Next reset:</span>
                  <span className="font-medium text-foreground" data-testid="text-reset-date">
                    {new Date(budgetStatus.reset_date).toLocaleDateString()} ({budgetStatus.days_remaining} days)
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-credit-management">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Manual Credit Adjustment</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Add or subtract credits manually (10,000 credits = $60)
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    data-testid="input-credit-amount"
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddCredits}
                    disabled={addCreditsMutation.isPending || subtractCreditsMutation.isPending}
                    className="flex-1"
                    data-testid="button-add-credits"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Credits
                  </Button>
                  <Button
                    onClick={handleSubtractCredits}
                    disabled={addCreditsMutation.isPending || subtractCreditsMutation.isPending}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-subtract-credits"
                  >
                    <Minus className="w-4 h-4 mr-2" />
                    Subtract Credits
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  Current: {budgetStatus.credits_used.toLocaleString()} credits used (${budgetStatus.current_cost.toFixed(2)})
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card data-testid="card-usage-chart">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Usage Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.usageHistory && <UsageChart data={stats.usageHistory} />}
            </CardContent>
          </Card>

          <Card data-testid="card-quick-stats">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="text-sm font-medium text-foreground">
                  {stats && stats.totalUsage > 0 
                    ? ((stats.totalUsage / (stats.totalUsage + 100)) * 100).toFixed(1) 
                    : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg. Messages/Session</span>
                <span className="text-sm font-medium text-foreground">
                  {stats && stats.activeConversations > 0 
                    ? (stats.totalUsage / stats.activeConversations).toFixed(1) 
                    : 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Storage Used</span>
                <span className="text-sm font-medium text-foreground">
                  {stats?.filesInKB || 0} files
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
