import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Message } from "@shared/schema";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Copy, Download, FileText, Share2, Check, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface TranscriptChatProps {
  messages: Message[];
  transcriptId: string;
  isLoading?: boolean;
  isShared?: boolean;
}

export function TranscriptChat({ messages, transcriptId, isLoading, isShared = false }: TranscriptChatProps) {
  const { toast } = useToast();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [expiresInDays, setExpiresInDays] = useState<number>(7);
  const [isCreatingShare, setIsCreatingShare] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return format(date, "MMM d, yyyy HH:mm:ss");
    } catch (error) {
      return "Invalid date";
    }
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Message copied to clipboard",
    });
  };

  const exportTranscript = (exportFormat: "json" | "txt" | "csv") => {
    let content: string;
    let filename: string;
    let mimeType: string;

    if (exportFormat === "json") {
      content = JSON.stringify(messages, null, 2);
      filename = `transcript-${transcriptId}.json`;
      mimeType = "application/json";
    } else if (exportFormat === "csv") {
      // CSV format like the Python script
      const headers = ["transcriptID", "sessionID", "role", "message", "logCreatedAt"];
      const csvRows = [headers.join(",")];
      
      messages.forEach((m) => {
        const row = [
          m.transcriptID,
          m.sessionID,
          m.role,
          `"${m.message.replace(/"/g, '""')}"`, // Escape quotes in message
          m.logCreatedAt,
        ];
        csvRows.push(row.join(","));
      });
      
      content = csvRows.join("\n");
      filename = `transcript-${transcriptId}.csv`;
      mimeType = "text/csv";
    } else {
      content = messages
        .map(
          (m) =>
            `[${format(new Date(m.logCreatedAt), "yyyy-MM-dd HH:mm:ss")}] ${m.role.toUpperCase()}: ${m.message}`
        )
        .join("\n\n");
      filename = `transcript-${transcriptId}.txt`;
      mimeType = "text/plain";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Transcript exported as ${exportFormat.toUpperCase()}`,
    });
  };

  const createShareLink = async () => {
    setIsCreatingShare(true);
    try {
      const res = await apiRequest("POST", "/api/shared-links", {
        transcriptId,
        expiresInDays: expiresInDays > 0 ? expiresInDays : undefined,
      });
      const data = await res.json();
      const url = `${window.location.origin}/shared/${data.shareId}`;
      setShareUrl(url);
      toast({
        title: "Share Link Created",
        description: "Link copied to clipboard",
      });
      navigator.clipboard.writeText(url);
    } catch (error) {
      toast({
        title: "Failed to Create Share Link",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsCreatingShare(false);
    }
  };

  const copyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Copied",
        description: "Share link copied to clipboard",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b p-4 flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
              <div className="space-y-2 max-w-md">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-20 w-64" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b p-4">
          <p className="text-sm font-medium">Select a transcript to view messages</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              No messages in this transcript
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Transcript {transcriptId.slice(0, 16)}...</p>
          <p className="text-xs text-muted-foreground">{messages.length} messages</p>
        </div>
        <div className="flex items-center gap-2">
          {!isShared && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareDialogOpen(true)}
              data-testid="button-share"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-export">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => exportTranscript("csv")}
                data-testid="button-export-csv"
              >
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportTranscript("json")}
                data-testid="button-export-json"
              >
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportTranscript("txt")}
                data-testid="button-export-txt"
              >
                Export as TXT
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={(open) => {
        setShareDialogOpen(open);
        if (!open) setShareUrl(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Transcript</DialogTitle>
            <DialogDescription>
              Create a shareable link for this transcript. The link can optionally expire after a set number of days.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="expires-in-days">Expires in (days)</Label>
              <Input
                id="expires-in-days"
                type="number"
                min="0"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 0)}
                placeholder="7"
                data-testid="input-expires-days"
              />
              <p className="text-xs text-muted-foreground">
                Set to 0 for no expiration
              </p>
            </div>
            {shareUrl ? (
              <div className="space-y-2">
                <Label>Share URL</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    data-testid="input-share-url"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyShareUrl}
                    data-testid="button-copy-share-url"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={createShareLink}
                disabled={isCreatingShare}
                className="w-full"
                data-testid="button-create-share-link"
              >
                {isCreatingShare ? "Creating..." : "Create Share Link"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "ai" && (
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                </div>
              )}
              
              <div className={cn("space-y-2 max-w-lg group", message.role === "user" && "flex flex-col items-end")}>
                <div className={cn("flex items-center gap-2", message.role === "user" && "flex-row-reverse")}>
                  <Badge variant={message.role === "user" ? "default" : "secondary"} className="text-xs">
                    {message.role === "user" ? (
                      <>
                        <User className="h-3 w-3 mr-1" />
                        User
                      </>
                    ) : (
                      <>
                        <Bot className="h-3 w-3 mr-1" />
                        AI Assistant
                      </>
                    )}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(message.logCreatedAt)}
                  </p>
                  <button
                    onClick={() => copyMessage(message.message)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    data-testid={`button-copy-message-${idx}`}
                  >
                    <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
                <div
                  className={cn(
                    "rounded-md p-4 shadow-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 border"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {message.message}
                  </p>
                </div>
              </div>

              {message.role === "user" && (
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
