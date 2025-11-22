import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SearchResult {
  id: string;
  name: string;
  description: string;
  image_url: string;
  product_url: string;
  tags: string;
  similarity: number;
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

export default function SearchProductsTab() {
  const [query, setQuery] = useState("");
  const [count, setCount] = useState(1);
  const [results, setResults] = useState<SearchResult[]>([]);
  const { toast } = useToast();

  const searchMutation = useMutation({
    mutationFn: ({ query, count }: { query: string; count: number }) => searchProducts(query, count),
    onSuccess: (data) => {
      setResults(data);
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

  const quickQueries = [
    { label: "🎧 Wireless Headphones", query: "wireless headphones for music" },
    { label: "🪑 Office Furniture", query: "office desk ergonomic comfortable" },
    { label: "💪 Fitness Gear", query: "fitness exercise workout equipment" },
    { label: "🔊 Portable Speakers", query: "portable audio speaker bluetooth" },
    { label: "🎮 Gaming Gear", query: "gaming keyboard mouse electronics" },
    { label: "💧 Water Bottles", query: "water bottle hydration insulated" },
    { label: "📷 Cameras", query: "camera webcam 4k streaming" },
    { label: "🖥️ Standing Desks", query: "standing desk electric adjustable" },
  ];

  const handleQuickQuery = (quickQuery: string) => {
    setQuery(quickQuery);
    searchMutation.mutate({ query: quickQuery, count });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast({
        title: "Invalid input",
        description: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }
    searchMutation.mutate({ query: query.trim(), count });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">
          Search Products
        </h2>
        <p className="text-sm text-muted-foreground">
          Search products using natural language. Our AI will find the most relevant matches.
        </p>
      </div>

      {/* Quick Search Queries */}
      <Card>
        <CardContent className="pt-6">
          <Label className="mb-4 block">Quick Search Queries:</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {quickQueries.map((item, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => handleQuickQuery(item.query)}
                className="text-xs"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search-query">Search Query</Label>
              <Input
                id="search-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., affordable wireless headphones for gym"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="result-count">Number of Results</Label>
              <Select value={count.toString()} onValueChange={(v) => setCount(parseInt(v))}>
                <SelectTrigger id="result-count">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={searchMutation.isPending} className="w-full">
              {searchMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Search Results ({results.length})</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.map((product) => (
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
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {(product.similarity * 100).toFixed(1)}% match
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(product.product_url, '_blank')}
                        >
                          View
                        </Button>
                      </div>
                      {product.tags && (
                        <div className="mt-2 flex flex-wrap gap-1">
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

