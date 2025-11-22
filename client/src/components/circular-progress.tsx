"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CircularProgressProps {
  percentage: number
  title: string
  subtitle: string
  message: string
}

export function CircularProgress({ percentage, title, subtitle, message }: CircularProgressProps) {
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <Card className="border-card-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <button className="p-1.5 hover:bg-muted rounded-md transition-colors">
            <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="relative w-40 h-40">
          <svg width="160" height="160" className="transform -rotate-90">
            {/* Background circle */}
            <circle cx="80" cy="80" r="45" fill="none" stroke="var(--color-border)" strokeWidth="8" />
            {/* Progress circle */}
            <circle
              cx="80"
              cy="80"
              r="45"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">{percentage.toFixed(2)}%</div>
              <div className="text-sm text-muted-foreground mt-1">+10%</div>
            </div>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground">{message}</p>
        <div className="grid grid-cols-3 gap-4 w-full pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Target</p>
            <p className="font-semibold text-foreground">$20K</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Revenue</p>
            <p className="font-semibold text-foreground">$20K</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Today</p>
            <p className="font-semibold text-foreground">$20K</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
