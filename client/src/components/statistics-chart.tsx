"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp } from "lucide-react"

const statisticsData = [
  { month: "Jan", series1: 40, series2: 24, series3: 10 },
  { month: "Feb", series1: 45, series2: 30, series3: 15 },
  { month: "Mar", series1: 35, series2: 28, series3: 12 },
  { month: "Apr", series1: 50, series2: 32, series3: 18 },
  { month: "May", series1: 55, series2: 38, series3: 22 },
  { month: "Jun", series1: 50, series2: 35, series3: 20 },
  { month: "Jul", series1: 60, series2: 42, series3: 25 },
  { month: "Aug", series1: 58, series2: 40, series3: 23 },
  { month: "Sep", series1: 65, series2: 45, series3: 28 },
  { month: "Oct", series1: 70, series2: 48, series3: 30 },
  { month: "Nov", series1: 75, series2: 52, series3: 32 },
  { month: "Dec", series1: 80, series2: 55, series3: 35 },
]

export function StatisticsChart() {
  return (
    <Card className="border-card-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Statistics
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Target you've set for each month</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted rounded-md transition-colors">
              Overview
            </button>
            <button className="px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted rounded-md transition-colors">
              Sales
            </button>
            <button className="px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted rounded-md transition-colors">
              Revenue
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={statisticsData}>
            <defs>
              <linearGradient id="color1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="color2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="color3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.08} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
            <YAxis stroke="var(--color-muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                color: "var(--color-foreground)",
              }}
            />
            <Area type="monotone" dataKey="series1" stroke="var(--color-primary)" fill="url(#color1)" />
            <Area
              type="monotone"
              dataKey="series2"
              stroke="var(--color-primary)"
              fill="url(#color2)"
              strokeOpacity={0.7}
            />
            <Area
              type="monotone"
              dataKey="series3"
              stroke="var(--color-primary)"
              fill="url(#color3)"
              strokeOpacity={0.4}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
