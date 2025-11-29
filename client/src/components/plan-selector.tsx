"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Plan } from "@shared/schema"
import { Check, Package, Zap, CreditCard } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { loadStripe, type Stripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const TAILADMIN_BLUE = "#3b82f6"

// Only initialize Stripe if a publishable key is available
function getStripePromise(): Promise<Stripe | null> | null {
  const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  if (!publicKey || publicKey.trim() === "") {
    console.warn("[PlanSelector] Stripe publishable key not configured. Stripe features will be disabled.")
    return null
  }
  return loadStripe(publicKey)
}

interface PlanSelectorProps {
  plans: Plan[]
  selectedPlanId: string
  onSelectPlan: (planId: string) => void
}

function PaymentForm({
  planId,
  planName,
  price,
  clientSecret,
  onSuccess,
  onCancel,
}: {
  planId: string
  planName: string
  price: number
  clientSecret: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        throw submitError
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        clientSecret,
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      })

      if (confirmError) {
        throw confirmError
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        const completeRes = await fetch("/api/plans/complete-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            planId,
            paymentIntentId: paymentIntent.id,
          }),
        })

        if (!completeRes.ok) {
          const error = await completeRes.json()
          throw new Error(error.error || "Failed to complete payment")
        }

        toast({
          title: "Payment successful!",
          description: `You've successfully subscribed to the ${planName} plan.`,
        })

        onSuccess()
      }
    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message || "An error occurred during payment",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex flex-col sm:flex-row gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 order-2 sm:order-1 bg-transparent border-border hover:bg-muted"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 order-1 sm:order-2 text-white hover:opacity-90"
          style={{ backgroundColor: TAILADMIN_BLUE }}
        >
          {isProcessing ? "Processing..." : `Pay $${price}/month`}
        </Button>
      </div>
    </form>
  )
}

export function PlanSelector({ plans, selectedPlanId, onSelectPlan }: PlanSelectorProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  const sortedPlans = [...plans].sort((a, b) => a.tier - b.tier)

  const handlePlanClick = async (plan: Plan) => {
    if (plan.id === selectedPlanId) {
      return
    }

    if (plan.price === 0) {
      updatePlanMutation.mutate(plan.id)
      return
    }

    const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    if (!publicKey || publicKey.trim() === "") {
      toast({
        title: "Payment Unavailable",
        description: "Stripe payment integration is not configured. Please contact support.",
        variant: "destructive",
      })
      return
    }

    try {
      const res = await fetch("/api/plans/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId: plan.id }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to create payment intent")
      }

      const data = await res.json()
      setClientSecret(data.clientSecret)
      setSelectedPlan(plan)
      setShowPaymentDialog(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      })
    }
  }

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

  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false)
    setSelectedPlan(null)
    setClientSecret(null)
    queryClient.invalidateQueries({ queryKey: ["/api/account"] })
    queryClient.invalidateQueries({ queryKey: ["/api/usage-records"] })
    if (selectedPlan) {
      onSelectPlan(selectedPlan.id)
    }
  }

  return (
    <>
      <Card data-testid="card-plan-selector" className="border-border bg-card shadow-sm">
        <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-foreground">
            <Package className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: TAILADMIN_BLUE }} />
            Select Your Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {sortedPlans.map((plan) => {
              const isSelected = selectedPlanId === plan.id
              return (
                <button
                  key={plan.id}
                  type="button"
                  className={`
                    relative h-auto p-3 sm:p-4 flex flex-col items-center gap-2 rounded-xl border-2 transition-all
                    ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                        : "border-border bg-card hover:border-blue-300 dark:hover:border-blue-700 hover:bg-muted/50 dark:hover:bg-muted/30"
                    }
                  `}
                  onClick={() => handlePlanClick(plan)}
                  data-testid={`button-plan-${plan.tier}`}
                  disabled={updatePlanMutation.isPending}
                >
                  {isSelected && (
                    <div
                      className="absolute top-2 right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: TAILADMIN_BLUE }}
                    >
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                  )}
                  <span className="text-base sm:text-lg font-bold text-foreground">{plan.name}</span>
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                    <span className="text-xl sm:text-2xl font-bold font-mono text-foreground">
                      ${plan.price === 0 ? "0" : plan.price}
                    </span>
                    {plan.price > 0 && <span className="text-xs text-muted-foreground">/month</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ${plan.initialBalance.toFixed(0)} Initial Balance
                  </span>
                  <Badge
                    variant="secondary"
                    className={`mt-1 flex items-center gap-1 text-xs ${
                      isSelected
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    {plan.voiceflowCredits.toLocaleString()} credits
                  </Badge>
                  {plan.price > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: TAILADMIN_BLUE }}>
                      <CreditCard className="w-3 h-3" />
                      Payment required
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {showPaymentDialog && selectedPlan && clientSecret && (
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="w-[95vw] max-w-md mx-auto bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg text-foreground">
                Subscribe to {selectedPlan.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
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
                    setShowPaymentDialog(false)
                    setSelectedPlan(null)
                    setClientSecret(null)
                  }}
                />
              </Elements>
            ) : (
              <div className="text-center text-muted-foreground p-4 text-sm">
                Stripe payment integration is not configured. Please set VITE_STRIPE_PUBLIC_KEY or
                VITE_STRIPE_PUBLISHABLE_KEY environment variable.
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
