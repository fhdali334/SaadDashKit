import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp } from "lucide-react"
import type { UsageData } from "@shared/schema"
import { Button } from "@/components/ui/button"

interface StatisticsChartProps {
  data: UsageData[]
}

const TAILADMIN_BLUE = "#465FFF"
const TAILADMIN_BLUE_LIGHT = "rgba(70, 95, 255, 0.12)"

export function StatisticsChart({ data }: StatisticsChartProps) {
  const chartData =
    data.length > 0
      ? data.map((d) => ({
          name: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          total: d.totalRequests,
          success: d.successfulRequests,
          failed: d.failedRequests,
          fullDate: d.date,
        }))
      : []

  return (
    <Card className="border-border col-span-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />
              Usage Statistics
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">API requests over time</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs bg-transparent">
              Overview
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              Requests
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              Errors
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TAILADMIN_BLUE} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={TAILADMIN_BLUE} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                dy={10}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f8fafc",
                }}
                itemStyle={{ color: "#f8fafc" }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke={TAILADMIN_BLUE}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
                name="Total Requests"
              />
              <Area
                type="monotone"
                dataKey="success"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSuccess)"
                name="Successful"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
