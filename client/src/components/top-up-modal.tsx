import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, DollarSign, Check } from "lucide-react";

let stripePromise: Promise<Stripe | null> | null = null;

function getStripe() {
  if (!stripePromise) {
    const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    if (!publicKey) {
      return null;
    }
    stripePromise = loadStripe(publicKey);
  }
  return stripePromise;
}

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLimit: number;
  creditsUsed: number;
  type?: "balance" | "voiceflow_credits"; // Payment type
}

const PRESET_AMOUNTS = [10, 25, 50, 100];

function CheckoutForm({ amount, onSuccess, type }: { amount: number; onSuccess: () => void; type?: "balance" | "voiceflow_credits" }) {
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
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        await apiRequest("POST", "/api/complete-payment", {
          amount,
          paymentIntentId: paymentIntent.id,
          type: type || "balance",
        });

        const creditsToAdd = type === "voiceflow_credits" ? Math.floor(amount / 0.006) : null;
        toast({
          title: "Payment Successful",
          description: type === "voiceflow_credits" 
            ? `Successfully purchased ${creditsToAdd?.toLocaleString()} chatbot credits!`
            : `$${amount.toFixed(2)} has been added to your account!`,
        });
        await queryClient.invalidateQueries({ queryKey: ["/api/account"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        onSuccess();
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
        size="lg"
        data-testid="button-submit-payment"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" />
            Pay ${amount.toFixed(2)}
          </>
        )}
      </Button>
    </form>
  );
}

export function TopUpModal({ isOpen, onClose, currentLimit, creditsUsed, type = "balance" }: TopUpModalProps) {
  const [selectedAmount, setSelectedAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [step, setStep] = useState<"select" | "checkout">("select");
  const { toast } = useToast();

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setSelectedAmount(numValue);
    }
  };

  const handleProceedToCheckout = async () => {
    if (selectedAmount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Please enter an amount of at least $1.00",
        variant: "destructive",
      });
      return;
    }

    if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
      toast({
        title: "Payment Unavailable",
        description: "Stripe payment integration is not configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingPayment(true);
    try {
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount: selectedAmount,
        type: type,
      });
      const data = await response.json();
      setClientSecret(data.clientSecret);
      setStep("checkout");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPayment(false);
    }
  };

  const handleClose = () => {
    setStep("select");
    setClientSecret("");
    setSelectedAmount(25);
    setCustomAmount("");
    onClose();
  };

  const handleSuccess = () => {
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-top-up">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {type === "voiceflow_credits" ? "Buy Chatbot Credits" : "Add AI Tokens"}
          </DialogTitle>
          <DialogDescription>
            {type === "voiceflow_credits" ? (
              <>Purchase chatbot credits via Stripe payment</>
            ) : (
              <>
                Credit limit: <span className="font-semibold text-foreground">${currentLimit.toFixed(2)}</span> |
                Used: <span className="font-semibold text-foreground">${creditsUsed.toFixed(2)}</span> |
                Remaining: <span className="font-semibold text-foreground">${(currentLimit - creditsUsed).toFixed(2)}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Select Amount</Label>
              <div className="grid grid-cols-2 gap-3">
                {PRESET_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    variant={selectedAmount === amount && !customAmount ? "default" : "outline"}
                    onClick={() => handleAmountSelect(amount)}
                    className="h-16 text-lg font-semibold"
                    data-testid={`button-amount-${amount}`}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-amount">Custom Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="custom-amount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Enter custom amount"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="pl-9"
                  data-testid="input-custom-amount"
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              {type === "voiceflow_credits" && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-muted-foreground">You'll receive:</span>
                    <span className="font-bold text-xl text-foreground">
                      {Math.floor(selectedAmount / 0.006).toLocaleString()} credits
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Rate: $30 = 5,000 credits
                  </div>
                </div>
              )}
              <div className="flex justify-between mb-4">
                <span className="text-muted-foreground">Amount to {type === "voiceflow_credits" ? "pay" : "add"}:</span>
                <span className="font-semibold text-xl text-foreground">${selectedAmount.toFixed(2)}</span>
              </div>
              <Button
                onClick={handleProceedToCheckout}
                disabled={isLoadingPayment || selectedAmount < 1}
                className="w-full"
                size="lg"
                data-testid="button-proceed-checkout"
              >
                {isLoadingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Proceed to Checkout'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "checkout" && clientSecret && (
          <div className="py-4">
            {getStripe() ? (
              <Elements stripe={getStripe()} options={{ clientSecret }}>
                <CheckoutForm amount={selectedAmount} onSuccess={handleSuccess} type={type} />
              </Elements>
            ) : (
              <div className="text-center text-muted-foreground p-4">
                Stripe is not configured. Please add your API keys.
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
