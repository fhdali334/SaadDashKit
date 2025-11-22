import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { CreditAccount } from "@shared/schema";
import { DollarSign, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface CreditBalanceCardProps {
  account: CreditAccount | undefined;
}

export function CreditBalanceCard({ account }: CreditBalanceCardProps) {
  // Real-time countdown update
  const [, setTick] = useState(0);

  useEffect(() => {
    // Update countdown every 10 seconds to keep it fresh
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (!account) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No account data available</p>
        </CardContent>
      </Card>
    );
  }

  const creditLimit = parseFloat(account.creditLimit);
  const creditsUsed = parseFloat(account.creditsUsed);
  const remaining = creditLimit - creditsUsed;
  const usagePercentage = (creditsUsed / creditLimit) * 100;
  const isOverLimit = remaining < 0;
  
  // Clamp progress bar at 100% for visual display, but show real percentage in text
  const displayPercentage = Math.min(usagePercentage, 100);

  // Calculate real-time countdown from the billingPeriod data
  let displayDays = 0;
  let displayHours = 0;
  let displayMinutes = 0;

  if ((account as any).billingPeriod?.resetDate) {
    const resetTime = new Date((account as any).billingPeriod.resetDate).getTime();
    const now = Date.now();
    const msRemaining = Math.max(0, resetTime - now);

    displayDays = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
    displayHours = Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    displayMinutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
  }

  return (
    <Card className="border-card-border overflow-visible">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Available Credits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className={`text-5xl font-bold ${remaining < 0 ? 'text-destructive' : 'text-foreground'}`} data-testid="text-balance">
              ${Math.abs(remaining).toFixed(2)}
            </span>
            <span className="text-muted-foreground text-lg">
              / ${creditLimit.toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            ${creditsUsed.toFixed(2)} used {remaining < 0 && '(over limit)'}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Usage</span>
            <span className={`font-medium ${isOverLimit ? 'text-destructive' : 'text-foreground'}`}>
              {usagePercentage.toFixed(1)}%{isOverLimit && ' (Over Limit)'}
            </span>
          </div>
          <div className="relative">
            <Progress
              value={displayPercentage}
              className={`h-3 ${isOverLimit ? 'bg-destructive/20' : ''}`}
              data-testid="progress-usage"
            />
            {isOverLimit && (
              <div className="absolute inset-0 h-3 w-full rounded-full bg-destructive opacity-75" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <TrendingUp className={`h-3 w-3 ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`} />
            <span className={isOverLimit ? 'text-destructive font-medium' : 'text-muted-foreground'}>
              {isOverLimit 
                ? "Over limit - payment required" 
                : usagePercentage < 50 
                  ? "Healthy usage" 
                  : usagePercentage < 80 
                    ? "Moderate usage" 
                    : "High usage - consider adding credits"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Period Resets In</p>
            <p className="text-2xl font-semibold text-foreground" data-testid="text-period-reset">
              {(account as any).billingPeriod ? (
                displayDays > 0
                  ? `${displayDays}d ${displayHours}h`
                  : `${displayHours}h ${displayMinutes}m`
              ) : 'N/A'}
            </p>
            {(account as any).billingPeriod && (
              <p className="text-xs text-muted-foreground mt-1">
                {new Date((account as any).billingPeriod.resetDate).toLocaleString()}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Avg. Daily Usage</p>
            <p className="text-2xl font-semibold text-foreground" data-testid="text-avg-daily">
              ${(creditsUsed / 30).toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
