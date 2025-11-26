"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Globe, MapPin, TrendingUp, TrendingDown } from "lucide-react"

interface GeographicMetric {
  region: string
  value: number
  change: number
  icon?: React.ReactNode
}

interface GeographicMetricsProps {
  metrics?: GeographicMetric[]
}

const defaultMetrics: GeographicMetric[] = [
  { region: "North America", value: 45234, change: 12.5 },
  { region: "Europe", value: 32156, change: 8.3 },
  { region: "Asia Pacific", value: 28943, change: 15.7 },
  { region: "Latin America", value: 12456, change: -3.2 },
]

export function GeographicMetrics({ metrics = defaultMetrics }: GeographicMetricsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const isPositive = metric.change >= 0
        return (
          <Card key={index} className="border-border hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  {index === 0 ? (
                    <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>
                    {isPositive ? "+" : ""}
                    {metric.change.toFixed(1)}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{metric.region}</p>
              <p className="text-xl font-bold text-foreground">{metric.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
