import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SimulateUsageModalProps {
  open: boolean;
  onClose: () => void;
}

export function SimulateUsageModal({ open, onClose }: SimulateUsageModalProps) {
  const [projectId, setProjectId] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const simulateUsageMutation = useMutation({
    mutationFn: async (data: { projectId: string }) => {
      const response = await fetch("/api/usage/deduct", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to deduct usage");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage-records"] });

      toast({
        title: "Usage Deducted",
        description: `Deducted $${data.amountDeducted} for ${data.category.replace('_', ' ')} (Project: ${data.projectId})`,
      });

      setProjectId("");
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to deduct usage",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId.trim()) {
      toast({
        title: "Invalid Project ID",
        description: "Please enter a valid project ID",
        variant: "destructive",
      });
      return;
    }

    simulateUsageMutation.mutate({ projectId: projectId.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-simulate-usage">
        <DialogHeader>
          <DialogTitle>Simulate Usage</DialogTitle>
          <DialogDescription>
            Enter a project ID to automatically calculate and deduct usage
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectId">Project ID</Label>
            <Input
              id="projectId"
              type="text"
              placeholder="project-123"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              data-testid="input-project-id"
              required
            />
            <p className="text-xs text-muted-foreground">
              System will automatically calculate usage and deduct credits
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-usage"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={simulateUsageMutation.isPending}
              data-testid="button-submit-usage"
            >
              {simulateUsageMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Deduct Usage
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
