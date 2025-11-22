import { Search, Loader2, Calendar, X, Filter, Clock, CheckSquare, Square } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Transcript } from "@shared/schema";
import { formatDistanceToNow, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

interface TranscriptListProps {
  transcripts: Transcript[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  selectedForExport?: Set<string>;
  onToggleSelection?: (id: string) => void;
  onSelectAll?: (ids: string[]) => void;
  onClearSelection?: () => void;
}

export function TranscriptList({
  transcripts,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  isLoading,
  onLoadMore,
  hasMore,
  isLoadingMore,
  selectedForExport = new Set(),
  onToggleSelection,
  onSelectAll,
  onClearSelection,
}: TranscriptListProps) {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [durationFilter, setDurationFilter] = useState<{ min?: number; max?: number }>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Defensive filtering: drop null/undefined or items missing required fields
  const filteredTranscripts = transcripts
    .filter((t) => !!t && typeof t.id === "string" && typeof t.sessionID === "string" && typeof t.createdAt === "string")
    .filter((t) => {
    // Text search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        t.id.toLowerCase().includes(query) ||
        t.sessionID.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Date range filter
    if (dateRange.from || dateRange.to) {
      const transcriptDate = new Date(t.createdAt);
      
      if (dateRange.from && dateRange.to) {
        const isInRange = isWithinInterval(transcriptDate, {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to),
        });
        if (!isInRange) return false;
      } else if (dateRange.from) {
        if (transcriptDate < startOfDay(dateRange.from)) return false;
      } else if (dateRange.to) {
        if (transcriptDate > endOfDay(dateRange.to)) return false;
      }
    }

    // Duration filter
    if ((durationFilter.min !== undefined || durationFilter.max !== undefined) && t.endedAt) {
      const duration = Math.round(
        (new Date(t.endedAt).getTime() - new Date(t.createdAt).getTime()) / 1000
      );
      
      if (durationFilter.min !== undefined && duration < durationFilter.min) {
        return false;
      }
      if (durationFilter.max !== undefined && duration > durationFilter.max) {
        return false;
      }
    }

    return true;
  });

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    const options = {
      root: scrollRef.current,
      rootMargin: "100px",
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
        onLoadMore();
      }
    }, options);

    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      observerRef.current.observe(currentLoadMoreRef);
    }

    return () => {
      if (observerRef.current && currentLoadMoreRef) {
        observerRef.current.unobserve(currentLoadMoreRef);
      }
    };
  }, [onLoadMore, hasMore, isLoadingMore]);

  const clearAllFilters = () => {
    setDateRange({});
    setDurationFilter({});
    onSearchChange("");
  };

  const hasActiveFilters = 
    searchQuery || 
    dateRange.from || 
    dateRange.to || 
    durationFilter.min !== undefined || 
    durationFilter.max !== undefined;

  const activeFilterCount = 
    (searchQuery ? 1 : 0) +
    (dateRange.from || dateRange.to ? 1 : 0) +
    (durationFilter.min !== undefined || durationFilter.max !== undefined ? 1 : 0);

  // Work with a safe list of IDs to avoid accessing properties on undefined
  const filteredIds = filteredTranscripts
    .map((t) => (t && typeof t.id === "string" ? t.id : undefined))
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedForExport.has(id));
  const someFilteredSelected = filteredIds.some((id) => selectedForExport.has(id));

  return (
    <div className="flex flex-col h-full border-r bg-card">
      <div className="p-4 border-b space-y-3">
        {/* Selection Header */}
        {onSelectAll && onClearSelection && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const ids = filteredTranscripts
                  .map((t) => (t && typeof t.id === "string" ? t.id : undefined))
                  .filter((id): id is string => typeof id === "string" && id.length > 0);
                if (allFilteredSelected) {
                  onClearSelection();
                } else if (ids.length > 0) {
                  onSelectAll(ids);
                }
              }}
              className="flex-1"
              data-testid="button-select-all"
            >
              {allFilteredSelected ? (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Deselect All
                </>
              ) : (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Select All
                </>
              )}
            </Button>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transcripts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
            data-testid="input-search-transcripts"
          />
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1 justify-start text-left font-normal",
                  (dateRange.from || dateRange.to) && "border-primary"
                )}
                data-testid="button-date-filter"
              >
                <Calendar className="h-4 w-4 mr-2" />
                <span className="text-xs">Date</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium">From Date</label>
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) =>
                      setDateRange((prev) => ({ ...prev, from: date }))
                    }
                    data-testid="calendar-from"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">To Date</label>
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) =>
                      setDateRange((prev) => ({ ...prev, to: date }))
                    }
                    data-testid="calendar-to"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1 justify-start text-left font-normal",
                  (durationFilter.min !== undefined || durationFilter.max !== undefined) && "border-primary"
                )}
                data-testid="button-duration-filter"
              >
                <Clock className="h-4 w-4 mr-2" />
                <span className="text-xs">Duration</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="min-duration" className="text-xs">
                    Minimum Duration (seconds)
                  </Label>
                  <Input
                    id="min-duration"
                    type="number"
                    min="0"
                    placeholder="e.g., 10"
                    value={durationFilter.min ?? ""}
                    onChange={(e) =>
                      setDurationFilter((prev) => ({
                        ...prev,
                        min: e.target.value ? parseInt(e.target.value) : undefined,
                      }))
                    }
                    data-testid="input-min-duration"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-duration" className="text-xs">
                    Maximum Duration (seconds)
                  </Label>
                  <Input
                    id="max-duration"
                    type="number"
                    min="0"
                    placeholder="e.g., 300"
                    value={durationFilter.max ?? ""}
                    onChange={(e) =>
                      setDurationFilter((prev) => ({
                        ...prev,
                        max: e.target.value ? parseInt(e.target.value) : undefined,
                      }))
                    }
                    data-testid="input-max-duration"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setDurationFilter({})}
                  data-testid="button-clear-duration"
                >
                  Clear Duration Filter
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              onClick={clearAllFilters}
              data-testid="button-clear-filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1">
            {searchQuery && (
              <Badge variant="secondary" className="text-xs">
                Search: {searchQuery.slice(0, 15)}
                {searchQuery.length > 15 && "..."}
              </Badge>
            )}
            {(dateRange.from || dateRange.to) && (
              <Badge variant="secondary" className="text-xs">
                {dateRange.from?.toLocaleDateString()} - {dateRange.to?.toLocaleDateString()}
              </Badge>
            )}
            {(durationFilter.min !== undefined || durationFilter.max !== undefined) && (
              <Badge variant="secondary" className="text-xs">
                {durationFilter.min !== undefined && `≥${durationFilter.min}s`}
                {durationFilter.min !== undefined && durationFilter.max !== undefined && " & "}
                {durationFilter.max !== undefined && `≤${durationFilter.max}s`}
              </Badge>
            )}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTranscripts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters ? "No transcripts found" : "No transcripts available"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="mt-2 text-sm text-primary hover:underline"
                data-testid="button-clear-all-filters"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="p-2">
            {filteredTranscripts.map((transcript) => (
              <div
                key={transcript.id}
                className={cn(
                  "flex items-start gap-2 p-3 rounded-md mb-1 transition-colors hover-elevate active-elevate-2",
                  selectedId === transcript.id &&
                    "bg-sidebar-accent border-l-2 border-l-primary"
                )}
                data-testid={`transcript-item-${transcript.id}`}
              >
                {onToggleSelection && (
                  <div className="pt-0.5">
                    <Checkbox
                      checked={selectedForExport.has(transcript.id)}
                      onCheckedChange={() => onToggleSelection(transcript.id)}
                      onClick={(e) => e.stopPropagation()}
                      data-testid={`checkbox-${transcript.id}`}
                    />
                  </div>
                )}
                <button
                  onClick={() => onSelect(transcript.id)}
                  className="flex-1 text-left"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-mono text-foreground truncate">
                      {transcript.sessionID.slice(0, 8)}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(transcript.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    ID: {transcript.id.slice(0, 16)}...
                  </p>
                  {transcript.endedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Duration:{" "}
                      {Math.round(
                        (new Date(transcript.endedAt).getTime() -
                          new Date(transcript.createdAt).getTime()) /
                          1000
                      )}
                      s
                    </p>
                  )}
                </button>
              </div>
            ))}
            
            {/* Infinite scroll trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="py-4 flex justify-center">
                {isLoadingMore && (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                )}
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
