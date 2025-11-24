import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Activity } from "lucide-react"

// Generate hexagon-like data points for visualization
const generateHexagonData = () => {
  const data = []
  const colors = ["#3b82f6", "#60a5fa", "#93c5fd", "#dbeafe", "#1e40af"]

  for (let i = 0; i < 80; i++) {
    const x = Math.random() * 100
    const y = Math.random() * 100
    const size = Math.random() * 150 + 100
    const intensity = Math.floor(Math.random() * 5)
    data.push({
      x,
      y,
      size,
      intensity,
      value: Math.floor(Math.random() * 10000) + 1000,
      color: colors[intensity],
    })
  }
  return data
}

interface HexagonHeatmapChartProps {
  data?: any[]
}

export function HexagonHeatmapChart({ data }: HexagonHeatmapChartProps) {
  const chartData = data && data.length > 0 ? data : generateHexagonData()

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Request Intensity Map
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">API activity density visualization</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[210px] w-full">
          {/* <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
              <XAxis
                type="number"
                dataKey="x"
                name="Region"
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Activity"
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                formatter={(value: any) => {
                  if (typeof value === "object") return ""
                  return [value, "Requests"]
                }}
              />
              <Scatter name="Activity Clusters" data={chartData} fill="#3b82f6" shape="circle">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} opacity={0.7} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer> */}
        </div>
        <div className="mt-4 flex gap-4 flex-wrap justify-center items-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#1e40af" }} />
            <span className="text-xs text-muted-foreground">Very High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#3b82f6" }} />
            <span className="text-xs text-muted-foreground">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#60a5fa" }} />
            <span className="text-xs text-muted-foreground">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#93c5fd" }} />
            <span className="text-xs text-muted-foreground">Low</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
