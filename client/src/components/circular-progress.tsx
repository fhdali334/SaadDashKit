import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

const TAILADMIN_BLUE = "#465FFF"

interface CircularProgressProps {
  value: number
  max: number
  title: string
  subtitle?: string
  message?: string
  className?: string
}

export function CircularProgress({ value, max, title, subtitle, message, className }: CircularProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  const isOverBudget = value > max

  return (
    <Card className={cn("border-border rounded-2xl flex flex-col", className)}>
      <CardHeader className="pb-2 px-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button className="p-2 hover:bg-muted rounded-xl transition-colors">
            <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 flex-grow justify-center px-6 pb-6">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg width="192" height="192" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="96"
              cy="96"
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="12"
              strokeOpacity="0.3"
            />
            {/* Progress circle */}
            <circle
              cx="96"
              cy="96"
              r={radius}
              fill="none"
              stroke={isOverBudget ? "#ef4444" : TAILADMIN_BLUE}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">{percentage.toFixed(1)}%</div>
              <div
                className={cn(
                  "text-xs font-semibold px-3 py-1 rounded-full mt-2 inline-flex items-center gap-1",
                  isOverBudget ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500",
                )}
              >
                {isOverBudget ? (
                  <>
                    <TrendingDown className="w-3 h-3" />
                    Over Budget
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3 h-3" />
                    On Track
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {message && <p className="text-center text-sm text-muted-foreground max-w-[90%]">{message}</p>}

        <div className="grid grid-cols-3 gap-4 w-full pt-6 border-t border-border mt-auto">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1.5">Budget</p>
            <p className="text-lg font-bold text-foreground">${max.toLocaleString()}</p>
          </div>
          <div className="text-center border-l border-r border-border/50">
            <p className="text-xs text-muted-foreground mb-1.5">Spent</p>
            <p className="text-lg font-bold" style={{ color: TAILADMIN_BLUE }}>
              ${value.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1.5">Remaining</p>
            <p className={cn("text-lg font-bold", isOverBudget ? "text-red-500" : "text-emerald-500")}>
              ${Math.max(0, max - value).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
