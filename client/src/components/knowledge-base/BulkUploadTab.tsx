import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ADD_PRODUCT_COST_USD = 10.00;

async function getAccount() {
  const res = await fetch('/api/account', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch account');
  return res.json();
}

function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const products: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    if (values.length === headers.length && values.some(v => v)) {
      const product: any = {};
      headers.forEach((header, index) => {
        product[header] = values[index] || '';
      });
      products.push(product);
    }
  }

  return products;
}

async function bulkUpload(products: any[]) {
  const res = await fetch('/api/products/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ products }),
  });
  if (!res.ok) {
    const error = await res.json();
    const errorObj = new Error(error.error || 'Failed to upload products');
    (errorObj as any).code = error.code;
    (errorObj as any).details = error;
    throw errorObj;
  }
  return res.json();
}

async function aiConvertCsv(csvData: string) {
  const res = await fetch('/api/products/ai-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ csvData }),
  });
  if (!res.ok) {
    const error = await res.json();
    const errorObj = new Error(error.error || 'Failed to convert CSV with AI');
    (errorObj as any).code = error.code;
    (errorObj as any).details = error;
    throw errorObj;
  }
  return res.json();
}

export default function BulkUploadTab() {
  const [csvText, setCsvText] = useState("");
  const [aiCsvText, setAiCsvText] = useState("");
  const [uploadMode, setUploadMode] = useState<"manual" | "ai">("manual");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch account balance
  const { data: account, refetch: refetchBalance } = useQuery({
    queryKey: ["/api/account"],
    queryFn: getAccount,
  });

  // Calculate remaining balance
  const creditLimit = account ? parseFloat(account.creditLimit || "0") : 0;
  const creditsUsed = account ? parseFloat(account.creditsUsed || "0") : 0;
  const remainingBalance = creditLimit - creditsUsed;

  const uploadMutation = useMutation({
    mutationFn: bulkUpload,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage-records"] });
      toast({
        title: "Bulk upload complete",
        description: `Added ${data.added} products. ${data.errors?.length > 0 ? `${data.errors.length} errors.` : ''}`,
      });
      setCsvText("");
      setAiCsvText("");
      refetchBalance();
      if (data.errors && data.errors.length > 0) {
        console.error('Upload errors:', data.errors);
      }
    },
    onError: (error: any) => {
      // Show toast for non-balance errors
      if ((error as any).code !== "INSUFFICIENT_BALANCE") {
        toast({
          title: "Bulk upload failed",
          description: error.message || "There was an error uploading products.",
          variant: "destructive",
        });
      }
    },
  });

  const aiConvertMutation = useMutation({
    mutationFn: aiConvertCsv,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage-records"] });
      setCsvText(data.convertedCsv);
      setUploadMode("manual");
      refetchBalance();
      toast({
        title: "CSV converted successfully",
        description: "Your CSV has been converted to the required format. Review and upload.",
      });
    },
    onError: (error: any) => {
      // Show toast for non-balance errors
      if ((error as any).code !== "INSUFFICIENT_BALANCE") {
        toast({
          title: "AI conversion failed",
          description: error.message || "There was an error converting your CSV.",
          variant: "destructive",
        });
      }
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isAiMode: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (isAiMode) {
        setAiCsvText(text);
      } else {
        setCsvText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    if (!csvText.trim()) {
      toast({
        title: "Invalid input",
        description: "Please provide CSV data",
        variant: "destructive",
      });
      return;
    }

    const products = parseCSV(csvText);
    if (products.length === 0) {
      toast({
        title: "Invalid CSV",
        description: "Could not parse products from CSV",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(products);
  };

  const handleAiConvert = () => {
    if (!aiCsvText.trim()) {
      toast({
        title: "Invalid input",
        description: "Please provide CSV data to convert",
        variant: "destructive",
      });
      return;
    }
    aiConvertMutation.mutate(aiCsvText);
  };

  const products = csvText ? parseCSV(csvText) : [];
  // Note: Embedding costs are very small (~$0.0001 per product), so we just check if balance > 0
  const canAfford = remainingBalance > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">
          Bulk Upload Products
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload multiple products at once. Each product costs ${ADD_PRODUCT_COST_USD.toFixed(2)}.
        </p>
      </div>

      {/* Upload Mode Tabs */}
      <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as "manual" | "ai")}>
        <TabsList>
          <TabsTrigger value="manual">Manual Upload</TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-6">
      {/* Balance Warning */}
      {remainingBalance <= 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Insufficient Balance:</strong> You don't have enough balance to upload products. 
            Each product requires generating an OpenAI embedding which costs a small amount.
            <br />
            <span className="text-sm mt-1 block">
              Current balance: ${remainingBalance.toFixed(2)}
            </span>
            <span className="text-sm mt-1 block">
              Please add credits in the <strong>Cost Management</strong> page.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {uploadMutation.error && (uploadMutation.error as any).code === "INSUFFICIENT_BALANCE" && (
        <Alert variant="destructive">
          <AlertDescription>
            {(uploadMutation.error as any).message}
            {(uploadMutation.error as any).details && (
              <div className="mt-2 text-sm">
                <p>Estimated cost: ${(uploadMutation.error as any).details.estimatedCostUsd}</p>
                <p>Your balance: ${(uploadMutation.error as any).details.remainingBalance}</p>
                <p className="mt-2">
                  Please add credits in the <strong>Cost Management</strong> page.
                </p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Cost Display */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Products to Upload</div>
            <div className="text-2xl font-semibold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Remaining Balance</div>
            <div className={`text-2xl font-semibold ${remainingBalance <= 0 ? 'text-destructive' : ''}`}>
              ${remainingBalance.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Each product costs ~$0.0001 for embedding
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              type="file"
              id="csv-file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('csv-file')?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose CSV File
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">OR</div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Paste CSV Data:</label>
            <Textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Paste CSV data here..."
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={uploadMutation.isPending || !canAfford || products.length === 0}
            className="w-full"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${products.length} Products`
            )}
          </Button>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          {/* Balance Warning */}
          {remainingBalance <= 0 && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                <strong>Insufficient Balance:</strong> You don't have enough balance to use AI CSV conversion. 
                This feature uses OpenAI to analyze and convert your CSV.
                <br />
                <span className="text-sm mt-1 block">
                  Current balance: ${remainingBalance.toFixed(2)}
                </span>
                <span className="text-sm mt-1 block">
                  Please add credits in the <strong>Cost Management</strong> page.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {aiConvertMutation.error && (aiConvertMutation.error as any).code === "INSUFFICIENT_BALANCE" && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                {(aiConvertMutation.error as any).message}
                {(aiConvertMutation.error as any).details && (
                  <div className="mt-2 text-sm">
                    <p>Estimated cost: ${(aiConvertMutation.error as any).details.estimatedCostUsd}</p>
                    <p>Your balance: ${(aiConvertMutation.error as any).details.remainingBalance}</p>
                    <p className="mt-2">
                      Please add credits in the <strong>Cost Management</strong> page.
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI Upload - Automatic CSV Conversion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-blue-500">
                  <strong>How it works:</strong> Upload your CSV file with any column names. Our AI will automatically analyze your spreadsheet and convert it to the required format. No need to rename columns!
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Upload Your CSV File:</label>
                <input
                  type="file"
                  id="ai-csv-file"
                  accept=".csv"
                  onChange={(e) => handleFileUpload(e, true)}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('ai-csv-file')?.click()}
                  disabled={aiConvertMutation.isPending}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose CSV File
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">OR</div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Paste Your CSV Data:</label>
                <Textarea
                  value={aiCsvText}
                  onChange={(e) => setAiCsvText(e.target.value)}
                  placeholder="Paste your CSV data here with any column names..."
                  rows={10}
                  className="font-mono text-sm"
                  disabled={aiConvertMutation.isPending}
                />
              </div>

              <Button
                onClick={handleAiConvert}
                disabled={aiConvertMutation.isPending || !aiCsvText.trim() || remainingBalance <= 0}
                className="w-full"
              >
                {aiConvertMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Convert CSV with AI
                  </>
                )}
              </Button>

              {aiConvertMutation.isSuccess && csvText && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <p className="text-sm text-green-500 mb-2">
                    ✓ CSV converted successfully! Switch to Manual Upload tab to review and upload.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

