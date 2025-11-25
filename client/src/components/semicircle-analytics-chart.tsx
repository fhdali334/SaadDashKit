import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { TrendingUp } from "lucide-react"

interface SemicircleAnalyticsChartProps {
  successRate?: number
  data?: any[]
}

export function SemicircleAnalyticsChart({ successRate = 94.2, data }: SemicircleAnalyticsChartProps) {
  const chartData = data || [
    { name: "Successful", value: successRate, fill: "#3b82f6" },
    { name: "Failed", value: 100 - successRate, fill: "#bfdbfe" },
  ]

  return (
    <Card className="border-border shadow-sm h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Success Rate
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">API reliability metrics</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full flex flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="80%"
                startAngle={180}
                endAngle={0}
                innerRadius={80}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `${value.toFixed(1)}%`}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center -mt-12 relative z-10">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{successRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Success Rate</div>
          </div>
        </div>
        <div className="mt-6 flex gap-6 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span className="text-sm font-medium text-foreground">
              Successful <span className="text-muted-foreground">{successRate.toFixed(1)}%</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-200 dark:bg-blue-700" />
            <span className="text-sm font-medium text-foreground">
              Failed <span className="text-muted-foreground">{(100 - successRate).toFixed(1)}%</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
