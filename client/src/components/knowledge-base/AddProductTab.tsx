import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

async function getAccount() {
  const res = await fetch('/api/account', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch account');
  return res.json();
}

async function addProduct(product: {
  name: string;
  description: string;
  image_url: string;
  product_url: string;
  tags: string;
}) {
  const res = await fetch('/api/products/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(product),
  });
  if (!res.ok) {
    const error = await res.json();
    const errorObj = new Error(error.error || 'Failed to add product');
    (errorObj as any).code = error.code;
    (errorObj as any).details = error;
    throw errorObj;
  }
  return res.json();
}


export default function AddProductTab() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [tags, setTags] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch account balance
  const { data: account } = useQuery({
    queryKey: ["/api/account"],
  });

  const addMutation = useMutation({
    mutationFn: addProduct,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage-records"] });
      toast({
        title: "Product added",
        description: "Product has been added successfully.",
      });
      setName("");
      setDescription("");
      setImageUrl("");
      setProductUrl("");
      setTags("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add product",
        description: error.message || "There was an error adding the product.",
        variant: "destructive",
      });
    },
  });

  // Calculate remaining balance
  const creditLimit = account ? parseFloat(account.creditLimit || "0") : 0;
  const creditsUsed = account ? parseFloat(account.creditsUsed || "0") : 0;
  const remainingBalance = creditLimit - creditsUsed;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !imageUrl.trim() || !productUrl.trim()) {
      toast({
        title: "Invalid input",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    addMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      image_url: imageUrl.trim(),
      product_url: productUrl.trim(),
      tags: tags.trim(),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">
          Add Single Product
        </h2>
        <p className="text-sm text-muted-foreground">
          Add a product to your knowledge base.
        </p>
      </div>

      {/* Balance Warning */}
      {remainingBalance <= 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Insufficient Balance:</strong> You don't have enough balance to add products. 
            Adding a product requires generating an OpenAI embedding which costs a small amount.
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

      {addMutation.error && (addMutation.error as any).code === "INSUFFICIENT_BALANCE" && (
        <Alert variant="destructive">
          <AlertDescription>
            {(addMutation.error as any).message}
            {(addMutation.error as any).details && (
              <div className="mt-2 text-sm">
                <p>Estimated cost: ${(addMutation.error as any).details.estimatedCostUsd}</p>
                <p>Your balance: ${(addMutation.error as any).details.remainingBalance}</p>
                <p className="mt-2">
                  Please add credits in the <strong>Cost Management</strong> page.
                </p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description *
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter product description"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL *</Label>
              <Input
                id="image-url"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-url">Product URL *</Label>
              <Input
                id="product-url"
                type="url"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://example.com/product"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., electronics, premium, sale"
              />
            </div>

            <Button
              type="submit"
              disabled={addMutation.isPending || remainingBalance <= 0}
              className="w-full"
            >
              {addMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding Product...
                </>
              ) : (
                "Add Product"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

