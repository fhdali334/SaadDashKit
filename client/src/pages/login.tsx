"use client"

import type React from "react"

import { useState } from "react"
import { useLocation } from "wouter"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BarChart3, ArrowRight, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { login } from "@/lib/auth"
import { queryClient } from "@/lib/queryClient"
import { setLastLoginTime } from "@/components/protected-route"

const TAILADMIN_BLUE = "#465FFF"

export default function Login() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const [projectId, setProjectId] = useState("")
  const [vfApiKey, setVfApiKey] = useState("")
  const [budget, setBudget] = useState("60")
  const [isLoading, setIsLoading] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!projectId.trim()) {
      toast({
        title: "Project ID required",
        description: "Please enter your Voiceflow project ID",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await login(projectId, vfApiKey || undefined, Number.parseFloat(budget) || 60)

      if (result.success) {
        setLastLoginTime()

        toast({
          title: "Login successful",
          description: `Welcome to project ${projectId}`,
        })

        queryClient.clear()

        await new Promise((resolve) => setTimeout(resolve, 200))

        const { checkSession } = await import("@/lib/auth")
        const finalCheck = await checkSession()

        if (finalCheck.authenticated) {
          setLocation("/")
        } else {
          await new Promise((resolve) => setTimeout(resolve, 500))
          const retryCheck = await checkSession()

          if (retryCheck.authenticated) {
            setLocation("/")
          } else {
            toast({
              title: "Session issue",
              description: "Login succeeded but session verification failed. Please try again.",
              variant: "destructive",
            })
          }
        }
      } else {
        toast({
          title: "Login failed",
          description: result.error || "An error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ backgroundColor: TAILADMIN_BLUE }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">TailAdmin</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Welcome to your
            <br />
            AI Dashboard
          </h1>
          <p className="text-lg text-white/70 max-w-md">
            Track your Voiceflow chatbot analytics, manage costs, and gain insights from your conversations.
          </p>

          <div className="flex items-center gap-4 pt-8">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-white bg-white/20 flex items-center justify-center text-white text-sm font-medium"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <div className="text-white/80 text-sm">
              <span className="font-semibold">2,000+</span> teams trust us
            </div>
          </div>
        </div>

        <div className="text-white/50 text-sm">&copy; 2025 TailAdmin. All rights reserved.</div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: TAILADMIN_BLUE }}
            >
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">TailAdmin</span>
          </div>

          <div className="space-y-2 mb-8">
            <h2 className="text-3xl font-bold text-foreground">Sign In</h2>
            <p className="text-muted-foreground">Enter your project details to access the dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <Alert className="rounded-xl bg-muted border-border">
              <AlertDescription className="text-sm text-muted-foreground">
                Your project ID can be found in the Voiceflow dashboard URL or settings
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="projectId" className="text-foreground font-medium">
                Project ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="projectId"
                type="text"
                placeholder="66aeff0ea380c590e96e8e70"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                data-testid="input-project-id"
                className="h-12 rounded-xl border-border bg-muted/30 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vfApiKey" className="text-foreground font-medium">
                Voiceflow API Key
                <span className="text-muted-foreground font-normal ml-2">(Optional)</span>
              </Label>
              <div className="relative">
                <Input
                  id="vfApiKey"
                  type={showApiKey ? "text" : "password"}
                  placeholder="VF.DM.xxxxx..."
                  value={vfApiKey}
                  onChange={(e) => setVfApiKey(e.target.value)}
                  data-testid="input-api-key"
                  className="h-12 rounded-xl border-border bg-muted/30 focus:border-primary pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">For live credit tracking from Voiceflow</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget" className="text-foreground font-medium">
                Monthly Budget ($)
              </Label>
              <Input
                id="budget"
                type="number"
                placeholder="60"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                min="0"
                step="0.01"
                data-testid="input-budget"
                className="h-12 rounded-xl border-border bg-muted/30 focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">10,000 credits = $60</p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-white font-medium text-base"
              style={{ backgroundColor: TAILADMIN_BLUE }}
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Access Dashboard
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Need help?{" "}
            <a href="#" className="font-medium hover:underline" style={{ color: TAILADMIN_BLUE }}>
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
