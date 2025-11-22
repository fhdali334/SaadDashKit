import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Loader2, RefreshCw, ExternalLink, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string;
  product_url: string;
  tags: string;
  created_at: string;
  similarity?: number;
}

interface SearchResult extends Product {
  similarity: number;
}

async function getProducts(): Promise<Product[]> {
  const res = await fetch('/api/products', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch products');
  const data = await res.json();
  return data.products || [];
}

async function searchProducts(query: string, count: number): Promise<SearchResult[]> {
  const res = await fetch('/api/products/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ query, count }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to search products');
  }
  const data = await res.json();
  return data.results || [];
}

async function deleteProduct(id: string) {
  const res = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete product');
  }
  return res.json();
}

export default function ManageProductsTab() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCount, setSearchCount] = useState(10);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const { toast } = useToast();

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
    enabled: !isSearchMode,
  });

  const searchMutation = useMutation({
    mutationFn: ({ query, count }: { query: string; count: number }) => searchProducts(query, count),
    onSuccess: (data) => {
      setIsSearchMode(true);
      if (data.length === 0) {
        toast({
          title: "No results",
          description: "No products found matching your query.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Search failed",
        description: error.message || "There was an error searching products.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      refetch();
      if (isSearchMode) {
        // Re-run search if in search mode
        if (searchQuery.trim()) {
          searchMutation.mutate({ query: searchQuery.trim(), count: searchCount });
        }
      }
      toast({
        title: "Product deleted",
        description: "The product has been removed.",
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "There was an error deleting the product.",
        variant: "destructive",
      });
    },
  });

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return '—';
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setIsSearchMode(false);
      return;
    }
    searchMutation.mutate({ query: searchQuery.trim(), count: searchCount });
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearchMode(false);
    searchMutation.reset();
  };

  const displayProducts = isSearchMode && searchMutation.data 
    ? searchMutation.data 
    : products || [];

  const isLoadingProducts = isSearchMode 
    ? searchMutation.isPending 
    : isLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-1">
            Manage Products
          </h2>
          <p className="text-sm text-muted-foreground">
            {isSearchMode 
              ? `Search results for "${searchQuery}"` 
              : "View, search, and manage all your products"}
          </p>
        </div>
        <div className="flex gap-2">
          {isSearchMode && (
            <Button variant="outline" size="sm" onClick={handleClearSearch}>
              Clear Search
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Products</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, description, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-32">
                <Select value={searchCount.toString()} onValueChange={(v) => setSearchCount(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 results</SelectItem>
                    <SelectItem value="10">10 results</SelectItem>
                    <SelectItem value="15">15 results</SelectItem>
                    <SelectItem value="20">20 results</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={searchMutation.isPending || !searchQuery.trim()}>
                {searchMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Products List */}
      {isLoadingProducts ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {isSearchMode ? "Searching products…" : "Loading products…"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : !displayProducts || displayProducts.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center">
              <p className="text-base font-semibold text-foreground mb-2">
                {isSearchMode ? "No products found" : "No products yet"}
              </p>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                {isSearchMode 
                  ? "Try a different search query."
                  : "Add your first product to get started."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayProducts.map((product) => (
            <Card key={product.id}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="aspect-video bg-muted rounded-md overflow-hidden">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23ddd" width="400" height="300"/><text fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em">No Image</text></svg>';
                      }}
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">{product.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {product.description}
                    </p>
                    {product.similarity !== undefined && (
                      <div className="text-xs text-muted-foreground mb-2">
                        {(product.similarity * 100).toFixed(1)}% match
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mb-2">
                      Created: {formatDate(product.created_at)}
                    </div>
                    {product.tags && (
                      <div className="mb-3 flex flex-wrap gap-1">
                        {product.tags.split(',').map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 bg-muted rounded"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(product.product_url, '_blank')}
                        className="flex-1"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteId(product.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The product will be permanently removed from your knowledge base.
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
