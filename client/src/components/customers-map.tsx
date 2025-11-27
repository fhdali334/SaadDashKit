import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ComposableMap, Geographies, Geography } from "react-simple-maps"

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

const markers = [
  { markerOffset: -15, name: "USA", coordinates: [-96, 37] },
  { markerOffset: 25, name: "France", coordinates: [2, 46] },
]

export function CustomersMap() {
  const isDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches

  const lightModeFill = "#e5e7eb" // Light grey for light mode countries
  const darkModeFill = "#2d3748" // Darker grey for dark mode countries
  const lightModeStroke = "#d1d5db" // Light border for light mode
  const darkModeStroke = "#374151" // Darker border for dark mode
  const lightModeHoverFill = "#60a5fa" // Light blue hover
  const darkModeHoverFill = "#60a5fa" // Light blue hover for dark mode

  return (
    <Card className="h-full border-card-border shadow-sm flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div>
          <CardTitle className="text-lg font-semibold">Requests Demographic</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Number of requests based on country</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="relative w-full h-[400px] rounded-lg overflow-hidden border border-border bg-muted/30">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 120,
              center: [0, 30],
            }}
            className="w-full h-full"
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isDark ? darkModeFill : lightModeFill}
                    stroke={isDark ? darkModeStroke : lightModeStroke}
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none", cursor: "pointer", transition: "all 200ms" },
                      hover: {
                        fill: lightModeHoverFill,
                        outline: "none",
                        cursor: "pointer",
                      },
                      pressed: { fill: lightModeHoverFill, outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>
            {/* Markers removed per client request */}
          </ComposableMap>
        </div>

        <div className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border shrink-0">
                <svg viewBox="0 0 32 32" className="w-full h-full bg-slate-800">
                  <rect width="32" height="32" fill="#3c3b6e" />
                  <path
                    d="M0,4 h32 M0,8 h32 M0,12 h32 M0,16 h32 M0,20 h32 M0,24 h32 M0,28 h32"
                    stroke="#b22234"
                    strokeWidth="2"
                  />
                  <rect width="14" height="16" fill="#3c3b6e" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">USA</span>
                <span className="text-xs text-muted-foreground">2,379 Requests</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-1 justify-end max-w-[200px]">
              <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[79%] rounded-full" />
              </div>
              <span className="text-sm font-medium text-blue-500">79%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border shrink-0">
                <svg viewBox="0 0 32 32" className="w-full h-full bg-slate-800">
                  <rect width="10" height="32" x="0" fill="#002395" />
                  <rect width="11" height="32" x="10" fill="#ffffff" />
                  <rect width="11" height="32" x="21" fill="#ed2939" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">France</span>
                <span className="text-xs text-muted-foreground">589 Requests</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-1 justify-end max-w-[200px]">
              <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[23%] rounded-full" />
              </div>
              <span className="text-sm font-medium text-blue-500">21%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
