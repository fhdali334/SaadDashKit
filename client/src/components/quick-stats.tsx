import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Transaction } from "@shared/schema";
import { Activity, CreditCard, TrendingDown } from "lucide-react";

interface QuickStatsProps {
  transactions: Transaction[];
  creditLimit: number;
  creditsUsed: number;
  remaining: number;
}

// Get date range for today
function getTodayDateRange() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date();
  
  return {
    startTime: today.toISOString(),
    endTime: end.toISOString(),
  };
}

// Get date range for last 30 days
function getMonthDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  
  return {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
}

export function QuickStats({ transactions, creditLimit, creditsUsed, remaining }: QuickStatsProps) {
  const [usageToday, setUsageToday] = useState(0);
  const [usageThisMonth, setUsageThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsageData = async () => {
      setLoading(true);
      
      try {
        // Fetch today's usage
        const todayRange = getTodayDateRange();
        const todayParams = new URLSearchParams();
        todayParams.set("metric", "credit_usage");
        todayParams.set("startTime", todayRange.startTime);
        todayParams.set("endTime", todayRange.endTime);
        todayParams.set("limit", "100");
        
        const todayRes = await fetch(`/api/usage?${todayParams.toString()}`);
        const todayJson = await todayRes.json();
        
        if (todayRes.ok) {
          const todayItems = todayJson.items || [];
          const todayTotal = todayItems.reduce((sum: number, item: any) => sum + (item.count || 0), 0);
          setUsageToday(todayTotal);
        }

        // Fetch this month's usage
        const monthRange = getMonthDateRange();
        const monthParams = new URLSearchParams();
        monthParams.set("metric", "credit_usage");
        monthParams.set("startTime", monthRange.startTime);
        monthParams.set("endTime", monthRange.endTime);
        monthParams.set("limit", "100");
        
        const monthRes = await fetch(`/api/usage?${monthParams.toString()}`);
        const monthJson = await monthRes.json();
        
        if (monthRes.ok) {
          const monthItems = monthJson.items || [];
          const monthTotal = monthItems.reduce((sum: number, item: any) => sum + (item.count || 0), 0);
          setUsageThisMonth(monthTotal);
        }
      } catch (error) {
        console.error("Error loading usage data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUsageData();
  }, []);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const purchasesThisMonth = transactions
    .filter(t => t.type === 'purchase' && new Date(t.createdAt) >= thirtyDaysAgo)
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return (
    <div className="space-y-4">
      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Activity className="h-4 w-4" />
            Today's Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-9 flex items-center">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <p className="text-3xl font-bold text-foreground" data-testid="text-usage-today">
              {usageToday.toLocaleString()} credits
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <TrendingDown className="h-4 w-4" />
            This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-9 flex items-center">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <p className="text-3xl font-bold text-foreground" data-testid="text-usage-month">
              {usageThisMonth.toLocaleString()} credits
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            Purchases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-success" data-testid="text-purchases-month">
            ${purchasesThisMonth.toFixed(2)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
