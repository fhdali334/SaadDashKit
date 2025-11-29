"use client"

import { useState } from "react"
import QATab from "@/components/knowledge-base/QATab"
import AuthTab from "@/components/knowledge-base/AuthTab"
import AddProductTab from "@/components/knowledge-base/AddProductTab"
import BulkUploadTab from "@/components/knowledge-base/BulkUploadTab"
import ManageProductsTab from "@/components/knowledge-base/ManageProductsTab"
import { FileText, Database, Upload, Package, Key, Settings, ChevronRight, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const TAILADMIN_BLUE = "#465FFF"
const TAILADMIN_BLUE_LIGHT = "rgba(70, 95, 255, 0.08)"

type MainTab = "qa" | "products"
type ProductSubTab = "api" | "single" | "bulk" | "manage"

export default function KnowledgeBase() {
  const [mainTab, setMainTab] = useState<MainTab>("qa")
  const [productSubTab, setProductSubTab] = useState<ProductSubTab>("api")
  const [searchQuery, setSearchQuery] = useState("")

  const mainTabs = [
    { id: "qa" as const, label: "Q&A Documents", icon: FileText, description: "Manage FAQ and document knowledge" },
    { id: "products" as const, label: "Product Catalog", icon: Package, description: "Manage product information" },
  ]

  const productSubTabs = [
    { id: "api" as const, label: "API Config", icon: Key },
    { id: "single" as const, label: "Add Product", icon: Plus },
    { id: "bulk" as const, label: "Bulk Upload", icon: Upload },
    { id: "manage" as const, label: "Manage", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-6 lg:px-8 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: TAILADMIN_BLUE }}
              >
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Knowledge Base</h1>
                <p className="text-sm text-muted-foreground">Manage documents and products for your AI chatbot</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 lg:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search knowledge base..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-11 rounded-xl border-border bg-muted/30"
                />
              </div>
              <Button className="h-11 rounded-xl text-white px-5" style={{ backgroundColor: TAILADMIN_BLUE }}>
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </Button>
            </div>
          </div>

          {/* Breadcrumb */}
          <nav className="hidden md:flex items-center gap-2 text-sm mt-5 pt-5 border-t border-border/50">
            <span className="text-muted-foreground">Home</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            <span style={{ color: TAILADMIN_BLUE }} className="font-medium">
              Knowledge Base
            </span>
            {mainTab === "products" && (
              <>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                <span style={{ color: TAILADMIN_BLUE }} className="font-medium">
                  Products
                </span>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="px-6 lg:px-8 py-8">
        {/* Main Tab Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 ">
          {mainTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = mainTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setMainTab(tab.id)}
                className={cn(
                  "flex items-center gap-4 p-6 rounded-2xl border-2 transition-all text-left",
                  isActive ? "bg-card shadow-lg" : "bg-card/50 border-transparent hover:bg-card hover:shadow-md",
                )}
                style={isActive ? { borderColor: TAILADMIN_BLUE } : { borderColor: "transparent" }}
              >
                <div
                  className={cn("w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all")}
                  style={{
                    backgroundColor: isActive ? TAILADMIN_BLUE : TAILADMIN_BLUE_LIGHT,
                  }}
                >
                  <Icon className="w-7 h-7" style={{ color: isActive ? "#fff" : TAILADMIN_BLUE }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn("text-lg font-semibold", isActive ? "text-foreground" : "text-foreground/80")}>
                    {tab.label}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{tab.description}</p>
                </div>
                {isActive && (
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: TAILADMIN_BLUE }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        {mainTab === "qa" && (
          <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all">
            <QATab />
          </div>
        )}

        {mainTab === "products" && (
          <div className="space-y-6">
            {/* Sub-tab Navigation */}
            <div className="bg-card rounded-3xl border border-border p-3 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {productSubTabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = productSubTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setProductSubTab(tab.id)}
                      className={cn(
                        "flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium transition-all flex-1 sm:flex-none justify-center sm:justify-start",
                        isActive
                          ? "text-white shadow-lg"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                      style={isActive ? { backgroundColor: TAILADMIN_BLUE } : undefined}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Sub-tab Content with enhanced styling */}
            <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all">
              {productSubTab === "api" && <AuthTab />}
              {productSubTab === "single" && <AddProductTab />}
              {productSubTab === "bulk" && <BulkUploadTab />}
              {productSubTab === "manage" && <ManageProductsTab />}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
