import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { LucideIcon } from "lucide-react"

const TAILADMIN_BLUE = "#465FFF"

interface UsagePanelProps {
  title: string
  icon: LucideIcon
  tokensUsed: number
  costUsd?: number
  systemCost?: number
  multiplier?: number
  maxTokens?: number
  isCredits?: boolean
  isLoading?: boolean
  balance?: number
  showUsd?: boolean
}

export function UsagePanel({
  title,
  icon: Icon,
  tokensUsed,
  costUsd,
  systemCost,
  multiplier,
  maxTokens,
  isCredits = false,
  isLoading = false,
  balance,
  showUsd = false,
}: UsagePanelProps) {
  const totalBalance = maxTokens || 0
  const used = tokensUsed
  const remaining = balance !== undefined ? balance : totalBalance - used
  const progressPercent = totalBalance > 0 ? Math.min((used / totalBalance) * 100, 100) : 0

  const formatValue = (value: number) => {
    if (showUsd) {
      return `$${value.toFixed(2)}`
    }
    return value.toLocaleString()
  }

  return (
    <Card
      className="border-gray-200 bg-white shadow-sm"
      data-testid={`card-usage-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Icon className="w-5 h-5" style={{ color: TAILADMIN_BLUE }} />
          {title}
        </CardTitle>
        {multiplier && (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-600 border-gray-200"
            data-testid="badge-multiplier"
          >
            {multiplier}x
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <>
            <div>
              <p className="text-sm text-gray-500 mb-1">{isCredits ? "Credits Used" : "Tokens Used"}</p>
              <Skeleton className="h-8 w-24" />
            </div>
            {maxTokens && <Skeleton className="h-2 w-full" />}
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">{isCredits ? "Credits Used" : showUsd ? "Cost" : "Tokens Used"}</p>
                <p
                  className="text-lg font-bold font-mono text-gray-800"
                  data-testid={`text-tokens-used-${title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {showUsd ? `$${used.toFixed(2)}` : used.toLocaleString()}
                </p>
              </div>

              {totalBalance > 0 && (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Total Balance</span>
                      <span className="font-semibold text-gray-700">{formatValue(totalBalance)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%`, backgroundColor: TAILADMIN_BLUE }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">{remaining >= 0 ? "Remaining" : "Over Limit"}</span>
                      <span className={`font-semibold ${remaining < 0 ? "text-red-500" : "text-gray-700"}`}>
                        {formatValue(Math.abs(remaining))}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
