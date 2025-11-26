"use client"

import { useState } from "react"
import GTMChartsTab from "@/components/usage/GTMChartsTab"
import { UsageAnalyticsSection } from "@/components/usage/usage-analytics-section"
import { BarChart3, Activity, TrendingUp } from "lucide-react"
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, TimeScale)

const TAILADMIN_BLUE = "#465FFF"
const TAILADMIN_BLUE_LIGHT = "rgba(70, 95, 255, 0.08)"

export default function Usage() {
  const [activeTab, setActiveTab] = useState("usage")

  const tabs = [
    { id: "usage", label: "Usage Analytics", icon: Activity },
    { id: "gtm", label: "GTM Analytics", icon: TrendingUp },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-6 lg:px-8 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: TAILADMIN_BLUE }}
              >
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Usage Analytics</h1>
                <p className="text-sm text-muted-foreground">
                  Track usage metrics, performance analytics, and advanced GTM insights
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive ? "text-white shadow-lg" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  style={isActive ? { backgroundColor: TAILADMIN_BLUE } : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-8 py-8">
        {activeTab === "usage" && <UsageAnalyticsSection />}
        {activeTab === "gtm" && <GTMChartsTab />}
      </main>
    </div>
  )
}
