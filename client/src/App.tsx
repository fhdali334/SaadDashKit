import type React from "react"
import { Switch, Route } from "wouter"
import { queryClient } from "./lib/queryClient"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { ProtectedRoute } from "@/components/protected-route"
import { GA4Tracking } from "@/components/ga4-tracking"
import Dashboard from "@/pages/dashboard"
import Usage from "@/pages/usage"
import Cost from "@/pages/cost"
import KnowledgeBase from "@/pages/knowledge-base"
import KnowledgeBaseExporter from "@/pages/knowledge-base-exporter"
import Transcripts from "@/pages/transcripts"
import AiAnalysis from "@/pages/ai-analysis"
import Settings from "@/pages/settings"
import Login from "@/pages/login"
import NotFound from "@/pages/not-found"
import { Bell, Search, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

const TAILADMIN_BLUE = "#465FFF"

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/usage">
        <ProtectedRoute>
          <Usage />
        </ProtectedRoute>
      </Route>
      <Route path="/cost">
        <ProtectedRoute>
          <Cost />
        </ProtectedRoute>
      </Route>
      <Route path="/knowledge-base">
        <ProtectedRoute>
          <KnowledgeBase />
        </ProtectedRoute>
      </Route>
      <Route path="/knowledge-base/export">
        <ProtectedRoute>
          <KnowledgeBaseExporter />
        </ProtectedRoute>
      </Route>
      <Route path="/transcripts">
        <ProtectedRoute>
          <Transcripts />
        </ProtectedRoute>
      </Route>
      <Route path="/ai-analysis">
        <ProtectedRoute>
          <AiAnalysis />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  )
}

function App() {
  const style = {
    "--sidebar-width": "17rem",
    "--sidebar-width-icon": "4rem",
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Switch>
            <Route path="/login">
              <Router />
            </Route>
            <Route>
              <SidebarProvider style={style as React.CSSProperties}>
                <div className="flex h-screen w-full bg-background">
                  <AppSidebar />
                  <div className="flex flex-col flex-1 min-w-0">
                    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-card sticky top-0 z-20">
                      <div className="flex items-center gap-4">
                        <SidebarTrigger
                          data-testid="button-sidebar-toggle"
                          className="p-2 rounded-xl hover:bg-muted transition-colors"
                        >
                          <Menu className="w-5 h-5 text-muted-foreground" />
                        </SidebarTrigger>

                        {/* Search bar */}
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-muted rounded-xl w-80">
                          <Search className="w-4 h-4 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Search or type command..."
                            className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground flex-1"
                          />
                          <kbd className="px-2 py-0.5 text-xs bg-background rounded border border-border text-muted-foreground">
                            ⌘K
                          </kbd>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Button variant="ghost" size="icon" className="relative rounded-xl h-10 w-10 hover:bg-muted">
                          <Bell className="w-5 h-5 text-muted-foreground" />
                          <span
                            className="absolute top-2 right-2 w-2 h-2 rounded-full"
                            style={{ backgroundColor: TAILADMIN_BLUE }}
                          />
                        </Button>

                        {/* User avatar */}
                        <div className="flex items-center gap-3 pl-3 border-l border-border">
                          <div className="hidden sm:block text-right">
                            <p className="text-sm font-medium text-foreground">Admin User</p>
                            <p className="text-xs text-muted-foreground">admin@example.com</p>
                          </div>
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                            style={{ backgroundColor: TAILADMIN_BLUE }}
                          >
                            A
                          </div>
                        </div>
                      </div>
                    </header>

                    <main className="flex-1 overflow-y-auto">
                      <GA4Tracking />
                      <Router />
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
