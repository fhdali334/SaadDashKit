"use client"

import { Card, CardContent } from "@/components/ui/card"
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react"

interface MetricCardEnhancedProps {
  title: string
  value: string | number
  percentageChange?: number
  icon: LucideIcon
  iconBg?: "blue" | "green" | "orange" | "red"
}

const iconBgColors = {
  blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
  red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
}

export function MetricCardEnhanced({
  title,
  value,
  percentageChange,
  icon: Icon,
  iconBg = "blue",
}: MetricCardEnhancedProps) {
  const isPositive = percentageChange !== undefined && percentageChange >= 0

  return (
    <Card className="border-card-border hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-foreground">{value}</p>
              {percentageChange !== undefined && (
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>
                    {isPositive ? "+" : ""}
                    {percentageChange.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </div>
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBgColors[iconBg]}`}
          >
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
