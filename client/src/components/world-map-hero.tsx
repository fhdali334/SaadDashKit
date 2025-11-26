import { ComposableMap, Geographies, Geography } from "react-simple-maps"

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

const TAILADMIN_BLUE = "#465FFF"

export function WorldMapHero() {
  return (
    <div className="relative w-full h-[400px] lg:h-[450px] rounded-2xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 140,
          center: [20, 30],
        }}
        className="w-full h-full"
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: {
                    fill: "hsl(var(--muted))",
                    stroke: "hsl(var(--border))",
                    strokeWidth: 0.5,
                    outline: "none",
                    cursor: "pointer",
                    transition: "all 200ms ease",
                  },
                  hover: {
                    fill: TAILADMIN_BLUE,
                    stroke: TAILADMIN_BLUE,
                    strokeWidth: 0.8,
                    outline: "none",
                    cursor: "pointer",
                  },
                  pressed: {
                    fill: TAILADMIN_BLUE,
                    stroke: TAILADMIN_BLUE,
                    outline: "none",
                  },
                }}
              />
            ))
          }
        </Geographies>
      </ComposableMap>

      {/* Activity dots overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* North America */}
        <div className="absolute top-[35%] left-[22%]">
          <span className="relative flex h-4 w-4">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: TAILADMIN_BLUE }}
            />
            <span className="relative inline-flex rounded-full h-4 w-4" style={{ backgroundColor: TAILADMIN_BLUE }} />
          </span>
        </div>
        {/* Europe */}
        <div className="absolute top-[28%] left-[48%]">
          <span className="relative flex h-3 w-3">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: "#10b981" }}
            />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
        </div>
        {/* Asia */}
        <div className="absolute top-[40%] left-[72%]">
          <span className="relative flex h-3 w-3">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: TAILADMIN_BLUE }}
            />
            <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: TAILADMIN_BLUE }} />
          </span>
        </div>
      </div>
    </div>
  )
}
