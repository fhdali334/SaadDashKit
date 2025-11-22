import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plan } from "@shared/schema";
import { Check, Package, Zap, CreditCard } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Only initialize Stripe if a publishable key is available
function getStripePromise(): Promise<Stripe | null> | null {
  const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!publicKey || publicKey.trim() === "") {
    console.warn("[PlanSelector] Stripe publishable key not configured. Stripe features will be disabled.");
    return null;
  }
  return loadStripe(publicKey);
}

interface PlanSelectorProps {
  plans: Plan[];
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
}

function PaymentForm({ planId, planName, price, clientSecret, onSuccess, onCancel }: {
  planId: string;
  planName: string;
  price: number;
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw submitError;
      }

      // Confirm payment with existing clientSecret
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        clientSecret,
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (confirmError) {
        throw confirmError;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        // Complete payment on backend
        const completeRes = await fetch("/api/plans/complete-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ 
            planId, 
            paymentIntentId: paymentIntent.id 
          }),
        });

        if (!completeRes.ok) {
          const error = await completeRes.json();
          throw new Error(error.error || "Failed to complete payment");
        }

        toast({
          title: "Payment successful!",
          description: `You've successfully subscribed to the ${planName} plan.`,
        });

        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message || "An error occurred during payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1"
        >
          {isProcessing ? "Processing..." : `Pay $${price}/month`}
        </Button>
      </div>
    </form>
  );
}

export function PlanSelector({ plans, selectedPlanId, onSelectPlan }: PlanSelectorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const sortedPlans = [...plans].sort((a, b) => a.tier - b.tier);

  const handlePlanClick = async (plan: Plan) => {
    // If already selected, do nothing
    if (plan.id === selectedPlanId) {
      return;
    }

    // Free plan can be selected directly
    if (plan.price === 0) {
      updatePlanMutation.mutate(plan.id);
      return;
    }

    // Check if Stripe is configured before attempting payment
    const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publicKey || publicKey.trim() === "") {
      toast({
        title: "Payment Unavailable",
        description: "Stripe payment integration is not configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    // Paid plans require payment
    try {
      // Create payment intent
      const res = await fetch("/api/plans/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId: plan.id }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create payment intent");
      }

      const data = await res.json();
      setClientSecret(data.clientSecret);
      setSelectedPlan(plan);
      setShowPaymentDialog(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
    }
  };

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

  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false);
    setSelectedPlan(null);
    setClientSecret(null);
    queryClient.invalidateQueries({ queryKey: ["/api/account"] });
    queryClient.invalidateQueries({ queryKey: ["/api/usage-records"] });
    if (selectedPlan) {
      onSelectPlan(selectedPlan.id);
    }
  };

  return (
    <>
      <Card data-testid="card-plan-selector">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Select Your Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedPlans.map((plan) => (
              <Button
                key={plan.id}
                variant={selectedPlanId === plan.id ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-center gap-2 relative"
                onClick={() => handlePlanClick(plan)}
                data-testid={`button-plan-${plan.tier}`}
                disabled={updatePlanMutation.isPending}
              >
                {selectedPlanId === plan.id && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-4 h-4" />
                  </div>
                )}
                <span className="text-lg font-bold">{plan.name}</span>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl font-bold font-mono">
                    ${plan.price === 0 ? "0" : plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-xs text-muted-foreground">/month</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  ${plan.initialBalance.toFixed(0)} Initial Balance
                </span>
                <Badge variant="secondary" className="mt-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {plan.voiceflowCredits.toLocaleString()} chatbot credits
                </Badge>
                {plan.price > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                    <CreditCard className="w-3 h-3" />
                    Payment required
                  </div>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {showPaymentDialog && selectedPlan && clientSecret && (
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Subscribe to {selectedPlan.name}</DialogTitle>
              <DialogDescription>
                Complete your payment to upgrade to the {selectedPlan.name} plan.
              </DialogDescription>
            </DialogHeader>
            {getStripePromise() ? (
              <Elements stripe={getStripePromise()} options={{ clientSecret }}>
                <PaymentForm
                  planId={selectedPlan.id}
                  planName={selectedPlan.name}
                  price={selectedPlan.price}
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => {
                    setShowPaymentDialog(false);
                    setSelectedPlan(null);
                    setClientSecret(null);
                  }}
                />
              </Elements>
            ) : (
              <div className="text-center text-muted-foreground p-4">
                Stripe payment integration is not configured. Please set VITE_STRIPE_PUBLIC_KEY or VITE_STRIPE_PUBLISHABLE_KEY environment variable.
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
