"use client"

import { useState, useCallback, useEffect } from "react"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { TranscriptList } from "@/components/TranscriptList"
import { TranscriptChat } from "@/components/TranscriptChat"
import { BulkExportBar } from "@/components/BulkExportBar"
import type { Message } from "@shared/schema"
import { MessageSquare, RefreshCw, Settings, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { queryClient, apiRequest } from "@/lib/queryClient"
import { useLocation } from "wouter"

const TAILADMIN_PURPLE = "#9333EA"
const TAILADMIN_PURPLE_LIGHT = "rgba(147, 51, 234, 0.08)"

export default function Transcripts() {
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string | null>(null)
  const [selectedForExport, setSelectedForExport] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const [, setLocation] = useLocation()

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {})
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] })
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to logout",
        variant: "destructive",
      })
    }
  }

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingTranscripts,
    refetch: refetchTranscripts,
    isRefetching: isRefetchingTranscripts,
  } = useInfiniteQuery({
    queryKey: ["/api/transcripts"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(`/api/transcripts?page=${pageParam}&limit=50`)
      if (!res.ok) throw new Error("Failed to fetch transcripts")
      const json = await res.json()

      if (Array.isArray(json)) {
        return { transcripts: json, page: pageParam, hasMore: false }
      }
      return json
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined
    },
    initialPageParam: 1,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  })

  const transcripts = (data?.pages.flatMap((page) => page.transcripts || []) || []).filter(
    (t) => t && typeof t === "object" && t.id,
  )

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/transcripts"] }).then(() => {
      refetchTranscripts().catch((error) => {
        console.error("[Transcripts] Auto-refetch error:", error)
      })
    })
  }, [])

  useEffect(() => {
    if (transcripts.length > 0 && !selectedTranscriptId) {
      const firstValidTranscript = transcripts.find((t) => t && typeof t.id === "string" && t.id.length > 0)
      if (firstValidTranscript) {
        setSelectedTranscriptId(firstValidTranscript.id)
      }
    }
  }, [transcripts, selectedTranscriptId])

  const handleRefresh = async () => {
    try {
      const refreshResponse = await apiRequest("POST", "/api/transcripts/refresh", {})
      const refreshData = await refreshResponse.json()

      await queryClient.invalidateQueries({ queryKey: ["/api/transcripts"] })
      await refetchTranscripts()

      if (selectedTranscriptId) {
        await queryClient.invalidateQueries({ queryKey: ["/api/transcripts", selectedTranscriptId, "messages"] })
      }

      toast({
        title: "Refreshed",
        description: refreshData.message || `Refreshed ${refreshData.transcriptsCount || 0} transcripts`,
      })
    } catch (error: any) {
      toast({
        title: "Refresh Error",
        description: error.message || "Failed to refresh transcripts",
        variant: "destructive",
      })
    }
  }

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/transcripts", selectedTranscriptId, "messages"],
    queryFn: async () => {
      const res = await fetch(`/api/transcripts/${selectedTranscriptId}/messages`)
      if (!res.ok) throw new Error("Failed to fetch messages")
      return res.json()
    },
    enabled: !!selectedTranscriptId,
  })

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleToggleSelection = (id: string) => {
    setSelectedForExport((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleSelectAll = (ids: string[]) => {
    setSelectedForExport(new Set(ids))
  }

  const handleClearSelection = () => {
    setSelectedForExport(new Set())
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: TAILADMIN_PURPLE }}
              >
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Transcript Viewer</h1>
                <p className="text-sm text-muted-foreground">View and manage conversation transcripts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefetchingTranscripts || isLoadingTranscripts}
                data-testid="button-refresh"
                className="rounded-xl border-border hover:bg-muted bg-transparent"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isRefetchingTranscripts || isLoadingTranscripts ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/settings")}
                data-testid="button-settings"
                className="rounded-xl border-border hover:bg-muted"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
                className="rounded-xl border-border hover:bg-muted hover:text-red-500 hover:border-red-200 bg-transparent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Bulk Export Bar */}
      {selectedForExport.size > 0 && (
        <BulkExportBar
          selectedCount={selectedForExport.size}
          selectedIds={Array.from(selectedForExport)}
          onClear={handleClearSelection}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 lg:w-96 flex-shrink-0 bg-card border-r border-border">
          <TranscriptList
            transcripts={transcripts}
            selectedId={selectedTranscriptId}
            onSelect={setSelectedTranscriptId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isLoading={isLoadingTranscripts}
            onLoadMore={handleLoadMore}
            hasMore={hasNextPage}
            isLoadingMore={isFetchingNextPage}
            selectedForExport={selectedForExport}
            onToggleSelection={handleToggleSelection}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
          />
        </div>

        {/* Main Panel */}
        <div className="flex-1 bg-background">
          {selectedTranscriptId ? (
            <TranscriptChat messages={messages} transcriptId={selectedTranscriptId} isLoading={isLoadingMessages} />
          ) : (
            <div className="flex flex-col h-full items-center justify-center">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                style={{ backgroundColor: TAILADMIN_PURPLE_LIGHT }}
              >
                <MessageSquare className="w-10 h-10" style={{ color: TAILADMIN_PURPLE }} />
              </div>
              <p className="text-xl font-semibold text-foreground mb-2">Select a transcript</p>
              <p className="text-muted-foreground">Choose a conversation from the list to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
