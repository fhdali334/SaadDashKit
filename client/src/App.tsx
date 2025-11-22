import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProtectedRoute } from "@/components/protected-route";
import { GA4Tracking } from "@/components/ga4-tracking";
import Dashboard from "@/pages/dashboard";
import Usage from "@/pages/usage";
import Cost from "@/pages/cost";
import KnowledgeBase from "@/pages/knowledge-base";
import KnowledgeBaseExporter from "@/pages/knowledge-base-exporter";
import Transcripts from "@/pages/transcripts";
import AiAnalysis from "@/pages/ai-analysis";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

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
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

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
                <div className="flex h-screen w-full">
                  <AppSidebar />
                  <div className="flex flex-col flex-1 min-w-0">
                    <header className="flex items-center justify-between p-4 border-b border-border bg-background sticky top-0 z-10">
                      <SidebarTrigger data-testid="button-sidebar-toggle" />
                      <div className="flex items-center gap-2">
                        <ThemeToggle />
                      </div>
                    </header>
                    <main className="flex-1 overflow-hidden">
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
  );
}

export default App;
