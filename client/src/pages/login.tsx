import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { login } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { setLastLoginTime } from "@/components/protected-route";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [projectId, setProjectId] = useState("");
  const [vfApiKey, setVfApiKey] = useState("");
  const [budget, setBudget] = useState("60");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectId.trim()) {
      toast({
        title: "Project ID required",
        description: "Please enter your Voiceflow project ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(
        projectId,
        vfApiKey || undefined,
        parseFloat(budget) || 60
      );

      if (result.success) {
        // Set the last login time for grace period protection
        setLastLoginTime();
        
        toast({
          title: "Login successful",
          description: `Welcome to project ${projectId}`,
        });
        
        // clear all cached queries so Usage and Dashboard refetch live data
        queryClient.clear();
        
        // Add a small delay to ensure session is fully established before redirect
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Verify session one more time before redirect
        const { checkSession } = await import("@/lib/auth");
        const finalCheck = await checkSession();
        
        if (finalCheck.authenticated) {
          setLocation("/");
        } else {
          // Retry once after a longer delay
          await new Promise(resolve => setTimeout(resolve, 500));
          const retryCheck = await checkSession();
          
          if (retryCheck.authenticated) {
            setLocation("/");
          } else {
            console.error("[Login] Session verification failed after retry");
            toast({
              title: "Session issue",
              description: "Login succeeded but session verification failed. Please try again.",
              variant: "destructive",
            });
          }
        }
      } else {
        toast({
          title: "Login failed",
          description: result.error || "An error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[Login] Error:", error instanceof Error ? error.message : "Unknown error");
      toast({
        title: "Login failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Voiceflow Dashboard</CardTitle>
            <CardDescription className="mt-2">
              Enter your project details to access the dashboard
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Alert>
              <AlertDescription className="text-xs">
                Your project ID can be found in the Voiceflow dashboard URL or settings
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="projectId">Project ID *</Label>
              <Input
                id="projectId"
                type="text"
                placeholder="66aeff0ea380c590e96e8e70"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                data-testid="input-project-id"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vfApiKey">Voiceflow API Key (Optional)</Label>
              <Input
                id="vfApiKey"
                type="password"
                placeholder="VF.DM.xxxxx..."
                value={vfApiKey}
                onChange={(e) => setVfApiKey(e.target.value)}
                data-testid="input-api-key"
              />
              <p className="text-xs text-muted-foreground">
                Optional: For live credit tracking from Voiceflow
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Monthly Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="60"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                min="0"
                step="0.01"
                data-testid="input-budget"
              />
              <p className="text-xs text-muted-foreground">
                10,000 credits = $60
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "Logging in..." : "Access Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
