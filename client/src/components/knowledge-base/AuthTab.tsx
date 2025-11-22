import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as React from "react";

async function getShopifyCredentials() {
  try {
    const res = await fetch('/api/shopify/credentials', {
      credentials: 'include',
    });
    
    console.log('[Shopify Credentials] Response status:', res.status, res.statusText);
    
    if (!res.ok) {
      // Handle 401 (unauthorized) separately
      if (res.status === 401) {
        throw new Error('Authentication required. Please log in.');
      }
      // Handle 404 (shouldn't happen anymore, but keep for compatibility)
      if (res.status === 404) {
        console.log('[Shopify Credentials] 404 received, returning null');
        return null;
      }
      const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
      throw new Error(errorData.error || 'Failed to fetch Shopify credentials');
    }
    
    const data = await res.json();
    console.log('[Shopify Credentials] Received data:', data);
    return data;
  } catch (error) {
    console.error('[Shopify Credentials] Fetch error:', error);
    throw error;
  }
}

async function connectShopify({ shopDomain, storefrontAccessToken }: { shopDomain: string; storefrontAccessToken: string }) {
  const res = await fetch('/api/shopify/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ shopDomain, storefrontAccessToken }),
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
    throw new Error(error.error || 'Failed to connect Shopify store');
  }
  
  return res.json();
}

export default function AuthTab() {
  const [shopDomain, setShopDomain] = useState("");
  const [storefrontAccessToken, setStorefrontAccessToken] = useState("");
  const [isShopifyDialogOpen, setIsShopifyDialogOpen] = useState(false);
  const [wordpressSiteUrl, setWordpressSiteUrl] = useState("");
  const [consumerKey, setConsumerKey] = useState("");
  const [consumerSecret, setConsumerSecret] = useState("");
  const [isWordPressDialogOpen, setIsWordPressDialogOpen] = useState(false);
  const [bigcommerceStoreHash, setBigcommerceStoreHash] = useState("");
  const [bigcommerceAccessToken, setBigcommerceAccessToken] = useState("");
  const [isBigCommerceDialogOpen, setIsBigCommerceDialogOpen] = useState(false);
  const [squarespaceSiteUrl, setSquarespaceSiteUrl] = useState("");
  const [squarespaceApiKey, setSquarespaceApiKey] = useState("");
  const [isSquarespaceDialogOpen, setIsSquarespaceDialogOpen] = useState(false);
  const [wixSiteId, setWixSiteId] = useState("");
  const [wixAccessToken, setWixAccessToken] = useState("");
  const [isWixDialogOpen, setIsWixDialogOpen] = useState(false);
  const [webflowSiteId, setWebflowSiteId] = useState("");
  const [webflowAccessToken, setWebflowAccessToken] = useState("");
  const [isWebflowDialogOpen, setIsWebflowDialogOpen] = useState(false);
  const [isInputReady, setIsInputReady] = useState(false);
  const { toast } = useToast();

  // Remove readonly after dialog opens to prevent autofill but allow typing
  React.useEffect(() => {
    if (isShopifyDialogOpen || isWordPressDialogOpen || isBigCommerceDialogOpen || isSquarespaceDialogOpen || isWixDialogOpen || isWebflowDialogOpen) {
      // Small delay to prevent autofill
      const timer = setTimeout(() => {
        setIsInputReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsInputReady(false);
    }
  }, [isShopifyDialogOpen, isWordPressDialogOpen, isBigCommerceDialogOpen, isSquarespaceDialogOpen, isWixDialogOpen, isWebflowDialogOpen]);

  const { data: shopifyCredentials, refetch: refetchCredentials } = useQuery({
    queryKey: ['shopify/credentials'],
    queryFn: getShopifyCredentials,
  });

  async function getWordPressCredentials() {
    try {
      const res = await fetch('/api/wordpress/credentials', {
        credentials: 'include',
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        if (res.status === 404) {
          return null;
        }
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(errorData.error || 'Failed to fetch WordPress credentials');
      }
      
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('[WordPress Credentials] Fetch error:', error);
      throw error;
    }
  }

  const { data: wordpressCredentials, refetch: refetchWordPressCredentials } = useQuery({
    queryKey: ['wordpress/credentials'],
    queryFn: getWordPressCredentials,
  });

  async function getBigCommerceCredentials() {
    try {
      const res = await fetch('/api/bigcommerce/credentials', {
        credentials: 'include',
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        if (res.status === 404) {
          return null;
        }
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(errorData.error || 'Failed to fetch BigCommerce credentials');
      }
      
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('[BigCommerce Credentials] Fetch error:', error);
      throw error;
    }
  }

  const { data: bigcommerceCredentials, refetch: refetchBigCommerceCredentials } = useQuery({
    queryKey: ['bigcommerce/credentials'],
    queryFn: getBigCommerceCredentials,
  });

  async function getSquarespaceCredentials() {
    try {
      const res = await fetch('/api/squarespace/credentials', {
        credentials: 'include',
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        if (res.status === 404) {
          return null;
        }
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(errorData.error || 'Failed to fetch Squarespace credentials');
      }
      
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('[Squarespace Credentials] Fetch error:', error);
      throw error;
    }
  }

  const { data: squarespaceCredentials, refetch: refetchSquarespaceCredentials } = useQuery({
    queryKey: ['squarespace/credentials'],
    queryFn: getSquarespaceCredentials,
  });

  const connectShopifyMutation = useMutation({
    mutationFn: connectShopify,
    onSuccess: () => {
      refetchCredentials();
      setIsShopifyDialogOpen(false);
      setShopDomain("");
      setStorefrontAccessToken("");
      toast({
        title: "Shopify connected",
        description: "Your Shopify store has been connected successfully.",
      });
    },
    onError: (error: any) => {
      console.error('[Shopify Connect] Error details:', error);
      toast({
        title: "Failed to connect Shopify",
        description: error.message || "There was an error connecting to Shopify.",
        variant: "destructive",
      });
    },
  });

  const handleConnectShopify = () => {
    const trimmedDomain = shopDomain.trim();
    const trimmedToken = storefrontAccessToken.trim();
    
    if (!trimmedDomain) {
      toast({
        title: "Shop domain required",
        description: "Please enter your Shopify shop domain (e.g., mystore.myshopify.com)",
        variant: "destructive",
      });
      return;
    }

    if (!trimmedToken) {
      toast({
        title: "Storefront access token required",
        description: "Please enter your Shopify Storefront API access token",
        variant: "destructive",
      });
      return;
    }
    
    // Normalize the shop domain (remove https:// if present, ensure .myshopify.com)
    let normalizedDomain = trimmedDomain.toLowerCase();
    normalizedDomain = normalizedDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    if (!normalizedDomain.includes('.myshopify.com')) {
      normalizedDomain = `${normalizedDomain}.myshopify.com`;
    }
    
    console.log('[Shopify] Connecting store:', normalizedDomain);
    connectShopifyMutation.mutate({
      shopDomain: normalizedDomain,
      storefrontAccessToken: trimmedToken,
    });
  };

  const isShopifyConnected = !!shopifyCredentials && shopifyCredentials.hasAccessToken;
  const isWordPressConnected = !!wordpressCredentials && wordpressCredentials.hasCredentials;
  const isBigCommerceConnected = !!bigcommerceCredentials && bigcommerceCredentials.hasAccessToken;
  const isSquarespaceConnected = !!squarespaceCredentials && squarespaceCredentials.hasApiKey;

  async function getWixCredentials() {
    try {
      const res = await fetch('/api/wix/credentials', {
        credentials: 'include',
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        if (res.status === 404) {
          return null;
        }
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(errorData.error || 'Failed to fetch Wix credentials');
      }
      
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('[Wix Credentials] Fetch error:', error);
      throw error;
    }
  }

  const { data: wixCredentials, refetch: refetchWixCredentials } = useQuery({
    queryKey: ['wix/credentials'],
    queryFn: getWixCredentials,
  });

  async function connectWix({ siteId, accessToken }: { siteId: string; accessToken: string }) {
    const res = await fetch('/api/wix/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ siteId, accessToken }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
      throw new Error(error.error || 'Failed to connect Wix site');
    }

    return res.json();
  }

  const connectWixMutation = useMutation({
    mutationFn: connectWix,
    onSuccess: () => {
      refetchWixCredentials();
      setIsWixDialogOpen(false);
      setWixSiteId("");
      setWixAccessToken("");
      toast({
        title: "Wix connected",
        description: "Your Wix site has been connected successfully.",
      });
    },
    onError: (error: any) => {
      console.error('[Wix Connect] Error details:', error);
      toast({
        title: "Failed to connect Wix",
        description: error.message || "There was an error connecting to Wix.",
        variant: "destructive",
      });
    },
  });

  async function importWixProducts() {
    const res = await fetch('/api/wix/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
      throw new Error(error.error || 'Failed to import products from Wix');
    }

    return res.json();
  }

  const importWixMutation = useMutation({
    mutationFn: importWixProducts,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Products imported",
        description: `Successfully imported ${data.imported} products from Wix. ${data.skipped > 0 ? `${data.skipped} products were skipped (already exist).` : ''}`,
      });
    },
    onError: (error: any) => {
      console.error('[Wix Import] Error details:', error);
      toast({
        title: "Failed to import products",
        description: error.message || "There was an error importing products from Wix.",
        variant: "destructive",
      });
    },
  });

  async function deleteWixCredentials() {
    const res = await fetch('/api/wix/credentials', {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
      throw new Error(error.error || 'Failed to delete Wix credentials');
    }

    return res.json();
  }

  const deleteWixMutation = useMutation({
    mutationFn: deleteWixCredentials,
    onSuccess: () => {
      refetchWixCredentials();
      toast({
        title: "Wix disconnected",
        description: "Your Wix site has been disconnected successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to disconnect Wix",
        description: error.message || "There was an error disconnecting Wix.",
        variant: "destructive",
      });
    },
  });

  const isWixConnected = !!wixCredentials && wixCredentials.connected;

  async function getWebflowCredentials() {
    try {
      const res = await fetch('/api/webflow/credentials', {
        credentials: 'include',
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        if (res.status === 404) {
          return null;
        }
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        throw new Error(errorData.error || 'Failed to fetch Webflow credentials');
      }
      
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('[Webflow Credentials] Fetch error:', error);
      throw error;
    }
  }

  const { data: webflowCredentials, refetch: refetchWebflowCredentials } = useQuery({
    queryKey: ['webflow/credentials'],
    queryFn: getWebflowCredentials,
  });

  async function connectWebflow({ siteId, accessToken }: { siteId: string; accessToken: string }) {
    const res = await fetch('/api/webflow/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ siteId, accessToken }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
      throw new Error(error.error || 'Failed to connect Webflow site');
    }

    return res.json();
  }

  const connectWebflowMutation = useMutation({
    mutationFn: connectWebflow,
    onSuccess: () => {
      refetchWebflowCredentials();
      setIsWebflowDialogOpen(false);
      setWebflowSiteId("");
      setWebflowAccessToken("");
      toast({
        title: "Webflow connected",
        description: "Your Webflow site has been connected successfully.",
      });
    },
    onError: (error: any) => {
      console.error('[Webflow Connect] Error details:', error);
      toast({
        title: "Failed to connect Webflow",
        description: error.message || "There was an error connecting to Webflow.",
        variant: "destructive",
      });
    },
  });

  async function importWebflowProducts() {
    const res = await fetch('/api/webflow/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
      throw new Error(error.error || 'Failed to import products from Webflow');
    }

    return res.json();
  }

  const importWebflowMutation = useMutation({
    mutationFn: importWebflowProducts,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Products imported",
        description: `Successfully imported ${data.imported} products from Webflow. ${data.skipped > 0 ? `${data.skipped} products were skipped (already exist).` : ''}`,
      });
    },
    onError: (error: any) => {
      console.error('[Webflow Import] Error details:', error);
      toast({
        title: "Failed to import products",
        description: error.message || "There was an error importing products from Webflow.",
        variant: "destructive",
      });
    },
  });

  async function deleteWebflowCredentials() {
    const res = await fetch('/api/webflow/credentials', {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
      throw new Error(error.error || 'Failed to delete Webflow credentials');
    }

    return res.json();
  }

  const deleteWebflowMutation = useMutation({
    mutationFn: deleteWebflowCredentials,
    onSuccess: () => {
      refetchWebflowCredentials();
      toast({
        title: "Webflow disconnected",
        description: "Your Webflow site has been disconnected successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to disconnect Webflow",
        description: error.message || "There was an error disconnecting Webflow.",
        variant: "destructive",
      });
    },
  });

  const isWebflowConnected = !!webflowCredentials && webflowCredentials.connected;

  async function connectBigCommerce({ storeHash, accessToken }: { storeHash: string; accessToken: string }) {
    const res = await fetch('/api/bigcommerce/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ storeHash, accessToken }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
      throw new Error(error.error || 'Failed to connect BigCommerce store');
    }

    return res.json();
  }

  const connectBigCommerceMutation = useMutation({
    mutationFn: connectBigCommerce,
    onSuccess: () => {
      refetchBigCommerceCredentials();
      setIsBigCommerceDialogOpen(false);
      setBigcommerceStoreHash("");
      setBigcommerceAccessToken("");
      toast({
        title: "BigCommerce connected",
        description: "Your BigCommerce store has been connected successfully.",
      });
    },
    onError: (error: any) => {
      console.error('[BigCommerce Connect] Error details:', error);
      toast({
        title: "Failed to connect BigCommerce",
        description: error.message || "There was an error connecting to BigCommerce.",
        variant: "destructive",
      });
    },
  });

  async function importBigCommerceProducts() {
    const res = await fetch('/api/bigcommerce/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
      throw new Error(error.error || 'Failed to import products from BigCommerce');
    }

    return res.json();
  }

  const importBigCommerceMutation = useMutation({
    mutationFn: importBigCommerceProducts,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Products imported",
        description: `Successfully imported ${data.imported} products from BigCommerce. ${data.skipped > 0 ? `${data.skipped} products were skipped (already exist).` : ''}`,
      });
    },
    onError: (error: any) => {
      console.error('[BigCommerce Import] Error details:', error);
      toast({
        title: "Failed to import products",
        description: error.message || "There was an error importing products from BigCommerce.",
        variant: "destructive",
      });
    },
  });

  // Delete/Revoke functions
  async function deleteShopifyCredentials() {
    const res = await fetch('/api/shopify/credentials', {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
      throw new Error(error.error || 'Failed to delete Shopify credentials');
    }

    return res.json();
  }

  const deleteShopifyMutation = useMutation({
    mutationFn: deleteShopifyCredentials,
    onSuccess: () => {
      refetchCredentials();
      toast({
        title: "Shopify disconnected",
        description: "Your Shopify store has been disconnected successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to disconnect Shopify",
        description: error.message || "There was an error disconnecting Shopify.",
        variant: "destructive",
      });
    },
  });

  async function deleteWordPressCredentials() {
    const res = await fetch('/api/wordpress/credentials', {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
      throw new Error(error.error || 'Failed to delete WordPress credentials');
    }

    return res.json();
  }

  const deleteWordPressMutation = useMutation({
    mutationFn: deleteWordPressCredentials,
    onSuccess: () => {
      refetchWordPressCredentials();
      toast({
        title: "WordPress disconnected",
        description: "Your WordPress site has been disconnected successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to disconnect WordPress",
        description: error.message || "There was an error disconnecting WordPress.",
        variant: "destructive",
      });
    },
  });

  async function deleteBigCommerceCredentials() {
    const res = await fetch('/api/bigcommerce/credentials', {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
      throw new Error(error.error || 'Failed to delete BigCommerce credentials');
    }

    return res.json();
  }

  const deleteBigCommerceMutation = useMutation({
    mutationFn: deleteBigCommerceCredentials,
    onSuccess: () => {
      refetchBigCommerceCredentials();
      toast({
        title: "BigCommerce disconnected",
        description: "Your BigCommerce store has been disconnected successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to disconnect BigCommerce",
        description: error.message || "There was an error disconnecting BigCommerce.",
        variant: "destructive",
      });
    },
  });

  async function connectSquarespace({ siteUrl, apiKey }: { siteUrl: string; apiKey: string }) {
    const res = await fetch('/api/squarespace/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ siteUrl, apiKey }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
      throw new Error(error.error || 'Failed to connect Squarespace site');
    }

    return res.json();
  }

  const connectSquarespaceMutation = useMutation({
    mutationFn: connectSquarespace,
    onSuccess: () => {
      refetchSquarespaceCredentials();
      setIsSquarespaceDialogOpen(false);
      setSquarespaceSiteUrl("");
      setSquarespaceApiKey("");
      toast({
        title: "Squarespace connected",
        description: "Your Squarespace site has been connected successfully.",
      });
    },
    onError: (error: any) => {
      console.error('[Squarespace Connect] Error details:', error);
      toast({
        title: "Failed to connect Squarespace",
        description: error.message || "There was an error connecting to Squarespace.",
        variant: "destructive",
      });
    },
  });

  async function importSquarespaceProducts() {
    const res = await fetch('/api/squarespace/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
      throw new Error(error.error || 'Failed to import products from Squarespace');
    }

    return res.json();
  }

  const importSquarespaceMutation = useMutation({
    mutationFn: importSquarespaceProducts,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Products imported",
        description: `Successfully imported ${data.imported} products from Squarespace. ${data.skipped > 0 ? `${data.skipped} products were skipped (already exist).` : ''}`,
      });
    },
    onError: (error: any) => {
      console.error('[Squarespace Import] Error details:', error);
      toast({
        title: "Failed to import products",
        description: error.message || "There was an error importing products from Squarespace.",
        variant: "destructive",
      });
    },
  });

  async function deleteSquarespaceCredentials() {
    const res = await fetch('/api/squarespace/credentials', {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
      throw new Error(error.error || 'Failed to delete Squarespace credentials');
    }

    return res.json();
  }

  const deleteSquarespaceMutation = useMutation({
    mutationFn: deleteSquarespaceCredentials,
    onSuccess: () => {
      refetchSquarespaceCredentials();
      toast({
        title: "Squarespace disconnected",
        description: "Your Squarespace site has been disconnected successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to disconnect Squarespace",
        description: error.message || "There was an error disconnecting Squarespace.",
        variant: "destructive",
      });
    },
  });

  async function connectWordPress({ siteUrl, consumerKey, consumerSecret }: { siteUrl: string; consumerKey: string; consumerSecret: string }) {
    const res = await fetch('/api/wordpress/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ siteUrl, consumerKey, consumerSecret }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
      throw new Error(error.error || 'Failed to connect WordPress site');
    }

    return res.json();
  }

  const connectWordPressMutation = useMutation({
    mutationFn: connectWordPress,
    onSuccess: () => {
      refetchWordPressCredentials();
      setIsWordPressDialogOpen(false);
      setWordpressSiteUrl("");
      setConsumerKey("");
      setConsumerSecret("");
      toast({
        title: "WordPress connected",
        description: "Your WordPress site has been connected successfully.",
      });
    },
    onError: (error: any) => {
      console.error('[WordPress Connect] Error details:', error);
      toast({
        title: "Failed to connect WordPress",
        description: error.message || "There was an error connecting to WordPress.",
        variant: "destructive",
      });
    },
  });

  async function importWordPressProducts() {
    const res = await fetch('/api/wordpress/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
      throw new Error(error.error || 'Failed to import products from WordPress');
    }

    return res.json();
  }

  const importWordPressMutation = useMutation({
    mutationFn: importWordPressProducts,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Products imported",
        description: `Successfully imported ${data.imported} products from WordPress. ${data.skipped > 0 ? `${data.skipped} products were skipped (already exist).` : ''}`,
      });
    },
    onError: (error: any) => {
      console.error('[WordPress Import] Error details:', error);
      toast({
        title: "Failed to import products",
        description: error.message || "There was an error importing products from WordPress.",
        variant: "destructive",
      });
    },
  });

  async function importShopifyProducts() {
    const res = await fetch('/api/shopify/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
      throw new Error(error.error || 'Failed to import products from Shopify');
    }

    return res.json();
  }

  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: importShopifyProducts,
    onSuccess: (data) => {
      // Invalidate products query to refresh the Manage Products tab
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Products imported",
        description: `Successfully imported ${data.imported} products from Shopify. ${data.skipped > 0 ? `${data.skipped} products were skipped (already exist).` : ''}`,
      });
    },
    onError: (error: any) => {
      console.error('[Shopify Import] Error details:', error);
      toast({
        title: "Failed to import products",
        description: error.message || "There was an error importing products from Shopify.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">
          Integrations
        </h2>
        <p className="text-sm text-muted-foreground">
          Connect external services to import products and data automatically.
        </p>
      </div>

          {/* Connected Services */}
          <div className="space-y-4">
            {isShopifyConnected && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium">Connected to Shopify</p>
                          <p className="text-sm text-muted-foreground">
                            Shop: {shopifyCredentials.shopDomain}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => deleteShopifyMutation.mutate()}
                        disabled={deleteShopifyMutation.isPending}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {deleteShopifyMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      onClick={() => importMutation.mutate()}
                      disabled={importMutation.isPending}
                      className="w-full"
                      variant="outline"
                    >
                      {importMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing products...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Import Products from Shopify
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isWordPressConnected && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium">Connected to WordPress</p>
                          <p className="text-sm text-muted-foreground">
                            Site: {wordpressCredentials.siteUrl}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => deleteWordPressMutation.mutate()}
                        disabled={deleteWordPressMutation.isPending}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {deleteWordPressMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      onClick={() => importWordPressMutation.mutate()}
                      disabled={importWordPressMutation.isPending}
                      className="w-full"
                      variant="outline"
                    >
                      {importWordPressMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing products...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Import Products from WordPress
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isBigCommerceConnected && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium">Connected to BigCommerce</p>
                          <p className="text-sm text-muted-foreground">
                            Store: {bigcommerceCredentials.storeHash}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => deleteBigCommerceMutation.mutate()}
                        disabled={deleteBigCommerceMutation.isPending}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {deleteBigCommerceMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      onClick={() => importBigCommerceMutation.mutate()}
                      disabled={importBigCommerceMutation.isPending}
                      className="w-full"
                      variant="outline"
                    >
                      {importBigCommerceMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing products...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Import Products from BigCommerce
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isSquarespaceConnected && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium">Connected to Squarespace</p>
                          <p className="text-sm text-muted-foreground">
                            Site: {squarespaceCredentials.siteUrl}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => deleteSquarespaceMutation.mutate()}
                        disabled={deleteSquarespaceMutation.isPending}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {deleteSquarespaceMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      onClick={() => importSquarespaceMutation.mutate()}
                      disabled={importSquarespaceMutation.isPending}
                      className="w-full"
                      variant="outline"
                    >
                      {importSquarespaceMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing products...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Import Products from Squarespace
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

      {/* Integration Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Shopify Integration Card */}
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors ring-2 ring-blue-500/30 shadow-blue-500/10" onClick={() => setIsShopifyDialogOpen(true)}>
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex justify-center">
                <img 
                  src="/shopifylogo.png" 
                  alt="Shopify" 
                  className="h-12 w-auto object-contain"
                  onError={(e) => {
                    // Fallback if image doesn't load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="text-center">
                <h3 className="font-semibold mb-1">Shopify</h3>
                <p className="text-xs text-muted-foreground">
                  {isShopifyConnected ? "Connected" : "Connect your store"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WordPress Integration Card */}
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors ring-2 ring-blue-500/30 shadow-blue-500/10" onClick={() => setIsWordPressDialogOpen(true)}>
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex justify-center">
                <img 
                  src="/wordpresslogo.png" 
                  alt="WordPress" 
                  className="h-12 w-auto object-contain"
                  onError={(e) => {
                    // Fallback if image doesn't load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="text-center">
                <h3 className="font-semibold mb-1">WordPress</h3>
                <p className="text-xs text-muted-foreground">
                  {isWordPressConnected ? "Connected" : "Connect your site"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BigCommerce Integration Card */}
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors ring-2 ring-blue-500/30 shadow-blue-500/10" onClick={() => setIsBigCommerceDialogOpen(true)}>
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex justify-center">
                <img 
                  src="/bigcommerce-logo.png" 
                  alt="BigCommerce" 
                  className="h-12 w-auto object-contain"
                  onError={(e) => {
                    // Fallback if image doesn't load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="text-center">
                <h3 className="font-semibold mb-1">BigCommerce</h3>
                <p className="text-xs text-muted-foreground">
                  {isBigCommerceConnected ? "Connected" : "Connect your store"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Squarespace Integration Card */}
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors ring-2 ring-blue-500/30 shadow-blue-500/10" onClick={() => setIsSquarespaceDialogOpen(true)}>
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex justify-center">
                <img 
                  src="/squarespace-logo.png" 
                  alt="Squarespace" 
                  className="h-12 w-auto object-contain"
                  onError={(e) => {
                    // Fallback if image doesn't load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="text-center">
                <h3 className="font-semibold mb-1">Squarespace</h3>
                <p className="text-xs text-muted-foreground">
                  {isSquarespaceConnected ? "Connected" : "Connect your site"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wix Integration Card */}
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors ring-2 ring-blue-500/30 shadow-blue-500/10" onClick={() => setIsWixDialogOpen(true)}>
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex justify-center">
                <img 
                  src="/wix-logo.png" 
                  alt="Wix" 
                  className="h-12 w-auto object-contain"
                  onError={(e) => {
                    // Fallback if image doesn't load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="text-center">
                <h3 className="font-semibold mb-1">Wix</h3>
                <p className="text-xs text-muted-foreground">
                  {isWixConnected ? "Connected" : "Connect your site"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webflow Integration Card */}
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors ring-2 ring-blue-500/30 shadow-blue-500/10" onClick={() => setIsWebflowDialogOpen(true)}>
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex justify-center">
                <img 
                  src="/webflow-logo.png" 
                  alt="Webflow" 
                  className="h-12 w-auto object-contain"
                  onError={(e) => {
                    // Fallback if image doesn't load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="text-center">
                <h3 className="font-semibold mb-1">Webflow</h3>
                <p className="text-xs text-muted-foreground">
                  {isWebflowConnected ? "Connected" : "Connect your site"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shopify Connection Dialog */}
      <Dialog open={isShopifyDialogOpen} onOpenChange={setIsShopifyDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <img 
                src="/shopifylogo.png" 
                alt="Shopify" 
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <DialogTitle>Connect Shopify</DialogTitle>
            </div>
            <DialogDescription>
              Enter your Shopify shop domain and Storefront API access token. No OAuth required!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="shop-domain-input">Shop Domain</Label>
              <Input
                id="shop-domain-input"
                name="shop-domain-input"
                type="text"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                placeholder="mystore.myshopify.com"
                disabled={connectShopifyMutation.isPending}
                autoComplete="off"
                data-form-type="other"
                data-lpignore="true"
              />
              <p className="text-xs text-muted-foreground">
                Enter your Shopify shop domain (e.g., mystore.myshopify.com)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="storefront-token">Storefront API Access Token</Label>
              <Input
                id="storefront-token"
                name="storefront-token"
                type="password"
                value={storefrontAccessToken}
                onChange={(e) => setStorefrontAccessToken(e.target.value)}
                placeholder="Your Storefront API access token"
                disabled={connectShopifyMutation.isPending}
                autoComplete="new-password"
                data-form-type="other"
                data-lpignore="true"
                readOnly={!isInputReady}
                onFocus={(e) => {
                  if (!isInputReady) {
                    setIsInputReady(true);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Get this from Shopify Admin → Settings → Apps and sales channels → Develop apps → Your app → API credentials → Storefront API access token
              </p>
            </div>

            <Button
              onClick={handleConnectShopify}
              disabled={connectShopifyMutation.isPending || !shopDomain.trim() || !storefrontAccessToken.trim()}
              className="w-full"
              size="lg"
            >
              {connectShopifyMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* WordPress Connection Dialog */}
      <Dialog open={isWordPressDialogOpen} onOpenChange={setIsWordPressDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <img 
                src="/wordpresslogo.png" 
                alt="WordPress" 
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <DialogTitle>Connect WordPress/WooCommerce</DialogTitle>
            </div>
            <DialogDescription>
              Enter your WordPress site URL and WooCommerce API credentials (Consumer Key and Secret).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="wordpress-site-url">Site URL</Label>
              <Input
                id="wordpress-site-url"
                name="wordpress-site-url"
                type="text"
                value={wordpressSiteUrl}
                onChange={(e) => setWordpressSiteUrl(e.target.value)}
                placeholder="https://example.com"
                disabled={connectWordPressMutation.isPending}
                autoComplete="off"
                data-form-type="other"
                data-lpignore="true"
              />
              <p className="text-xs text-muted-foreground">
                Enter your WordPress site URL (e.g., https://example.com)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consumer-key">Consumer Key</Label>
              <Input
                id="consumer-key"
                name="consumer-key"
                type="text"
                value={consumerKey}
                onChange={(e) => setConsumerKey(e.target.value)}
                placeholder="ck_..."
                disabled={connectWordPressMutation.isPending}
                autoComplete="off"
                data-form-type="other"
                data-lpignore="true"
              />
              <p className="text-xs text-muted-foreground">
                Get this from WooCommerce → Settings → Advanced → REST API → Create key
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consumer-secret">Consumer Secret</Label>
              <Input
                id="consumer-secret"
                name="consumer-secret"
                type="password"
                value={consumerSecret}
                onChange={(e) => setConsumerSecret(e.target.value)}
                placeholder="cs_..."
                disabled={connectWordPressMutation.isPending}
                autoComplete="new-password"
                data-form-type="other"
                data-lpignore="true"
                readOnly={!isInputReady}
                onFocus={(e) => {
                  if (!isInputReady) {
                    setIsInputReady(true);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Get this from WooCommerce → Settings → Advanced → REST API → Create key
              </p>
            </div>

            <Button
              onClick={() => {
                const trimmedUrl = wordpressSiteUrl.trim();
                const trimmedKey = consumerKey.trim();
                const trimmedSecret = consumerSecret.trim();

                if (!trimmedUrl) {
                  toast({
                    title: "Site URL required",
                    description: "Please enter your WordPress site URL",
                    variant: "destructive",
                  });
                  return;
                }

                if (!trimmedKey) {
                  toast({
                    title: "Consumer Key required",
                    description: "Please enter your WooCommerce Consumer Key",
                    variant: "destructive",
                  });
                  return;
                }

                if (!trimmedSecret) {
                  toast({
                    title: "Consumer Secret required",
                    description: "Please enter your WooCommerce Consumer Secret",
                    variant: "destructive",
                  });
                  return;
                }

                connectWordPressMutation.mutate({
                  siteUrl: trimmedUrl,
                  consumerKey: trimmedKey,
                  consumerSecret: trimmedSecret,
                });
              }}
              disabled={connectWordPressMutation.isPending || !wordpressSiteUrl.trim() || !consumerKey.trim() || !consumerSecret.trim()}
              className="w-full"
              size="lg"
            >
              {connectWordPressMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* BigCommerce Connection Dialog */}
      <Dialog open={isBigCommerceDialogOpen} onOpenChange={setIsBigCommerceDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <img 
                src="/bigcommerce-logo.png" 
                alt="BigCommerce" 
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <DialogTitle>Connect BigCommerce</DialogTitle>
            </div>
            <DialogDescription>
              Enter your BigCommerce store hash and API access token.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="bigcommerce-store-hash">Store Hash</Label>
              <Input
                id="bigcommerce-store-hash"
                name="bigcommerce-store-hash"
                type="text"
                value={bigcommerceStoreHash}
                onChange={(e) => setBigcommerceStoreHash(e.target.value)}
                placeholder="abc123"
                disabled={connectBigCommerceMutation.isPending}
                autoComplete="off"
                data-form-type="other"
                data-lpignore="true"
              />
              <p className="text-xs text-muted-foreground">
                Your store hash (e.g., "abc123" from abc123.mybigcommerce.com)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bigcommerce-access-token">Access Token</Label>
              <Input
                id="bigcommerce-access-token"
                name="bigcommerce-access-token"
                type="password"
                value={bigcommerceAccessToken}
                onChange={(e) => setBigcommerceAccessToken(e.target.value)}
                placeholder="Your API access token"
                disabled={connectBigCommerceMutation.isPending}
                autoComplete="new-password"
                data-form-type="other"
                data-lpignore="true"
                readOnly={!isInputReady}
                onFocus={(e) => {
                  if (!isInputReady) {
                    setIsInputReady(true);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Get this from BigCommerce Admin → Settings → API Accounts → Create V2/V3 API Token
              </p>
            </div>

            <Button
              onClick={() => {
                const trimmedHash = bigcommerceStoreHash.trim();
                const trimmedToken = bigcommerceAccessToken.trim();

                if (!trimmedHash) {
                  toast({
                    title: "Store hash required",
                    description: "Please enter your BigCommerce store hash",
                    variant: "destructive",
                  });
                  return;
                }

                if (!trimmedToken) {
                  toast({
                    title: "Access token required",
                    description: "Please enter your BigCommerce API access token",
                    variant: "destructive",
                  });
                  return;
                }

                connectBigCommerceMutation.mutate({
                  storeHash: trimmedHash,
                  accessToken: trimmedToken,
                });
              }}
              disabled={connectBigCommerceMutation.isPending || !bigcommerceStoreHash.trim() || !bigcommerceAccessToken.trim()}
              className="w-full"
              size="lg"
            >
              {connectBigCommerceMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Squarespace Connection Dialog */}
      <Dialog open={isSquarespaceDialogOpen} onOpenChange={setIsSquarespaceDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <img 
                src="/squarespace-logo.png" 
                alt="Squarespace" 
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <DialogTitle>Connect Squarespace</DialogTitle>
            </div>
            <DialogDescription>
              Enter your Squarespace site URL and API key.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="squarespace-site-url">Site URL</Label>
              <Input
                id="squarespace-site-url"
                name="squarespace-site-url"
                type="text"
                value={squarespaceSiteUrl}
                onChange={(e) => setSquarespaceSiteUrl(e.target.value)}
                placeholder="https://example.squarespace.com"
                disabled={connectSquarespaceMutation.isPending}
                autoComplete="off"
                data-form-type="other"
                data-lpignore="true"
              />
              <p className="text-xs text-muted-foreground">
                Your Squarespace site URL (e.g., https://example.squarespace.com)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="squarespace-api-key">API Key</Label>
              <Input
                id="squarespace-api-key"
                name="squarespace-api-key"
                type="password"
                value={squarespaceApiKey}
                onChange={(e) => setSquarespaceApiKey(e.target.value)}
                placeholder="Your API key"
                disabled={connectSquarespaceMutation.isPending}
                autoComplete="new-password"
                data-form-type="other"
                data-lpignore="true"
                readOnly={!isInputReady}
                onFocus={(e) => {
                  if (!isInputReady) {
                    setIsInputReady(true);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Get this from Squarespace → Settings → Advanced → Developer API Keys → Generate Key
              </p>
            </div>

            <Button
              onClick={() => {
                const trimmedUrl = squarespaceSiteUrl.trim();
                const trimmedKey = squarespaceApiKey.trim();

                if (!trimmedUrl) {
                  toast({
                    title: "Site URL required",
                    description: "Please enter your Squarespace site URL",
                    variant: "destructive",
                  });
                  return;
                }

                if (!trimmedKey) {
                  toast({
                    title: "API key required",
                    description: "Please enter your Squarespace API key",
                    variant: "destructive",
                  });
                  return;
                }

                connectSquarespaceMutation.mutate({
                  siteUrl: trimmedUrl,
                  apiKey: trimmedKey,
                });
              }}
              disabled={connectSquarespaceMutation.isPending || !squarespaceSiteUrl.trim() || !squarespaceApiKey.trim()}
              className="w-full"
              size="lg"
            >
              {connectSquarespaceMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wix Connection Dialog */}
      <Dialog open={isWixDialogOpen} onOpenChange={setIsWixDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <img 
                src="/wix-logo.png" 
                alt="Wix" 
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <DialogTitle>Connect Wix</DialogTitle>
            </div>
            <DialogDescription>
              Enter your Wix site ID and OAuth access token.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="wix-site-id">Site ID</Label>
              <Input
                id="wix-site-id"
                name="wix-site-id"
                type="text"
                value={wixSiteId}
                onChange={(e) => setWixSiteId(e.target.value)}
                placeholder="abc123def456"
                disabled={connectWixMutation.isPending}
                autoComplete="off"
                data-form-type="other"
                data-lpignore="true"
              />
              <p className="text-xs text-muted-foreground">
                Your Wix site ID (found in your site's URL or Wix Developer Dashboard)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wix-access-token">Access Token</Label>
              <Input
                id="wix-access-token"
                name="wix-access-token"
                type="password"
                value={wixAccessToken}
                onChange={(e) => setWixAccessToken(e.target.value)}
                placeholder="Your OAuth access token"
                disabled={connectWixMutation.isPending}
                autoComplete="new-password"
                data-form-type="other"
                data-lpignore="true"
                readOnly={!isInputReady}
                onFocus={(e) => {
                  if (!isInputReady) {
                    setIsInputReady(true);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Get this from Wix Developer Dashboard → Your App → OAuth → Access Tokens
              </p>
            </div>

            <Button
              onClick={() => {
                const trimmedSiteId = wixSiteId.trim();
                const trimmedToken = wixAccessToken.trim();

                if (!trimmedSiteId) {
                  toast({
                    title: "Site ID required",
                    description: "Please enter your Wix site ID",
                    variant: "destructive",
                  });
                  return;
                }

                if (!trimmedToken) {
                  toast({
                    title: "Access token required",
                    description: "Please enter your Wix OAuth access token",
                    variant: "destructive",
                  });
                  return;
                }

                connectWixMutation.mutate({
                  siteId: trimmedSiteId,
                  accessToken: trimmedToken,
                });
              }}
              disabled={connectWixMutation.isPending || !wixSiteId.trim() || !wixAccessToken.trim()}
              className="w-full"
              size="lg"
            >
              {connectWixMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Connected Wix Card */}
      {isWixConnected && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Connected to Wix</p>
                    <p className="text-sm text-muted-foreground">
                      Site ID: {wixCredentials?.siteId}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => deleteWixMutation.mutate()}
                  disabled={deleteWixMutation.isPending}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {deleteWixMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <Button
                onClick={() => importWixMutation.mutate()}
                disabled={importWixMutation.isPending}
                className="w-full"
                variant="outline"
              >
                {importWixMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing products...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Import Products from Wix
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webflow Connection Dialog */}
      <Dialog open={isWebflowDialogOpen} onOpenChange={setIsWebflowDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <img 
                src="/webflow-logo.png" 
                alt="Webflow" 
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <DialogTitle>Connect Webflow</DialogTitle>
            </div>
            <DialogDescription>
              Enter your Webflow site ID and API access token.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="webflow-site-id">Site ID</Label>
              <Input
                id="webflow-site-id"
                name="webflow-site-id"
                type="text"
                value={webflowSiteId}
                onChange={(e) => setWebflowSiteId(e.target.value)}
                placeholder="abc123def456"
                disabled={connectWebflowMutation.isPending}
                autoComplete="off"
                data-form-type="other"
                data-lpignore="true"
              />
              <p className="text-xs text-muted-foreground">
                Your Webflow site ID (found in your site's settings or API dashboard)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webflow-access-token">Access Token</Label>
              <Input
                id="webflow-access-token"
                name="webflow-access-token"
                type="password"
                value={webflowAccessToken}
                onChange={(e) => setWebflowAccessToken(e.target.value)}
                placeholder="Your API access token"
                disabled={connectWebflowMutation.isPending}
                autoComplete="new-password"
                data-form-type="other"
                data-lpignore="true"
                readOnly={!isInputReady}
                onFocus={(e) => {
                  if (!isInputReady) {
                    setIsInputReady(true);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Get this from Webflow → Project Settings → API Access → Generate Token
              </p>
            </div>

            <Button
              onClick={() => {
                const trimmedSiteId = webflowSiteId.trim();
                const trimmedToken = webflowAccessToken.trim();

                if (!trimmedSiteId) {
                  toast({
                    title: "Site ID required",
                    description: "Please enter your Webflow site ID",
                    variant: "destructive",
                  });
                  return;
                }

                if (!trimmedToken) {
                  toast({
                    title: "Access token required",
                    description: "Please enter your Webflow API access token",
                    variant: "destructive",
                  });
                  return;
                }

                connectWebflowMutation.mutate({
                  siteId: trimmedSiteId,
                  accessToken: trimmedToken,
                });
              }}
              disabled={connectWebflowMutation.isPending || !webflowSiteId.trim() || !webflowAccessToken.trim()}
              className="w-full"
              size="lg"
            >
              {connectWebflowMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Connected Webflow Card */}
      {isWebflowConnected && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Connected to Webflow</p>
                    <p className="text-sm text-muted-foreground">
                      Site ID: {webflowCredentials?.siteId}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => deleteWebflowMutation.mutate()}
                  disabled={deleteWebflowMutation.isPending}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {deleteWebflowMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <Button
                onClick={() => importWebflowMutation.mutate()}
                disabled={importWebflowMutation.isPending}
                className="w-full"
                variant="outline"
              >
                {importWebflowMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing products...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Import Products from Webflow
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
