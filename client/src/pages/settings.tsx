"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { queryClient, apiRequest } from "@/lib/queryClient"
import type { User } from "@shared/schema"
import { ArrowLeft, Save, SettingsIcon, Key, CreditCard, BarChart3, UserIcon } from "lucide-react"
import { useLocation } from "wouter"
import { PlanSelector } from "@/components/plan-selector"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const TAILADMIN_BLUE = "#465FFF"
const TAILADMIN_BLUE_LIGHT = "rgba(70, 95, 255, 0.08)"

const settingsSchema = z.object({
  vf_api_key: z.string().min(1, "API key is required"),
  budget: z.number().min(0, "Budget must be positive"),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export default function Settings() {
  const { toast } = useToast()
  const [, setLocation] = useLocation()

  const { data: currentUser, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  })

  const { data: ga4Config } = useQuery<{ ga4_measurement_id?: string }>({
    queryKey: ["/api/project/config"],
    queryFn: async () => {
      const res = await fetch("/api/project/config", { credentials: "include" })
      if (!res.ok) return { ga4_measurement_id: undefined }
      return res.json()
    },
  })

  const [ga4MeasurementId, setGa4MeasurementId] = useState("")

  useEffect(() => {
    if (ga4Config?.ga4_measurement_id) {
      setGa4MeasurementId(ga4Config.ga4_measurement_id)
    }
  }, [ga4Config])

  const updateGa4TrackingMutation = useMutation({
    mutationFn: async (measurementId: string) => {
      const response = await apiRequest("POST", "/api/project/ga4-tracking", {
        measurement_id: measurementId || null,
      })
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project/config"] })
      toast({
        title: "GA4 Tracking Updated",
        description: "Google Analytics tracking has been updated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update GA4 tracking",
        variant: "destructive",
      })
    },
  })

  const { data: account } = useQuery({
    queryKey: ["/api/account"],
  })

  const { data: plansData } = useQuery({
    queryKey: ["/api/plans"],
  })

  const updatePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await fetch("/api/account/update-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update plan")
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account"] })
      queryClient.invalidateQueries({ queryKey: ["/api/usage-records"] })
      toast({
        title: "Plan updated",
        description: "Your plan has been updated successfully.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update plan",
        variant: "destructive",
      })
    },
  })

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      vf_api_key: "",
      budget: 60,
    },
  })

  useEffect(() => {
    if (currentUser) {
      form.reset({
        vf_api_key: currentUser.apiKey || "",
        budget: 60,
      })
    }
  }, [currentUser, form])

  const updateMutation = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      return apiRequest("POST", "/api/budget/set", values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] })
      toast({
        title: "Settings updated",
        description: "Your settings have been updated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      })
    },
  })

  const handleSubmit = (values: SettingsFormValues) => {
    updateMutation.mutate(values)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent mx-auto mb-4"
            style={{ borderColor: `${TAILADMIN_BLUE} transparent ${TAILADMIN_BLUE} ${TAILADMIN_BLUE}` }}
          />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-6 lg:px-8 py-5">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              data-testid="button-back"
              className="rounded-xl hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: TAILADMIN_BLUE }}
              >
                <SettingsIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* API Settings Card */}
          <Card className="border-border rounded-2xl">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: TAILADMIN_BLUE_LIGHT }}
                >
                  <Key className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Voiceflow API Settings</CardTitle>
                  <CardDescription>Update your Voiceflow API key and budget settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="vf_api_key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-medium">Voiceflow API Key</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="VF.DM.xxxxx..."
                            {...field}
                            data-testid="input-api-key"
                            className="h-12 rounded-xl border-border bg-muted/30"
                          />
                        </FormControl>
                        <FormDescription className="text-muted-foreground">
                          Your Voiceflow API key (starts with VF.DM.)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-medium">Monthly Budget ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="60.00"
                            {...field}
                            onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                            data-testid="input-budget"
                            className="h-12 rounded-xl border-border bg-muted/30"
                          />
                        </FormControl>
                        <FormDescription className="text-muted-foreground">
                          Your monthly budget for API usage
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-white"
                    style={{ backgroundColor: TAILADMIN_BLUE }}
                    disabled={updateMutation.isPending || !form.formState.isDirty}
                    data-testid="button-save-settings"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Save className="h-4 w-4 mr-2 animate-pulse" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Plan Selection */}
          {plansData?.plans && (
            <Card className="border-border rounded-2xl">
              <CardHeader className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: TAILADMIN_BLUE_LIGHT }}
                  >
                    <CreditCard className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">Subscription Plan</CardTitle>
                    <CardDescription>Choose or change your subscription plan</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <PlanSelector
                  plans={plansData.plans}
                  selectedPlanId={account?.planId || "free"}
                  onSelectPlan={(planId) => {
                    updatePlanMutation.mutate(planId)
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* GA4 Tracking */}
          <Card className="border-border rounded-2xl">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: TAILADMIN_BLUE_LIGHT }}
                >
                  <BarChart3 className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Google Analytics 4 Tracking</CardTitle>
                  <CardDescription>Add your GA4 Measurement ID to track visitors</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ga4-measurement-id" className="text-foreground font-medium">
                    GA4 Measurement ID
                  </Label>
                  <Input
                    id="ga4-measurement-id"
                    placeholder="G-XXXXXXXXXX"
                    value={ga4MeasurementId}
                    onChange={(e) => setGa4MeasurementId(e.target.value)}
                    className="mt-2 h-12 rounded-xl border-border bg-muted/30"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Format: G-XXXXXXXXXX. Find it in Google Analytics Admin - Data Streams
                  </p>
                </div>
                <Button
                  onClick={() => updateGa4TrackingMutation.mutate(ga4MeasurementId)}
                  disabled={updateGa4TrackingMutation.isPending}
                  className="w-full h-12 rounded-xl text-white"
                  style={{ backgroundColor: TAILADMIN_BLUE }}
                >
                  {updateGa4TrackingMutation.isPending ? "Saving..." : "Save GA4 Tracking"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="border-border rounded-2xl">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: TAILADMIN_BLUE_LIGHT }}
                >
                  <UserIcon className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Account Information</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 bg-muted/30 rounded-xl">
                  <Label className="text-muted-foreground text-sm">Project ID</Label>
                  <p className="text-foreground font-mono mt-1" data-testid="text-project-id">
                    {currentUser?.projectId}
                  </p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl">
                  <Label className="text-muted-foreground text-sm">Account Created</Label>
                  <p className="text-foreground font-medium mt-1" data-testid="text-created-at">
                    {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
