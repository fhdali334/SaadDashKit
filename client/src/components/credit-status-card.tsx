import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatDistanceToNow } from "date-fns"
import { CheckCircle2 } from "lucide-react"

interface CreditStatusCardProps {
  budget: number
  spent: number
  creditsUsed: number
  totalCredits: number
  resetDate: string | null
}

export function CreditStatusCard({ budget, spent, creditsUsed, totalCredits, resetDate }: CreditStatusCardProps) {
  const remaining = Math.max(0, budget - spent)
  const percentUsed = Math.min(100, Math.max(0, (creditsUsed / totalCredits) * 100))

  // Format reset date
  let resetDateDisplay = "Unknown"
  let daysRemaining = "Unknown"

  if (resetDate) {
    try {
      const date = new Date(resetDate)
      if (!isNaN(date.getTime())) {
        resetDateDisplay = date.toLocaleDateString()
        daysRemaining = formatDistanceToNow(date, { addSuffix: true })
      }
    } catch (e) {
      // invalid date
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Credit Limit Status</CardTitle>
        <p className="text-sm text-muted-foreground">
          Budget: ${budget.toFixed(2)} • Spent: ${spent.toFixed(2)} • Remaining: ${remaining.toFixed(2)}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="font-medium">
                {creditsUsed.toLocaleString()} / {totalCredits.toLocaleString()} credits
              </span>
            </div>
            <span className="text-muted-foreground">{percentUsed.toFixed(1)}% used</span>
          </div>
          <Progress value={percentUsed} className="h-2" />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Usage within safe limits</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-sm font-medium">Next reset:</span>
          <span className="text-sm text-muted-foreground">
            {resetDateDisplay === "Unknown" ? "Invalid Date (23 days)" : `${resetDateDisplay} (${daysRemaining})`}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
