"use client"

import {
  BarChart3,
  MessagesSquare,
  LayoutDashboard,
  Settings,
  Moon,
  Sun,
  LogOut,
  Database,
  DollarSign,
  Brain,
  ChevronRight,
} from "lucide-react"
import { Link, useLocation } from "wouter"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "./theme-provider"
import { logout, getProjectId } from "@/lib/auth"

const TAILADMIN_BLUE = "#465FFF"

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Usage Analytics",
    url: "/usage",
    icon: BarChart3,
  },
  {
    title: "Cost",
    url: "/cost",
    icon: DollarSign,
  },
  {
    title: "Knowledge Base",
    url: "/knowledge-base",
    icon: Database,
  },
  {
    title: "Transcripts",
    url: "/transcripts",
    icon: MessagesSquare,
  },
  {
    title: "AI Analysis",
    url: "/ai-analysis",
    icon: Brain,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const [location, setLocation] = useLocation()
  const { theme, setTheme } = useTheme()
  const projectId = getProjectId()

  const handleLogout = async () => {
    await logout()
    setLocation("/login")
  }

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className="py-6 mb-2">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: TAILADMIN_BLUE }}
              >
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-sidebar-foreground">TailAdmin</span>
                <span className="text-xs text-sidebar-foreground/60">Dashboard Pro</span>
              </div>
            </div>
          </SidebarGroupLabel>

          <div className="px-3 mb-3">
            <span className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">Menu</span>
          </div>

          <SidebarGroupContent>
         <SidebarMenu className="gap-1">
  {menuItems.map((item) => {
    const isActive = location === item.url

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          className={`h-11 rounded-xl transition-all duration-200 ${
            isActive
              ? "text-white font-medium"
              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          }`}
          style={isActive ? { backgroundColor: TAILADMIN_BLUE } : undefined}
        >
          <Link href={item.url}>
            {/* Icon color update */}
            <item.icon
              className={`w-5 h-5 ${
                isActive ? "text-white" : "text-sidebar-foreground/70"
              }`}
            />

            {/* Text color update */}
            <span
              className={`flex-1 ${
                isActive ? "text-white" : "text-sidebar-foreground/70"
              }`}
            >
              {item.title}
            </span>

            {isActive && <ChevronRight className="w-4 h-4 opacity-70 text-white" />}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  })}
</SidebarMenu>

          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 pb-6">
        <div className="space-y-3">
          {projectId && (
            <>
              <div className="text-xs text-sidebar-foreground/60 px-3 py-3 bg-sidebar-accent rounded-xl border border-sidebar-border">
                <span className="block text-sidebar-foreground/50 mb-1">Project ID</span>
                <span className="font-mono text-sidebar-foreground">{projectId.slice(0, 12)}...</span>
              </div>
              <Separator className="my-2 bg-sidebar-border" />
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full justify-start h-11 rounded-xl text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-5 h-5 mr-3" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 mr-3" />
                Dark Mode
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start h-11 rounded-xl text-sidebar-foreground/70 hover:text-red-500 hover:bg-red-500/10"
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
