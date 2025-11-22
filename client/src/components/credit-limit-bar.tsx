import { CreditLimit } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

interface CreditLimitBarProps {
  creditLimit: CreditLimit;
}

export function CreditLimitBar({ creditLimit }: CreditLimitBarProps) {
  const getStatusColor = () => {
    switch (creditLimit.status) {
      case "safe":
        return "text-chart-2";
      case "warning":
        return "text-chart-3";
      case "danger":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusIcon = () => {
    switch (creditLimit.status) {
      case "safe":
        return <CheckCircle className="w-5 h-5 text-chart-2" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-chart-3" />;
      case "danger":
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return null;
    }
  };

  const getProgressColor = () => {
    if (creditLimit.percentage >= 90) return "bg-destructive";
    if (creditLimit.percentage >= 70) return "bg-chart-3";
    return "bg-chart-2";
  };

  return (
    <div className="space-y-4" data-testid="credit-limit-bar">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <div>
            <p className="text-sm font-medium text-foreground">
              {creditLimit.current.toLocaleString()} / {creditLimit.limit.toLocaleString()} credits
            </p>
            <p className={`text-xs ${getStatusColor()}`}>
              {creditLimit.percentage.toFixed(1)}% used
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {creditLimit.status === "safe" && "Usage within safe limits"}
            {creditLimit.status === "warning" && "Approaching credit limit"}
            {creditLimit.status === "danger" && "Critical: Near limit"}
          </p>
        </div>
      </div>
      <div className="relative">
        <Progress value={creditLimit.percentage} className="h-3" />
        <div
          className={`absolute inset-0 h-3 rounded-full transition-all ${getProgressColor()}`}
          style={{ width: `${Math.min(creditLimit.percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
