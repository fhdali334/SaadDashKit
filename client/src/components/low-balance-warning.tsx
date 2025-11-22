import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface LowBalanceWarningProps {
  creditLimit: number;
  creditsUsed: number;
  remaining: number;
  isOverLimit: boolean;
}

export function LowBalanceWarning({ creditLimit, creditsUsed, remaining, isOverLimit }: LowBalanceWarningProps) {
  const percentage = (remaining / creditLimit) * 100;

  if (isOverLimit) {
    return (
      <Alert className="mb-6 border-destructive bg-destructive/10" data-testid="alert-over-limit">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <AlertTitle className="text-destructive font-semibold">Credit Limit Exceeded</AlertTitle>
        <AlertDescription className="text-destructive/90">
          You have exceeded your credit limit by ${Math.abs(remaining).toFixed(2)}.
          Used: ${creditsUsed.toFixed(2)} / ${creditLimit.toFixed(2)} limit.
          Add credits immediately to restore service.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-6 border-warning bg-warning/10" data-testid="alert-low-balance">
      <AlertCircle className="h-5 w-5 text-warning" />
      <AlertTitle className="text-warning font-semibold">Low Credits Warning</AlertTitle>
      <AlertDescription className="text-warning-foreground/90">
        Your remaining credits are at {percentage.toFixed(1)}% (${remaining.toFixed(2)} remaining).
        Consider adding credits to ensure uninterrupted service.
      </AlertDescription>
    </Alert>
  );
}
