"use client"

import { useState } from "react"
import GTMChartsTab from "@/components/usage/GTMChartsTab"
import { UsageAnalyticsSection } from "@/components/usage/usage-analytics-section"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from "chart.js"
import "chartjs-adapter-luxon"

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, TimeScale)

// Get default date range (last 30 days)
function getDefaultDateRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)

  return {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  }
}

export default function Usage() {
  const [activeTab, setActiveTab] = useState("usage")

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto px-6 pt-8 md:px-8 md:pt-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Usage Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track usage metrics, performance analytics, and advanced GTM insights
          </p>
        </div>

        <div className="border-b border-blue-200 dark:border-blue-800 mb-8">
          <div className="flex gap-1 -mb-px">
            <button
              onClick={() => setActiveTab("usage")}
              className={`px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                activeTab === "usage"
                  ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              Usage Analytics
            </button>
            <button
              onClick={() => setActiveTab("gtm")}
              className={`px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                activeTab === "gtm"
                  ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              GTM Analytics
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-8 md:px-8 md:pb-12">
        {activeTab === "usage" && <UsageAnalyticsSection />}
        {activeTab === "gtm" && <GTMChartsTab />}
      </div>
    </div>
  )
}
