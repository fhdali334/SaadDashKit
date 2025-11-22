import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Trash2, FileText, Loader2, Download } from "lucide-react";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Use the exact same API endpoints as the exporter
async function fetchDocs() {
  const res = await fetch('/api/docs', {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch documents');
  }
  const data = await res.json();
  return data.data || [];
}

async function uploadFile(file: File, customName: string) {
  const formData = new FormData();
  
  // Create a file with custom name (matching the exporter's behavior)
  const extension = file.name.split('.').pop();
  const fileName = customName.includes('.') ? customName : `${customName}.${extension}`;
  const renamedFile = new File([file], fileName, { type: file.type });
  
  formData.append('file', renamedFile);
  
  const res = await fetch('/api/upload', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(errorData.error || 'Upload failed');
  }
  
  return res.json();
}

async function deleteDocument(id: string) {
  const res = await fetch(`/api/docs/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Delete failed' }));
    throw new Error(errorData.error || 'Delete failed');
  }
  
  return res.json();
}

export default function QATab() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: docs, isLoading, refetch } = useQuery({
    queryKey: ['/api/docs'],
    queryFn: fetchDocs,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, name }: { file: File; name: string }) => uploadFile(file, name),
    onSuccess: () => {
      refetch();
      toast({
        title: "Upload complete",
        description: "File has been added to your knowledge base.",
      });
      setUploadModalOpen(false);
      setSelectedFile(null);
      setDocName("");
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading the file.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      refetch();
      toast({
        title: "File deleted",
        description: "The file has been removed from your knowledge base.",
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "There was an error deleting the file.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    // Pre-fill name without extension
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    setDocName(nameWithoutExt);
    setUploadModalOpen(true);
  };

  const handleUploadConfirm = () => {
    if (!selectedFile || !docName.trim()) {
      toast({
        title: "Invalid input",
        description: "Please enter a document name",
        variant: "destructive",
      });
      return;
    }
    
    uploadMutation.mutate({ file: selectedFile, name: docName.trim() });
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return '—';
    }
  };

  const getFileType = (doc: any) => {
    return (doc.data?.type || doc.type || 'document').toUpperCase();
  };

  const getStatusBadge = (status: any) => {
    const s = (status?.type || status || 'ready').toLowerCase();
    if (s === 'ready' || s === 'success' || s === 'pending') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">Success</span>;
    }
    if (s === 'processing') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">Processing</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">Success</span>;
  };

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-1">
            Q&A Documents
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage files and documents for your chatbot
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/knowledge-base/export")}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploadMutation.isPending}
          />
          <Button
            onClick={() => document.getElementById("file-upload")?.click()}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {uploadMutation.isPending ? "Uploading..." : "Upload File"}
          </Button>
        </div>
      </div>

      {/* Upload status */}
      {uploadMutation.isPending && (
        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-500 px-4 py-3 rounded-lg flex items-center gap-3">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Uploading {docName}...</span>
        </div>
      )}

      {/* Documents Table */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Documents</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Loading documents…</p>
            </div>
          ) : !docs || docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-base font-semibold text-foreground mb-2">
                No files yet
              </h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                Upload your first file to build your knowledge base.
              </p>
              <Button onClick={() => document.getElementById("file-upload")?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Name
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Type
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                      Created
                    </th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3" style={{ width: '160px' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc: any) => {
                    const displayName = doc.data?.name || doc.name || 'Unnamed';
                    const displayType = doc.data?.type || doc.type || 'document';
                    
                    return (
                      <tr key={doc.documentID} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium text-foreground max-w-xs truncate" title={displayName}>
                              {displayName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border">
                            {displayType.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(doc.status)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">
                            {formatDate(doc.updatedAt || doc.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteId(doc.documentID)}
                              disabled={deleteMutation.isPending}
                            >
                              {deleteMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Enter a name for your document
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="docName">Document Name</Label>
              <Input
                id="docName"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Enter document name..."
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Selected File</Label>
              <div className="text-sm text-muted-foreground">
                {selectedFile?.name || 'No file selected'}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadModalOpen(false);
                setSelectedFile(null);
                setDocName("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUploadConfirm} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The document will be permanently removed from your knowledge base.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

