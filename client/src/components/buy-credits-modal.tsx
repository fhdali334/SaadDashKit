import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, DollarSign, Zap, Brain } from "lucide-react";

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "voiceflow" | "openai";
  currentBalance: number;
}

const PRESET_AMOUNTS = [5, 10, 25, 50];

export function BuyCreditsModal({ isOpen, onClose, type, currentBalance }: BuyCreditsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAmount, setSelectedAmount] = useState(10);
  const [customAmount, setCustomAmount] = useState("");

  const purchaseMutation = useMutation({
    mutationFn: async (amount: number) => {
      const endpoint = type === "voiceflow" 
        ? "/api/purchase/voiceflow-credits"
        : "/api/purchase/openai-balance";
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Purchase failed");
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      toast({
        title: "Purchase Successful",
        description: data.message,
      });
      
      onClose();
      setSelectedAmount(10);
      setCustomAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

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

  const handlePurchase = () => {
    if (selectedAmount < 0.01) {
      toast({
        title: "Invalid Amount",
        description: "Please enter an amount of at least $0.01",
        variant: "destructive",
      });
      return;
    }

    if (selectedAmount > currentBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You have $${currentBalance.toFixed(2)} available, but need $${selectedAmount.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    purchaseMutation.mutate(selectedAmount);
  };

  const handleClose = () => {
    setSelectedAmount(10);
    setCustomAmount("");
    onClose();
  };

  // Calculate what they'll get
  const creditsToReceive = type === "voiceflow" 
    ? Math.floor(selectedAmount / 0.006) // $30 = 5000 credits
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            {type === "voiceflow" ? (
              <>
                <Zap className="w-5 h-5 text-yellow-500" />
                Buy Voiceflow Credits
              </>
            ) : (
              <>
                <Brain className="w-5 h-5 text-blue-500" />
                Add OpenAI Balance
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Available balance: <span className="font-semibold text-foreground">${currentBalance.toFixed(2)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Amount to Spend (USD)</Label>
            <div className="grid grid-cols-2 gap-3">
              {PRESET_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  variant={selectedAmount === amount && !customAmount ? "default" : "outline"}
                  onClick={() => handleAmountSelect(amount)}
                  className="h-16 text-lg font-semibold"
                  disabled={amount > currentBalance}
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
                min="0.01"
                step="0.01"
                max={currentBalance}
                placeholder="Enter custom amount"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {type === "voiceflow" && creditsToReceive && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">You'll receive:</span>
                <span className="font-bold text-xl text-foreground">
                  {creditsToReceive.toLocaleString()} credits
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Rate: $30 = 5,000 credits
              </div>
            </div>
          )}

          {type === "openai" && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Balance will increase by:</span>
                <span className="font-bold text-xl text-foreground">
                  ${selectedAmount.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <div className="flex justify-between mb-4">
              <span className="text-muted-foreground">Amount to spend:</span>
              <span className="font-semibold text-xl text-foreground">${selectedAmount.toFixed(2)}</span>
            </div>
            <Button
              onClick={handlePurchase}
              disabled={purchaseMutation.isPending || selectedAmount < 0.01 || selectedAmount > currentBalance}
              className="w-full"
              size="lg"
            >
              {purchaseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {type === "voiceflow" ? (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Buy {creditsToReceive?.toLocaleString()} Credits
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Add ${selectedAmount.toFixed(2)} Balance
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

