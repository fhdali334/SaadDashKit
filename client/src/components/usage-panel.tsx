import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";

interface UsagePanelProps {
  title: string;
  icon: LucideIcon;
  tokensUsed: number;
  costUsd?: number; // Optional - removed from UI
  systemCost?: number; // Optional - removed from UI
  multiplier?: number;
  maxTokens?: number; // Total balance/limit
  isCredits?: boolean;
  isLoading?: boolean;
  balance?: number; // Current remaining balance (for display)
  showUsd?: boolean; // Show balance in USD format instead of tokens
}

export function UsagePanel({ 
  title, 
  icon: Icon, 
  tokensUsed, 
  costUsd, 
  systemCost, 
  multiplier,
  maxTokens,
  isCredits = false,
  isLoading = false,
  balance,
  showUsd = false
}: UsagePanelProps) {
  // Calculate progress: if maxTokens is set, show usage vs limit
  // If balance is provided, show remaining vs total
  const totalBalance = maxTokens || 0;
  const used = tokensUsed;
  const remaining = balance !== undefined ? balance : (totalBalance - used);
  const progressPercent = totalBalance > 0 ? Math.min((used / totalBalance) * 100, 100) : 0;
  
  // Format function for displaying values
  const formatValue = (value: number) => {
    if (showUsd) {
      return `$${value.toFixed(2)}`;
    }
    return value.toLocaleString();
  };
  
  return (
    <Card data-testid={`card-usage-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
        {multiplier && (
          <Badge variant="secondary" data-testid="badge-multiplier">
            {multiplier}x
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {isCredits ? "Credits Used" : "Tokens Used"}
              </p>
              <Skeleton className="h-8 w-24" />
            </div>
            {maxTokens && <Skeleton className="h-2 w-full" />}
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {isCredits ? "Credits Used" : showUsd ? "Cost" : "Tokens Used"}
                </p>
                <p className="text-lg font-bold font-mono" data-testid={`text-tokens-used-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {showUsd ? `$${used.toFixed(2)}` : used.toLocaleString()}
                </p>
              </div>
              
              {totalBalance > 0 && (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Total Balance</span>
                      <span className="font-semibold">{formatValue(totalBalance)}</span>
                    </div>
                    <Progress 
                      value={progressPercent} 
                      className="h-3" 
                      data-testid={`progress-usage-${title.toLowerCase().replace(/\s+/g, '-')}`} 
                    />
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">
                        {remaining >= 0 ? "Remaining" : "Over Limit"}
                      </span>
                      <span className={`font-semibold ${remaining < 0 ? 'text-red-600' : ''}`}>
                        {formatValue(Math.abs(remaining))}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
