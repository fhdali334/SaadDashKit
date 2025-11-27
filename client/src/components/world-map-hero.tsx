import { ComposableMap, Geographies, Geography } from "react-simple-maps"

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

const TAILADMIN_BLUE = "#465FFF"

export function WorldMapHero() {
  const isDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches

  const lightModeFill = "#e5e7eb" // Light grey for light mode
  const darkModeFill = "#1f2937" // Darker grey for dark mode
  const lightModeStroke = "#d1d5db" // Light border for light mode
  const darkModeStroke = "#374151" // Darker border for dark mode
  const lightModeHoverFill = "#3b82f6" // Blue hover for light mode
  const darkModeHoverFill = "#60a5fa" // Lighter blue hover for dark mode

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
                    fill: isDark ? darkModeFill : lightModeFill,
                    stroke: isDark ? darkModeStroke : lightModeStroke,
                    strokeWidth: 0.5,
                    outline: "none",
                    cursor: "pointer",
                    transition: "all 200ms ease",
                  },
                  hover: {
                    fill: isDark ? darkModeHoverFill : lightModeHoverFill,
                    stroke: isDark ? darkModeHoverFill : lightModeHoverFill,
                    strokeWidth: 0.8,
                    outline: "none",
                    cursor: "pointer",
                  },
                  pressed: {
                    fill: isDark ? darkModeHoverFill : lightModeHoverFill,
                    stroke: isDark ? darkModeHoverFill : lightModeHoverFill,
                    outline: "none",
                  },
                }}
              />
            ))
          }
        </Geographies>
      </ComposableMap>

      {/* Activity dots overlay removed per client request for cleaner look */}
    </div>
  )
}
