"use client"
import { useState, useRef, useEffect } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, Legend } from "recharts"

interface LineChartData {
  name: string
  value1: number
  value2?: number
}

interface TailAdminSmoothLineChartProps {
  data: LineChartData[]
  title?: string
  height?: number
  showGrid?: boolean
  series1Label?: string
  series2Label?: string
}

export function TailAdminSmoothLineChart({
  data,
  title = "Line Chart 1",
  height = 350,
  showGrid = false,
  series1Label = "Series 1",
  series2Label = "Series 2",
}: TailAdminSmoothLineChartProps) {
  const [startIndex, setStartIndex] = useState(0)
  const [endIndex, setEndIndex] = useState(data.length - 1)
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const chartElement = chartRef.current
    if (!chartElement) return

    const handleWheel = (e: WheelEvent) => {
      // Prevent page scroll when mouse is over chart
      e.preventDefault()
      e.stopPropagation()

      const zoomSpeed = 1
      const delta = e.deltaY > 0 ? zoomSpeed : -zoomSpeed

      const range = endIndex - startIndex
      const minRange = 3 // Minimum visible points

      if (delta > 0 && range < data.length - 1) {
        // Zoom out
        const newStart = Math.max(0, startIndex - delta)
        const newEnd = Math.min(data.length - 1, endIndex + delta)
        setStartIndex(newStart)
        setEndIndex(newEnd)
      } else if (delta < 0 && range > minRange) {
        // Zoom in
        const newStart = Math.min(startIndex + Math.abs(delta), endIndex - minRange)
        const newEnd = Math.max(endIndex - Math.abs(delta), startIndex + minRange)
        setStartIndex(newStart)
        setEndIndex(newEnd)
      }
    }

    // Add event listener with passive: false to allow preventDefault
    chartElement.addEventListener("wheel", handleWheel, { passive: false })

    return () => {
      chartElement.removeEventListener("wheel", handleWheel)
    }
  }, [startIndex, endIndex, data.length])

  // Reset indices when data changes
  useEffect(() => {
    setStartIndex(0)
    setEndIndex(data.length - 1)
  }, [data.length])

  // Handle brush change for manual selection
  const handleBrushChange = (brushData: any) => {
    if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
      setStartIndex(brushData.startIndex)
      setEndIndex(brushData.endIndex)
    }
  }

  // Get visible data slice
  const visibleData = data.slice(startIndex, endIndex + 1)

  // Check if we have secondary data
  const hasSecondSeries = data.some((d) => d.value2 !== undefined)

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card px-6 py-6 shadow-sm">
        {title && <div className="mb-6 px-0 text-xl font-semibold text-foreground">{title}</div>}
        <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>
          No data available
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-6 shadow-sm">
      {title && <div className="mb-6 px-0 text-xl font-semibold text-foreground">{title}</div>}
      <div ref={chartRef} className="cursor-ns-resize select-none" title="Scroll to zoom in/out">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={visibleData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
            <XAxis
              dataKey="name"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
              width={50}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                color: "hsl(var(--foreground))",
                padding: "12px 16px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600, marginBottom: 8 }}
              itemStyle={{ color: "hsl(var(--foreground))", padding: "2px 0" }}
              cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "4 4" }}
            />
            {hasSecondSeries && (
              <Legend
                wrapperStyle={{ paddingTop: "10px" }}
                formatter={(value) => (
                  <span style={{ color: "hsl(var(--foreground))", fontSize: 12 }}>
                    {value === "value1" ? series1Label : series2Label}
                  </span>
                )}
              />
            )}
            <defs>
              <linearGradient id="gradientLine1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradientLine2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value1"
              name={series1Label}
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#gradientLine1)"
              isAnimationActive={true}
              animationDuration={800}
              dot={false}
              activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
            />
            {hasSecondSeries && (
              <Area
                type="monotone"
                dataKey="value2"
                name={series2Label}
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fill="url(#gradientLine2)"
                isAnimationActive={true}
                animationDuration={800}
                dot={false}
                activeDot={{ r: 6, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }}
              />
            )}
            <Brush
              dataKey="name"
              height={24}
              stroke="hsl(var(--border))"
              fill="hsl(var(--muted))"
              travellerWidth={10}
              startIndex={startIndex}
              endIndex={endIndex}
              onChange={handleBrushChange}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-2">Scroll on chart to zoom • Drag slider to pan</p>
    </div>
  )
}
