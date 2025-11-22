import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface BulkExportBarProps {
  selectedCount: number;
  selectedIds: string[];
  onClear: () => void;
}

export function BulkExportBar({ selectedCount, selectedIds, onClear }: BulkExportBarProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleBulkExport = async (exportFormat: "json" | "txt") => {
    if (selectedIds.length === 0) return;

    setIsExporting(true);
    try {
      const response = await fetch("/api/transcripts/bulk-export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcriptIds: selectedIds,
          format: exportFormat,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to export transcripts");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const timestamp = format(new Date(), "yyyy-MM-dd-HHmmss");
      a.download = `transcripts-bulk-${timestamp}.${exportFormat === "json" ? "zip" : "zip"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: `${selectedCount} transcript${selectedCount > 1 ? "s" : ""} exported as ${exportFormat.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Bulk export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export transcripts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-primary text-primary-foreground px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          {selectedCount} transcript{selectedCount > 1 ? "s" : ""} selected
        </span>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              disabled={isExporting}
              data-testid="button-bulk-export"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleBulkExport("json")}
              data-testid="menu-export-json"
            >
              Export as JSON
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleBulkExport("txt")}
              data-testid="menu-export-txt"
            >
              Export as TXT
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="h-9 w-9"
          data-testid="button-clear-selection"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
