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
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-6 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-base font-bold text-foreground">TailAdmin</span>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => {
                const isActive = location === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }
                    >
                      <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                        <item.icon className="w-4 h-4" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 space-y-3">
          {projectId && (
            <>
              <div className="text-xs text-muted-foreground px-3 py-2 bg-sidebar-accent rounded-md border border-sidebar-border">
                Project: {projectId.slice(0, 8)}...
              </div>
              <Separator className="my-1" />
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full justify-start"
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-4 h-4 mr-2" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 mr-2" />
                Dark Mode
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start bg-transparent"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
