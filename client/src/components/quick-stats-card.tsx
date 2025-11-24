import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface QuickStatsCardProps {
  successRate: number
  avgMessagesPerSession: number
  storageUsed: number
}

export function QuickStatsCard({ successRate, avgMessagesPerSession, storageUsed }: QuickStatsCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Success Rate</span>
            <span className="font-semibold">{successRate.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Avg. Messages/Session</span>
            <span className="font-semibold">{avgMessagesPerSession.toFixed(1)}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Storage Used</span>
            <span className="font-semibold">{storageUsed} files</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
