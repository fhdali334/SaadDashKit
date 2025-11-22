import { useState, useCallback, useEffect } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { TranscriptList } from "@/components/TranscriptList";
import { TranscriptChat } from "@/components/TranscriptChat";
import { BulkExportBar } from "@/components/BulkExportBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Transcript, Message } from "@shared/schema";
import { MessageSquare, Settings as SettingsIcon, LogOut, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function Transcripts() {
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string | null>(null);
  const [selectedForExport, setSelectedForExport] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    }
  };

  // Use infinite query for transcripts with pagination (loading from CSV)
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
      const res = await fetch(`/api/transcripts?page=${pageParam}&limit=50`);
      if (!res.ok) throw new Error("Failed to fetch transcripts");
      const json = await res.json();
      
      // Handle both old format (array) and new format (object with transcripts property)
      if (Array.isArray(json)) {
        // Old format: return array directly as a page
        return { transcripts: json, page: pageParam, hasMore: false };
      }
      // New format: object with transcripts property
      return json;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: false, // Only refetch when window is focused
  });

  // Flatten all transcript pages - filter out any undefined/null values
  const transcripts = (data?.pages.flatMap((page) => page.transcripts || []) || [])
    .filter((t) => t && typeof t === 'object' && t.id);

  // Refetch transcripts when page is navigated to
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/transcripts"] }).then(() => {
      refetchTranscripts().catch((error) => {
        console.error('[Transcripts] Auto-refetch error:', error);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Refetch when component mounts (when navigating to this page)

  // Auto-select first transcript when data loads
  useEffect(() => {
    if (transcripts.length > 0 && !selectedTranscriptId) {
      const firstValidTranscript = transcripts.find(t => t && typeof t.id === 'string' && t.id.length > 0);
      if (firstValidTranscript) {
        setSelectedTranscriptId(firstValidTranscript.id);
      }
    }
  }, [transcripts, selectedTranscriptId]);

  const handleRefresh = async () => {
    try {
      // Call the refresh endpoint to fetch new transcripts from Voiceflow
      const refreshResponse = await apiRequest("POST", "/api/transcripts/refresh", {});
      const refreshData = await refreshResponse.json();
      
      // Invalidate and refetch the transcripts query to load new data from CSV
      await queryClient.invalidateQueries({ queryKey: ["/api/transcripts"] });
      await refetchTranscripts();
      
      // Also refresh messages if a transcript is selected
      if (selectedTranscriptId) {
        await queryClient.invalidateQueries({ queryKey: ["/api/transcripts", selectedTranscriptId, "messages"] });
      }
      
      toast({
        title: "Refreshed",
        description: refreshData.message || `Refreshed ${refreshData.transcriptsCount || 0} transcripts`,
      });
    } catch (error: any) {
      console.error('[Transcripts] Refresh error:', error.message || "Failed to refresh");
      toast({
        title: "Refresh Error",
        description: error.message || "Failed to refresh transcripts",
        variant: "destructive",
      });
    }
  };

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/transcripts", selectedTranscriptId, "messages"],
    queryFn: async () => {
      const res = await fetch(`/api/transcripts/${selectedTranscriptId}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!selectedTranscriptId,
  });

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleToggleSelection = (id: string) => {
    setSelectedForExport((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (ids: string[]) => {
    setSelectedForExport(new Set(ids));
  };

  const handleClearSelection = () => {
    setSelectedForExport(new Set());
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Transcript Viewer</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefetchingTranscripts || isLoadingTranscripts}
              data-testid="button-refresh"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(isRefetchingTranscripts || isLoadingTranscripts) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/settings")}
              data-testid="button-settings"
            >
              <SettingsIcon className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
            <ThemeToggle />
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
        <div className="w-80 flex-shrink-0">
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
        <div className="flex-1">
          {selectedTranscriptId ? (
            <TranscriptChat
              messages={messages}
              transcriptId={selectedTranscriptId}
              isLoading={isLoadingMessages}
            />
          ) : (
            <div className="flex flex-col h-full items-center justify-center">
              <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Select a transcript to view
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
