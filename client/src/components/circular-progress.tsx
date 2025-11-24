import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

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
  const radius = 45 // Keeping it compact to match previous design scale if needed, or 85 for larger
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <Card className={cn("border-card-border flex flex-col", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <button className="p-1.5 hover:bg-muted rounded-md transition-colors">
            <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 flex-grow justify-center">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg width="160" height="160" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
              strokeOpacity="0.2"
            />
            {/* Progress circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="8"
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
                  "text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block",
                  percentage > 100 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success",
                )}
              >
                {value > max ? "Over Budget" : "On Track"}
              </div>
            </div>
          </div>
        </div>

        {message && <p className="text-center text-sm text-muted-foreground max-w-[90%]">{message}</p>}

        <div className="grid grid-cols-3 gap-4 w-full pt-4 border-t mt-auto">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Budget</p>
            <p className="font-semibold text-foreground">${max.toLocaleString()}</p>
          </div>
          <div className="text-center border-l border-r border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Spent</p>
            <p className="font-semibold text-foreground">${value.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Remaining</p>
            <p className="font-semibold text-foreground">${Math.max(0, max - value).toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
