import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Wallet } from "lucide-react";

interface NetCostSummaryProps {
  openaiSystemCost: number;
  voiceflowSystemCost: number;
  netSystemCost: number;
  netCostUsd: number;
  remainingBalance: number;
  initialBalance: number;
}

export function NetCostSummary({ 
  openaiSystemCost, 
  voiceflowSystemCost, 
  netSystemCost,
  netCostUsd,
  remainingBalance,
  initialBalance
}: NetCostSummaryProps) {
  const balancePercent = initialBalance > 0 ? (remainingBalance / initialBalance) * 100 : 0;
  const getBalanceColor = () => {
    if (balancePercent > 50) return "text-green-600";
    if (balancePercent > 20) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card data-testid="card-net-cost">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Net Cost Summary
        </CardTitle>
        <Badge variant="secondary" data-testid="badge-balance-percent">
          {balancePercent.toFixed(1)}% Remaining
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 pb-4 border-b">
          <div>
            <p className="text-sm text-muted-foreground mb-1">OpenAI Cost</p>
            <p className="text-lg font-bold font-mono" data-testid="text-openai-total">
              ${openaiSystemCost.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Voiceflow Cost</p>
            <p className="text-lg font-bold font-mono" data-testid="text-voiceflow-total">
              ${voiceflowSystemCost.toFixed(2)}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">Total System Cost</p>
          <p className="text-3xl font-bold font-mono text-primary" data-testid="text-net-system-cost">
            ${netSystemCost.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            (${netCostUsd.toFixed(4)} USD actual)
          </p>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-medium">Remaining Balance</p>
            </div>
            <p className={`text-2xl font-bold font-mono ${getBalanceColor()}`} data-testid="text-remaining-balance">
              ${remainingBalance.toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

