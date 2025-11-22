import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { UsagePanel } from "@/components/usage-panel";
import { MetricCard } from "@/components/metric-card";
import { ResetTimer } from "@/components/reset-timer";
import { SimulateUsageModal } from "@/components/simulate-usage-modal";
import { BuyCreditsModal } from "@/components/buy-credits-modal";
import { TopUpModal } from "@/components/top-up-modal";
import { Button } from "@/components/ui/button";
import { Brain, Zap, DollarSign, TrendingUp, RefreshCw, TestTube, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UsageData {
  openai: {
    tokensUsed: number;
    costUsd: number;
    systemCost: number;
    tokensChange?: number;
    costChange?: number;
  };
  chatbot: {
    creditsUsed: number;
    creditsTotal: number;
    creditsRemaining: number;
    creditsChange?: number;
  };
  account: {
    initialBalance: number;
    remainingBalance: number;
    resetAt: string;
  };
}

// Note: No multiplier - using actual OpenAI costs
const CHATBOT_RATE = 5000 / 30; // 5000 credits per $30

export default function Cost() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [purchaseType, setPurchaseType] = useState<"chatbot" | "openai" | null>(null);
  const [topUpType, setTopUpType] = useState<"balance" | "chatbot_credits">("balance");

  // Fetch account data
  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ["/api/account"],
  });

  // Fetch usage records to calculate OpenAI and Chatbot usage
  const { data: usageRecords, isLoading: usageLoading } = useQuery({
    queryKey: ["/api/usage-records"],
  });

  // Calculate usage data from records with month-over-month comparisons
  const usageData: UsageData | null = account && usageRecords ? (() => {
    const creditLimit = parseFloat(account.creditLimit || "0");
    const creditsUsed = parseFloat(account.creditsUsed || "0");
    
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    // Calculate OpenAI usage from usage records
    let openaiTokensUsed = 0;
    let openaiCostUsd = 0;
    let openaiTokensUsedPrevMonth = 0;
    let openaiCostUsdPrevMonth = 0;
    
    usageRecords.forEach((record: any) => {
      const recordDate = new Date(record.createdAt);
      const isCurrentMonth = recordDate >= currentMonth;
      const isPreviousMonth = recordDate >= previousMonth && recordDate < currentMonth;
      
      // OpenAI usage typically has tokens and is in api_calls category
      if (record.tokens && (record.category === "api_calls" || record.description?.toLowerCase().includes("openai"))) {
        const recordCost = (record.tokens / 1000) * 0.002;
        
        if (isCurrentMonth) {
          openaiTokensUsed += record.tokens || 0;
          openaiCostUsd += recordCost;
        } else if (isPreviousMonth) {
          openaiTokensUsedPrevMonth += record.tokens || 0;
          openaiCostUsdPrevMonth += recordCost;
        }
      }
    });
    
    // Calculate percentage changes
    const openaiTokensChange = openaiTokensUsedPrevMonth > 0
      ? ((openaiTokensUsed - openaiTokensUsedPrevMonth) / openaiTokensUsedPrevMonth) * 100
      : 0;
    const openaiCostChange = openaiCostUsdPrevMonth > 0
      ? ((openaiCostUsd - openaiCostUsdPrevMonth) / openaiCostUsdPrevMonth) * 100
      : 0;

    // No multiplier - use actual cost
    const openaiSystemCost = openaiCostUsd;

    // Get Chatbot credits from account (separate from balance)
    const chatbotCreditsTotal = parseFloat(account.voiceflowCredits || "0");
    const chatbotCreditsUsed = parseFloat(account.voiceflowCreditsUsed || "0");
    const chatbotCreditsRemaining = chatbotCreditsTotal - chatbotCreditsUsed;

    // For chatbot credits, we'd need historical data - for now use 0 or calculate from usage records
    // Calculate chatbot usage from records
    let chatbotCreditsUsedPrevMonth = 0;
    usageRecords.forEach((record: any) => {
      const recordDate = new Date(record.createdAt);
      const isPreviousMonth = recordDate >= previousMonth && recordDate < currentMonth;
      
      if (isPreviousMonth && record.description?.toLowerCase().includes("chatbot")) {
        // Estimate credits used from cost (if available)
        // This is approximate since we don't have exact credit tracking per record
        chatbotCreditsUsedPrevMonth += parseFloat(record.amount || "0") / 0.006;
      }
    });
    
    const chatbotCreditsChange = chatbotCreditsUsedPrevMonth > 0
      ? ((chatbotCreditsUsed - chatbotCreditsUsedPrevMonth) / chatbotCreditsUsedPrevMonth) * 100
      : 0;

    const remainingBalance = creditLimit - creditsUsed;
    const resetAt = account.billingPeriod?.resetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    return {
      openai: {
        tokensUsed: openaiTokensUsed,
        costUsd: openaiCostUsd,
        systemCost: openaiSystemCost,
        tokensChange: openaiTokensChange,
        costChange: openaiCostChange,
      },
      chatbot: {
        creditsUsed: chatbotCreditsUsed,
        creditsTotal: chatbotCreditsTotal,
        creditsRemaining: chatbotCreditsRemaining,
        creditsChange: chatbotCreditsChange,
      },
      account: {
        initialBalance: creditLimit,
        remainingBalance,
        resetAt,
      },
    };
  })() : null;

  // Sync Chatbot usage mutation
  const syncChatbotMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/usage/sync-voiceflow", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to sync chatbot usage");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/usage-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
      // Don't show toast on auto-sync, only on manual sync
    },
    onError: (error: any) => {
      // Don't show error toast on auto-sync
      console.error("Auto-sync failed:", error);
    },
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await fetch("/api/account/update-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update plan");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate all related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage-records"] });
      toast({
        title: "Plan Updated",
        description: "Your plan has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update plan",
        variant: "destructive",
      });
    },
  });

  // Auto-sync Chatbot usage on mount (only once)
  useEffect(() => {
    syncChatbotMutation.mutate();
  }, []); // Empty dependency array means this runs once on mount

  // Reset mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      // Use projectId from session instead of account id
      const res = await fetch("/api/budget/reset/" + (account?.id || "default"), {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to reset");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage-records"] });
      toast({
        title: "Usage reset",
        description: "Usage has been reset successfully",
      });
    },
    onError: () => {
      toast({
        title: "Reset failed",
        description: "Failed to reset usage",
        variant: "destructive",
      });
    },
  });

  const isLoading = accountLoading || usageLoading;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground">Loading usage data...</p>
        </div>
      </div>
    );
  }

  if (!usageData) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">No usage data available</p>
        </div>
      </div>
    );
  }


  return (
    <div className="h-full overflow-auto bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Usage & Cost Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your OpenAI API usage and Chatbot credit usage
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => syncChatbotMutation.mutate()}
              disabled={syncChatbotMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncChatbotMutation.isPending ? 'animate-spin' : ''}`} />
              Sync Chatbot Usage
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowSimulateModal(true)}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Simulate Usage
            </Button>
          </div>
        </div>

        {/* Usage Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <UsagePanel
              title="OpenAI Usage"
              icon={Brain}
              tokensUsed={usageData.openai.costUsd} // Show cost in USD
              maxTokens={usageData.account.initialBalance} // Total balance in USD
              balance={usageData.account.remainingBalance} // Remaining balance in USD
              showUsd={true}
              isLoading={isLoading}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setPurchaseType("openai");
                setShowBuyCreditsModal(true);
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add AI Tokens
            </Button>
          </div>
          <div className="space-y-4">
          <UsagePanel
            title="Chatbot Usage"
            icon={Zap}
            tokensUsed={usageData.chatbot.creditsUsed}
            maxTokens={usageData.chatbot.creditsTotal}
            balance={usageData.chatbot.creditsRemaining}
            isCredits={true}
            isLoading={isLoading}
          />
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                // Temporarily remove Stripe - direct endpoint call
                try {
                  const res = await fetch("/api/purchase/chatbot-credits", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ amount: 30 }), // $30 = 5000 credits
                  });
                  if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || "Purchase failed");
                  }
                  const data = await res.json();
                  toast({
                    title: "Purchase Successful",
                    description: `Successfully purchased ${data.credits.toLocaleString()} chatbot credits!`,
                  });
                  queryClient.invalidateQueries({ queryKey: ["/api/account"] });
                } catch (error: any) {
                  toast({
                    title: "Purchase Failed",
                    description: error.message || "An error occurred",
                    variant: "destructive",
                  });
                }
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Buy Chatbot Credits
            </Button>
          </div>
        </div>


        {/* Reset Timer */}
        <div className="mb-8">
          <ResetTimer
            resetAt={usageData.account.resetAt}
            onAccelerate={() => resetMutation.mutate()}
            isAccelerating={resetMutation.isPending}
          />
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Total Tokens"
            value={usageData.openai.tokensUsed.toLocaleString()}
            subtitle="OpenAI tokens consumed"
            icon={Brain}
            percentageChange={usageData.openai.tokensChange}
          />
          <MetricCard
            title="Total Credits"
            value={usageData.chatbot.creditsUsed.toLocaleString()}
            subtitle="Chatbot credits consumed"
            icon={Zap}
            percentageChange={usageData.chatbot.creditsChange}
          />
          <MetricCard
            title="Remaining Balance"
            value={`$${usageData.account.remainingBalance.toFixed(2)}`}
            subtitle={`of $${usageData.account.initialBalance.toFixed(2)}`}
            icon={DollarSign}
            iconColor={
              usageData.account.remainingBalance / usageData.account.initialBalance > 0.5
                ? "text-green-600"
                : usageData.account.remainingBalance / usageData.account.initialBalance > 0.2
                ? "text-yellow-600"
                : "text-red-600"
            }
            progress={{
              current: usageData.account.remainingBalance,
              max: usageData.account.initialBalance,
              showBar: true,
            }}
          />
      </div>

        {/* Simulate Usage Modal */}
        <SimulateUsageModal
          open={showSimulateModal}
          onClose={() => setShowSimulateModal(false)}
        />
        {purchaseType && (
          <BuyCreditsModal
            isOpen={showBuyCreditsModal}
            onClose={() => {
              setShowBuyCreditsModal(false);
              setPurchaseType(null);
            }}
            type={purchaseType}
            currentBalance={usageData?.account.remainingBalance || 0}
          />
        )}
      <TopUpModal 
          isOpen={showTopUpModal}
          onClose={() => setShowTopUpModal(false)}
          currentLimit={usageData?.account.initialBalance || 0}
          creditsUsed={parseFloat(account?.creditsUsed || "0")}
          type={topUpType}
        />
      </div>
    </div>
  );
}
