import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ComposableMap, Geographies, Geography } from "react-simple-maps"

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

export function WorldMapHero() {
  return (
    <Card className="w-full border-border shadow-sm">
      <CardHeader className="pb-4">
        <div>
          <CardTitle className="text-xl font-semibold">Global Request Distribution</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Worldwide usage patterns</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-[500px] md:h-[600px] bg-slate-950/30 rounded-lg overflow-hidden border border-border">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 160,
              center: [20, 20],
            }}
            className="w-full h-full"
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#1e293b"
                    stroke="#0f172a"
                    strokeWidth={0.5}
                    style={{
                      default: {
                        fill: "#1e293b",
                        stroke: "#0f172a",
                        outline: "none",
                        cursor: "pointer",
                        transition: "all 200ms ease",
                      },
                      hover: {
                        fill: "#3b82f6",
                        stroke: "#1e40af",
                        outline: "none",
                        cursor: "pointer",
                      },
                      pressed: {
                        fill: "#1e3a8a",
                        stroke: "#1e40af",
                        outline: "none",
                      },
                    }}
                  />
                ))
              }
            </Geographies>
          </ComposableMap>
        </div>
      </CardContent>
    </Card>
  )
}
