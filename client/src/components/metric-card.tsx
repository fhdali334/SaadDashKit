import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react"

const TAILADMIN_BLUE = "#465FFF"

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  progress?: {
    current: number
    max: number
    showBar?: boolean
  }
  percentageChange?: number
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  progress,
  percentageChange,
}: MetricCardProps) {
  const percentage = progress ? Math.min(100, Math.max(0, (progress.current / progress.max) * 100)) : 0

  const isPositive = percentageChange !== undefined && percentageChange >= 0
  const changeColor = percentageChange !== undefined ? (isPositive ? "text-emerald-500" : "text-red-500") : ""

  return (
    <Card
      className="border-gray-200 bg-white shadow-sm"
      data-testid={`card-metric-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium text-gray-500 mb-1"
              data-testid={`text-metric-label-${title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {title}
            </p>
            <div className="flex items-baseline gap-2">
              <p
                className="text-2xl font-bold font-mono text-gray-800 break-all"
                data-testid={`text-metric-value-${title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {value}
              </p>
              {percentageChange !== undefined && (
                <div className={`flex items-center gap-1 text-sm font-medium ${changeColor}`}>
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>
                    {isPositive ? "+" : ""}
                    {percentageChange.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
            {subtitle && (
              <p
                className="text-xs text-gray-500 mt-1"
                data-testid={`text-metric-subtitle-${title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {subtitle}
              </p>
            )}
            {progress && progress.showBar && (
              <div className="mt-3 space-y-1">
                <Progress
                  value={percentage}
                  className="h-2"
                  data-testid={`progress-${title.toLowerCase().replace(/\s+/g, "-")}`}
                />
                <p className="text-xs text-gray-500">{percentage.toFixed(0)}% remaining</p>
              </div>
            )}
          </div>
          <div className={iconColor || ""} style={!iconColor ? { color: TAILADMIN_BLUE } : {}}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
