import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Zap } from "lucide-react";

interface ResetTimerProps {
  resetAt: string;
  onAccelerate: () => void;
  isAccelerating?: boolean;
}

export function ResetTimer({ resetAt, onAccelerate, isAccelerating = false }: ResetTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const reset = new Date(resetAt).getTime();
      const remaining = Math.max(0, reset - now);
      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000); // Update every second

    return () => clearInterval(interval);
  }, [resetAt]);

  const formatTimeRemaining = (ms: number) => {
    if (ms === 0) return "Resetting now...";
    
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const resetDate = new Date(resetAt);
  const resetDateString = resetDate.toLocaleDateString(undefined, { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
  const resetTimeString = resetDate.toLocaleTimeString(undefined, { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const canAccelerate = timeRemaining > 1000; // More than 1 second remaining

  return (
    <Card data-testid="card-reset-timer">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Usage Reset Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Monthly Usage Reset</p>
          <p className="text-3xl font-bold" data-testid="text-countdown">
            {resetDateString}
          </p>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-reset-time">
            {resetTimeString}
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            {formatTimeRemaining(timeRemaining)} remaining
          </p>
        </div>
        
        <Button
          onClick={onAccelerate}
          disabled={!canAccelerate || isAccelerating}
          className="w-full"
          size="lg"
          variant="outline"
          data-testid="button-accelerate"
        >
          <Zap className="w-4 h-4 mr-2" />
          {isAccelerating ? "Resetting..." : "Reset Now (Test)"}
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          Reset date calculated dynamically from latest Voiceflow usage + 30 days
        </p>
      </CardContent>
    </Card>
  );
}

