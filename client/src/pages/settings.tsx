import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { ArrowLeft, Save } from "lucide-react";
import { useLocation } from "wouter";
import { PlanSelector } from "@/components/plan-selector";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const settingsSchema = z.object({
  vf_api_key: z.string().min(1, "API key is required"),
  budget: z.number().min(0, "Budget must be positive"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: currentUser, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  // Fetch GA4 tracking config
  const { data: ga4Config } = useQuery<{ ga4_measurement_id?: string }>({
    queryKey: ["/api/project/config"],
    queryFn: async () => {
      const res = await fetch("/api/project/config", { credentials: "include" });
      if (!res.ok) return { ga4_measurement_id: undefined };
      return res.json();
    },
  });

  const [ga4MeasurementId, setGa4MeasurementId] = useState("");

  useEffect(() => {
    if (ga4Config?.ga4_measurement_id) {
      setGa4MeasurementId(ga4Config.ga4_measurement_id);
    }
  }, [ga4Config]);

  const updateGa4TrackingMutation = useMutation({
    mutationFn: async (measurementId: string) => {
      const response = await apiRequest("POST", "/api/project/ga4-tracking", {
        measurement_id: measurementId || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project/config"] });
      toast({
        title: "GA4 Tracking Updated",
        description: "Google Analytics tracking has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update GA4 tracking",
        variant: "destructive",
      });
    },
  });

  // Fetch account and plans
  const { data: account } = useQuery({
    queryKey: ["/api/account"],
  });

  const { data: plansData } = useQuery({
    queryKey: ["/api/plans"],
  });

  const updatePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await fetch("/api/account/update-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update plan");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage-records"] });
      toast({
        title: "Plan updated",
        description: "Your plan has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update plan",
        variant: "destructive",
      });
    },
  });

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      vf_api_key: "",
      budget: 60,
    },
  });

  // Update form when user data loads
  useEffect(() => {
    if (currentUser) {
      form.reset({
        vf_api_key: currentUser.apiKey || "",
        budget: 60, // Default budget
      });
    }
  }, [currentUser, form]);

  const updateMutation = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      return apiRequest("POST", "/api/budget/set", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Settings updated",
        description: "Your settings have been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: SettingsFormValues) => {
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b bg-card">
        <div className="flex items-center gap-4 px-6 h-14">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Voiceflow API Settings</CardTitle>
              <CardDescription>
                Update your Voiceflow API key and budget settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="vf_api_key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voiceflow API Key</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="VF.DM.xxxxx..."
                            {...field}
                            data-testid="input-api-key"
                          />
                        </FormControl>
                        <FormDescription>
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
                        <FormLabel>Monthly Budget ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="60.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-budget"
                          />
                        </FormControl>
                        <FormDescription>
                          Your monthly budget for API usage
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
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
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Subscription Plan</CardTitle>
                <CardDescription>
                  Choose or change your subscription plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PlanSelector
                  plans={plansData.plans}
                  selectedPlanId={account?.planId || "free"}
                  onSelectPlan={(planId) => {
                    updatePlanMutation.mutate(planId);
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* GA4 Tracking Configuration */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Google Analytics 4 (GA4) Tracking</CardTitle>
              <CardDescription>
                Add your GA4 Measurement ID to track visitors on your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ga4-measurement-id">GA4 Measurement ID</Label>
                  <Input
                    id="ga4-measurement-id"
                    placeholder="G-XXXXXXXXXX"
                    value={ga4MeasurementId}
                    onChange={(e) => setGa4MeasurementId(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Your GA4 Measurement ID (format: G-XXXXXXXXXX). Find it in Google Analytics → Admin → Data Streams → Your Stream → Measurement ID
                  </p>
                </div>
                <Button
                  onClick={() => updateGa4TrackingMutation.mutate(ga4MeasurementId)}
                  disabled={updateGa4TrackingMutation.isPending}
                  className="w-full"
                >
                  {updateGa4TrackingMutation.isPending ? "Saving..." : "Save GA4 Tracking"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <Label className="text-muted-foreground">Project ID</Label>
                  <p className="text-sm font-medium" data-testid="text-project-id">
                    {currentUser?.projectId}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Account Created</Label>
                  <p className="text-sm font-medium" data-testid="text-created-at">
                    {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
