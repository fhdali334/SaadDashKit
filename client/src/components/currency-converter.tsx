import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, DollarSign } from "lucide-react";

export function CurrencyConverter() {
  const [usdAmount, setUsdAmount] = useState<string>("1.00");
  
  const VOICEFLOW_RATE = 5000 / 30; // 5000 credits per $30
  
  const usdValue = parseFloat(usdAmount) || 0;
  // No multiplier - OpenAI cost is actual cost
  const openaiCost = usdValue;
  const voiceflowCredits = usdValue * VOICEFLOW_RATE;

  return (
    <Card data-testid="card-currency-converter">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Currency Converter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="usd-input" className="text-sm font-medium">
            USD Amount
          </Label>
          <Input
            id="usd-input"
            type="number"
            step="0.01"
            min="0"
            value={usdAmount}
            onChange={(e) => setUsdAmount(e.target.value)}
            className="mt-1 font-mono"
            data-testid="input-usd-amount"
          />
        </div>

        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">OpenAI Cost</p>
              <p className="text-xs text-muted-foreground">(actual cost)</p>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <p className="text-xl font-bold font-mono" data-testid="text-openai-conversion">
                ${openaiCost.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Voiceflow Credits</p>
              <p className="text-xs text-muted-foreground">($30 = 5k credits)</p>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <p className="text-xl font-bold font-mono" data-testid="text-voiceflow-conversion">
                {voiceflowCredits.toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

