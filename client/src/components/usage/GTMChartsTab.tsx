import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, BarChart3, TrendingUp, Users, MousePointer, Globe, Monitor, Smartphone, Tablet, FileText, MapPin, ExternalLink, Clock, Target, Search, Megaphone, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import 'chartjs-adapter-luxon';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
);

interface GTMData {
  date: string;
  pageViews: number;
  sessions: number;
  users: number;
  clicks: number;
  conversions: number;
}

interface TrafficSource {
  source: string;
  sessions: number;
  percentage: number;
}

interface PageView {
  page: string;
  views: number;
  percentage: number;
}

interface DeviceData {
  device: string;
  sessions: number;
  percentage: number;
}

interface BrowserData {
  browser: string;
  sessions: number;
  percentage: number;
}

interface LandingPage {
  page: string;
  sessions: number;
  percentage: number;
  bounceRate: number;
}

interface Referrer {
  source: string;
  visits: number;
  percentage: number;
}

interface ExitPage {
  page: string;
  exits: number;
  percentage: number;
}

interface PageLoadTime {
  page: string;
  loadTime: number;
}

interface ConversionRate {
  page: string;
  conversions: number;
  rate: number;
}

interface SessionDuration {
  page: string;
  duration: number;
}

interface Keyword {
  keyword: string;
  searches: number;
  percentage: number;
}

interface Campaign {
  campaign: string;
  clicks: number;
  conversions: number;
}

interface ContentEngagement {
  page: string;
  avgTime: number;
  bounceRate: number;
}

export default function GTMChartsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [metric, setMetric] = useState<"pageViews" | "sessions" | "users" | "clicks" | "conversions">("pageViews");
  const [selectedDetailChart, setSelectedDetailChart] = useState<"keywords" | "campaigns" | "referrers" | "exitPages" | "pageLoadTimes" | "conversionRates" | "sessionDurations" | "contentEngagement">("keywords");
  
  // Calculate date range (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];
  const latestDate = endDate;

  // Fetch GTM Analytics Data
  const { data: gtmData = [], isLoading: isLoadingAnalytics, refetch: refetchAnalytics, error: analyticsError } = useQuery<GTMData[]>({
    queryKey: ["/api/gtm/analytics", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, endDate });
      const res = await fetch(`/api/gtm/analytics?${params}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Failed to fetch analytics: ${res.status}`);
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch Traffic Sources
  const { data: trafficSources = [], isLoading: isLoadingTrafficSources, refetch: refetchTrafficSources, error: trafficSourcesError } = useQuery<TrafficSource[]>({
    queryKey: ["/api/gtm/traffic-sources", latestDate],
    queryFn: async () => {
      const params = new URLSearchParams({ date: latestDate });
      const res = await fetch(`/api/gtm/traffic-sources?${params}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Failed to fetch traffic sources: ${res.status}`);
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch Page Views
  const { data: topPages = [], isLoading: isLoadingPageViews, refetch: refetchPageViews } = useQuery<PageView[]>({
    queryKey: ["/api/gtm/page-views"],
    queryFn: async () => {
      const params = new URLSearchParams({ date: latestDate });
      const res = await fetch(`/api/gtm/page-views?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch page views");
      return res.json();
    },
  });

  // Fetch Referrers
  const { data: referrers = [], isLoading: isLoadingReferrers, refetch: refetchReferrers } = useQuery<Referrer[]>({
    queryKey: ["/api/gtm/referrers"],
    queryFn: async () => {
      const params = new URLSearchParams({ date: latestDate });
      const res = await fetch(`/api/gtm/referrers?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch referrers");
      return res.json();
    },
  });

  // Fetch Keywords
  const { data: keywords = [], isLoading: isLoadingKeywords, refetch: refetchKeywords } = useQuery<Keyword[]>({
    queryKey: ["/api/gtm/keywords"],
    queryFn: async () => {
      const params = new URLSearchParams({ date: latestDate });
      const res = await fetch(`/api/gtm/keywords?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch keywords");
      return res.json();
    },
  });

  // Fetch Campaigns
  const { data: campaigns = [], isLoading: isLoadingCampaigns, refetch: refetchCampaigns } = useQuery<Campaign[]>({
    queryKey: ["/api/gtm/campaigns"],
    queryFn: async () => {
      const params = new URLSearchParams({ date: latestDate });
      const res = await fetch(`/api/gtm/campaigns?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json();
    },
  });

  // Check GTM connection status (must be before any conditional returns)
  const { data: gtmStatus, refetch: refetchGtmStatus } = useQuery<{ connected: boolean; accountId?: string; containerId?: string }>({
    queryKey: ["/api/gtm/credentials"],
    queryFn: async () => {
      const res = await fetch("/api/gtm/credentials", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch GTM credentials");
      return res.json();
    },
  });

  // Fetch GA4 connection status
  const { data: ga4Status, refetch: refetchGa4Status } = useQuery<{ connected: boolean; propertyId?: string }>({
    queryKey: ["/api/ga4/credentials"],
    queryFn: async () => {
      const res = await fetch("/api/ga4/credentials", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch GA4 credentials");
      return res.json();
    },
  });

  // Seed mock data mutation
  const seedMockDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/gtm/seed-mock-data", {});
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch all GTM queries
      queryClient.invalidateQueries({ queryKey: ["/api/gtm/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gtm/traffic-sources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gtm/page-views"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gtm/referrers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gtm/keywords"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gtm/campaigns"] });
      
      // Also manually refetch to ensure immediate update
      setTimeout(() => {
        refetchAnalytics();
        refetchTrafficSources();
        refetchPageViews();
        refetchReferrers();
        refetchKeywords();
        refetchCampaigns();
      }, 100);
      
      toast({
        title: "Mock data seeded",
        description: "GTM mock data has been loaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to seed data",
        description: error.message || "Failed to load mock data",
        variant: "destructive",
      });
    },
  });

  // Handle refresh
  const handleRefresh = () => {
    refetchAnalytics();
    refetchTrafficSources();
    refetchPageViews();
    refetchReferrers();
    refetchKeywords();
    refetchCampaigns();
  };

  const [showTestUserInstructions, setShowTestUserInstructions] = useState(false);
  const [showServiceAccountInput, setShowServiceAccountInput] = useState(false);
  const [serviceAccountKey, setServiceAccountKey] = useState("");
  const [serviceAccountAccountId, setServiceAccountAccountId] = useState("");
  const [serviceAccountContainerId, setServiceAccountContainerId] = useState("");
  
  // GA4 connection state
  const [showGa4ServiceAccountInput, setShowGa4ServiceAccountInput] = useState(false);
  const [ga4ServiceAccountKey, setGa4ServiceAccountKey] = useState("");
  const [ga4PropertyId, setGa4PropertyId] = useState("");

  // Connect GTM mutation
  const connectGtmMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/gtm/oauth/initiate", { credentials: "include" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || `HTTP ${response.status}: Failed to initiate OAuth`;
        const requiresTestUser = errorData.requiresTestUser || errorMessage.includes("access_denied");
        if (requiresTestUser) {
          setShowTestUserInstructions(true);
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      if (!data.authUrl) {
        throw new Error("No authorization URL received from server");
      }
      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    },
    onError: (error: any) => {
      console.error("[GTM] Connection error:", error.message || "Failed to initiate GTM connection");
      if (!error.message.includes("access_denied")) {
        toast({
          title: "Failed to connect",
          description: error.message || "Failed to initiate GTM connection. Please check server logs.",
          variant: "destructive",
        });
      }
    },
  });

  // Connect via Service Account mutation
  const connectServiceAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/gtm/credentials/service-account", {
        serviceAccountKey,
        accountId: serviceAccountAccountId || undefined,
        containerId: serviceAccountContainerId || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      setShowServiceAccountInput(false);
      setServiceAccountKey("");
      setServiceAccountAccountId("");
      setServiceAccountContainerId("");
      refetchGtmStatus();
      queryClient.invalidateQueries({ queryKey: ["/api/gtm"] });
      toast({
        title: "Connected",
        description: "GTM account connected via service account",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to connect",
        description: error.message || "Failed to connect service account",
        variant: "destructive",
      });
    },
  });

  // GA4 Connection mutations
  const connectGa4Mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ga4/oauth/initiate", { credentials: "include" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to initiate OAuth`);
      }
      const data = await response.json();
      if (!data.authUrl) {
        throw new Error("No authorization URL received from server");
      }
      window.location.href = data.authUrl;
    },
    onError: (error: any) => {
      toast({
        title: "Failed to connect",
        description: error.message || "Failed to initiate GA4 connection",
        variant: "destructive",
      });
    },
  });

  const connectGa4ServiceAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ga4/credentials/service-account", {
        serviceAccountKey: ga4ServiceAccountKey,
        propertyId: ga4PropertyId || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      setShowGa4ServiceAccountInput(false);
      setGa4ServiceAccountKey("");
      setGa4PropertyId("");
      refetchGa4Status();
      queryClient.invalidateQueries({ queryKey: ["/api/ga4"] });
      toast({
        title: "Connected",
        description: "Google Analytics account connected via service account",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to connect",
        description: error.message || "Failed to connect service account",
        variant: "destructive",
      });
    },
  });

  const disconnectGa4Mutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/ga4/credentials", {});
      return response.json();
    },
    onSuccess: () => {
      refetchGa4Status();
      queryClient.invalidateQueries({ queryKey: ["/api/ga4"] });
      toast({
        title: "Disconnected",
        description: "Google Analytics account has been disconnected",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to disconnect",
        description: error.message || "Failed to disconnect GA4 account",
        variant: "destructive",
      });
    },
  });

  // Disconnect GTM mutation
  const disconnectGtmMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/gtm/credentials", {});
      return response.json();
    },
    onSuccess: () => {
      refetchGtmStatus();
      queryClient.invalidateQueries({ queryKey: ["/api/gtm"] });
      toast({
        title: "Disconnected",
        description: "GTM account has been disconnected",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to disconnect",
        description: error.message || "Failed to disconnect GTM account",
        variant: "destructive",
      });
    },
  });

  // Check if we have any data
  const hasData = gtmData.length > 0 || trafficSources.length > 0 || topPages.length > 0;

  // Loading state
  const loading = isLoadingAnalytics || isLoadingTrafficSources || isLoadingPageViews || 
                  isLoadingReferrers || isLoadingKeywords || isLoadingCampaigns;

  // Mock data for charts that don't have API endpoints yet
  // These will be replaced when we implement full GTM integration
  const [deviceData] = useState<DeviceData[]>([
    { device: "Desktop", sessions: 5200, percentage: 52 },
    { device: "Mobile", sessions: 3800, percentage: 38 },
    { device: "Tablet", sessions: 1000, percentage: 10 },
  ]);

  const [browserData] = useState<BrowserData[]>([
    { browser: "Chrome", sessions: 6500, percentage: 65 },
    { browser: "Safari", sessions: 2000, percentage: 20 },
    { browser: "Firefox", sessions: 800, percentage: 8 },
    { browser: "Edge", sessions: 500, percentage: 5 },
    { browser: "Other", sessions: 200, percentage: 2 },
  ]);

  const [landingPages] = useState<LandingPage[]>([
    { page: "/home", sessions: 3200, percentage: 32, bounceRate: 45 },
    { page: "/products", sessions: 2100, percentage: 21, bounceRate: 38 },
    { page: "/blog/post-1", sessions: 1500, percentage: 15, bounceRate: 52 },
    { page: "/pricing", sessions: 1200, percentage: 12, bounceRate: 42 },
    { page: "/about", sessions: 1000, percentage: 10, bounceRate: 35 },
    { page: "/contact", sessions: 1000, percentage: 10, bounceRate: 28 },
  ]);

  const [exitPages] = useState<ExitPage[]>([
    { page: "/checkout/complete", exits: 2800, percentage: 28 },
    { page: "/blog/post-5", exits: 1500, percentage: 15 },
    { page: "/contact", exits: 1200, percentage: 12 },
    { page: "/faq", exits: 1000, percentage: 10 },
    { page: "/products/item-3", exits: 900, percentage: 9 },
    { page: "/about", exits: 800, percentage: 8 },
    { page: "/pricing", exits: 700, percentage: 7 },
    { page: "/home", exits: 1100, percentage: 11 },
  ]);

  const [pageLoadTimes] = useState<PageLoadTime[]>([
    { page: "/home", loadTime: 1.2 },
    { page: "/products", loadTime: 2.1 },
    { page: "/blog", loadTime: 1.8 },
    { page: "/pricing", loadTime: 1.5 },
    { page: "/about", loadTime: 1.3 },
    { page: "/contact", loadTime: 1.6 },
    { page: "/checkout", loadTime: 2.5 },
    { page: "/faq", loadTime: 1.1 },
  ]);

  const [conversionRates] = useState<ConversionRate[]>([
    { page: "/checkout/complete", conversions: 450, rate: 15.2 },
    { page: "/pricing", conversions: 320, rate: 12.8 },
    { page: "/products", conversions: 280, rate: 10.5 },
    { page: "/home", conversions: 150, rate: 8.3 },
    { page: "/blog/post-1", conversions: 120, rate: 7.1 },
    { page: "/about", conversions: 80, rate: 5.2 },
    { page: "/contact", conversions: 60, rate: 4.8 },
    { page: "/faq", conversions: 40, rate: 3.5 },
  ]);

  const [sessionDurations] = useState<SessionDuration[]>([
    { page: "/blog", duration: 4.5 },
    { page: "/products", duration: 3.8 },
    { page: "/pricing", duration: 3.2 },
    { page: "/about", duration: 2.9 },
    { page: "/home", duration: 2.5 },
    { page: "/contact", duration: 2.1 },
    { page: "/faq", duration: 1.8 },
    { page: "/checkout", duration: 1.5 },
  ]);

  const [contentEngagement] = useState<ContentEngagement[]>([
    { page: "/blog/post-1", avgTime: 5.2, bounceRate: 35 },
    { page: "/blog/post-2", avgTime: 4.8, bounceRate: 42 },
    { page: "/products", avgTime: 3.5, bounceRate: 38 },
    { page: "/pricing", avgTime: 3.2, bounceRate: 45 },
    { page: "/about", avgTime: 2.8, bounceRate: 52 },
    { page: "/home", avgTime: 2.5, bounceRate: 48 },
    { page: "/contact", avgTime: 2.1, bounceRate: 55 },
    { page: "/faq", avgTime: 1.8, bounceRate: 60 },
  ]);

  const chartData = {
    labels: gtmData.map(d => new Date(d.date)),
    datasets: [
      {
        label: metric === "pageViews" ? "Page Views" :
               metric === "sessions" ? "Sessions" :
               metric === "users" ? "Users" :
               metric === "clicks" ? "Clicks" : "Conversions",
        data: gtmData.map(d => d[metric]),
        borderColor: "rgb(37, 99, 235)",
        backgroundColor: chartType === "bar" 
          ? "rgba(37, 99, 235, 0.8)" 
          : "rgba(37, 99, 235, 0.15)",
        fill: chartType === "line",
        tension: 0.25,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
    },
    scales: {
      x: {
        type: "time" as const,
        time: {
          unit: "day" as const,
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
        },
      },
    },
  };

  const trafficSourceData = {
    labels: trafficSources.map(t => t.source),
    datasets: [
      {
        data: trafficSources.map(t => t.sessions),
        backgroundColor: [
          "rgba(37, 99, 235, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(139, 92, 246, 0.8)",
        ],
        borderWidth: 0,
      },
    ],
  };

  const topPagesData = {
    labels: topPages.map(p => p.page),
    datasets: [
      {
        label: "Page Views",
        data: topPages.map(p => p.views),
        backgroundColor: "rgba(37, 99, 235, 0.8)",
        borderRadius: 4,
      },
    ],
  };

  const deviceDataChart = {
    labels: deviceData.map(d => d.device),
    datasets: [
      {
        data: deviceData.map(d => d.sessions),
        backgroundColor: [
          "rgba(37, 99, 235, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
        ],
        borderWidth: 0,
      },
    ],
  };

  const browserDataChart = {
    labels: browserData.map(b => b.browser),
    datasets: [
      {
        label: "Sessions",
        data: browserData.map(b => b.sessions),
        backgroundColor: [
          "rgba(37, 99, 235, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(139, 92, 246, 0.8)",
        ],
        borderRadius: 4,
      },
    ],
  };

  const landingPagesData = {
    labels: landingPages.map(p => p.page),
    datasets: [
      {
        label: "Sessions",
        data: landingPages.map(p => p.sessions),
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderRadius: 4,
      },
    ],
  };

  const referrersData = {
    labels: referrers.map(r => r.source),
    datasets: [
      {
        label: "Visits",
        data: referrers.map(r => r.visits),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderRadius: 4,
      },
    ],
  };

  const exitPagesData = {
    labels: exitPages.map(e => e.page),
    datasets: [
      {
        label: "Exits",
        data: exitPages.map(e => e.exits),
        backgroundColor: "rgba(239, 68, 68, 0.8)",
        borderRadius: 4,
      },
    ],
  };

  const pageLoadTimesData = {
    labels: pageLoadTimes.map(p => p.page),
    datasets: [
      {
        label: "Load Time (s)",
        data: pageLoadTimes.map(p => p.loadTime),
        backgroundColor: "rgba(245, 158, 11, 0.8)",
        borderRadius: 4,
      },
    ],
  };

  const conversionRatesData = {
    labels: conversionRates.map(c => c.page),
    datasets: [
      {
        label: "Conversion Rate (%)",
        data: conversionRates.map(c => c.rate),
        backgroundColor: "rgba(139, 92, 246, 0.8)",
        borderRadius: 4,
      },
    ],
  };

  const sessionDurationsData = {
    labels: sessionDurations.map(s => s.page),
    datasets: [
      {
        label: "Duration (min)",
        data: sessionDurations.map(s => s.duration),
        backgroundColor: "rgba(236, 72, 153, 0.8)",
        borderRadius: 4,
      },
    ],
  };

  const keywordsData = {
    labels: keywords.map(k => k.keyword),
    datasets: [
      {
        label: "Searches",
        data: keywords.map(k => k.searches),
        backgroundColor: "rgba(34, 197, 94, 0.8)",
        borderRadius: 4,
      },
    ],
  };

  const campaignsData = {
    labels: campaigns.map(c => c.campaign),
    datasets: [
      {
        label: "Clicks",
        data: campaigns.map(c => c.clicks),
        backgroundColor: "rgba(251, 146, 60, 0.8)",
        borderRadius: 4,
      },
      {
        label: "Conversions",
        data: campaigns.map(c => c.conversions),
        backgroundColor: "rgba(236, 72, 153, 0.8)",
        borderRadius: 4,
      },
    ],
  };

  // Combined multi-metric chart data - combining top pages with multiple metrics
  const topPagesForCombined = topPages.slice(0, 10);
  const combinedMetricsData = {
    labels: topPagesForCombined.map(p => p.page),
    datasets: [
      {
        label: "Page Views",
        data: topPagesForCombined.map(p => p.views),
        backgroundColor: "rgba(37, 99, 235, 0.8)",
        yAxisID: "y",
        borderRadius: 4,
      },
      {
        label: "Exit Count",
        data: topPagesForCombined.map(p => {
          const exitPage = exitPages.find(e => e.page === p.page);
          return exitPage ? exitPage.exits : 0;
        }),
        backgroundColor: "rgba(239, 68, 68, 0.8)",
        yAxisID: "y",
        borderRadius: 4,
      },
      {
        label: "Load Time (s × 100)",
        data: topPagesForCombined.map(p => {
          const loadTime = pageLoadTimes.find(plt => plt.page === p.page);
          return loadTime ? loadTime.loadTime * 100 : 0; // Scale by 100 for visibility
        }),
        backgroundColor: "rgba(245, 158, 11, 0.8)",
        yAxisID: "y1",
        borderRadius: 4,
      },
      {
        label: "Conversion Rate (% × 100)",
        data: topPagesForCombined.map(p => {
          const convRate = conversionRates.find(cr => cr.page === p.page);
          return convRate ? convRate.rate * 100 : 0; // Scale by 100 for visibility
        }),
        backgroundColor: "rgba(139, 92, 246, 0.8)",
        yAxisID: "y1",
        borderRadius: 4,
      },
      {
        label: "Session Duration (min × 100)",
        data: topPagesForCombined.map(p => {
          const sessionDur = sessionDurations.find(sd => sd.page === p.page);
          return sessionDur ? sessionDur.duration * 100 : 0; // Scale by 100 for visibility
        }),
        backgroundColor: "rgba(236, 72, 153, 0.8)",
        yAxisID: "y1",
        borderRadius: 4,
      },
    ],
  };

  const combinedMetricsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            let value = context.parsed.y;
            // Unscale values that were scaled
            if (label.includes("Load Time") || label.includes("Conversion Rate") || label.includes("Session Duration")) {
              value = value / 100;
            }
            if (label.includes("Load Time")) {
              return `${label.replace(" × 100", "")}: ${value.toFixed(1)}s`;
            } else if (label.includes("Conversion Rate")) {
              return `${label.replace(" × 100", "")}: ${value.toFixed(1)}%`;
            } else if (label.includes("Session Duration")) {
              return `${label.replace(" × 100", "")}: ${value.toFixed(1)} min`;
            }
            return `${label}: ${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        type: "linear" as const,
        position: "left" as const,
        beginAtZero: true,
        title: {
          display: true,
          text: "Views / Exits",
        },
        grid: {
          display: true,
        },
      },
      y1: {
        type: "linear" as const,
        position: "right" as const,
        beginAtZero: true,
        title: {
          display: true,
          text: "Time / Rate (scaled)",
        },
        grid: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const contentEngagementData = {
    labels: contentEngagement.map(c => c.page),
    datasets: [
      {
        label: "Avg Time (min)",
        data: contentEngagement.map(c => c.avgTime),
        backgroundColor: "rgba(168, 85, 247, 0.8)",
        borderRadius: 4,
      },
    ],
  };

  // Dynamic chart data based on selected detail chart
  const getDetailChartData = () => {
    switch (selectedDetailChart) {
      case "keywords":
        return {
          data: keywordsData,
          title: "Top Keywords",
          icon: Search,
        };
      case "campaigns":
        return {
          data: campaignsData,
          title: "Campaign Performance",
          icon: Megaphone,
        };
      case "referrers":
        return {
          data: referrersData,
          title: "Top Referrers",
          icon: ExternalLink,
        };
      case "exitPages":
        return {
          data: exitPagesData,
          title: "Exit Pages",
          icon: ExternalLink,
        };
      case "pageLoadTimes":
        return {
          data: pageLoadTimesData,
          title: "Page Load Times",
          icon: Clock,
        };
      case "conversionRates":
        return {
          data: conversionRatesData,
          title: "Conversion Rates by Page",
          icon: Target,
        };
      case "sessionDurations":
        return {
          data: sessionDurationsData,
          title: "Average Session Duration",
          icon: Clock,
        };
      case "contentEngagement":
        return {
          data: contentEngagementData,
          title: "Content Engagement",
          icon: BookOpen,
        };
      default:
        return {
          data: keywordsData,
          title: "Top Keywords",
          icon: Search,
        };
    }
  };

  const detailChartConfig = getDetailChartData();
  const DetailChartIcon = detailChartConfig.icon;

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
        },
      },
    },
  };

  // Calculate summary stats
  const totalPageViews = gtmData.reduce((acc, item) => acc + item.pageViews, 0);
  const totalSessions = gtmData.reduce((acc, item) => acc + item.sessions, 0);
  const totalUsers = gtmData.reduce((acc, item) => acc + item.users, 0);
  const totalClicks = gtmData.reduce((acc, item) => acc + item.clicks, 0);
  const totalConversions = gtmData.reduce((acc, item) => acc + item.conversions, 0);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-[500px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Test User Instructions Dialog */}
      <Dialog open={showTestUserInstructions} onOpenChange={setShowTestUserInstructions}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>GTM Connection Requires Test User Access</DialogTitle>
            <DialogDescription>
              The app is currently in testing mode. You need to be added as a test user to connect your GTM account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Alert>
              <AlertDescription>
                <strong>Option 1: Self-Service (Recommended)</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>Go to <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Google Cloud Console → OAuth Consent Screen</a></li>
                  <li>Scroll down to <strong>"Test users"</strong> section</li>
                  <li>Click <strong>"+ ADD USERS"</strong></li>
                  <li>Add your Google account email (the one you'll use to connect GTM)</li>
                  <li>Click <strong>"ADD"</strong> and <strong>"SAVE"</strong></li>
                  <li>Come back here and try connecting again</li>
                </ol>
              </AlertDescription>
            </Alert>
            <Alert>
              <AlertDescription>
                <strong>Option 2: Use Service Account (No OAuth Needed!)</strong>
                <p className="mt-2 text-sm mb-2">
                  Provide a Service Account JSON key instead. No OAuth consent screen needed!
                </p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setShowTestUserInstructions(false);
                    setShowServiceAccountInput(true);
                  }}
                >
                  Connect with Service Account
                </Button>
              </AlertDescription>
            </Alert>
            <Alert>
              <AlertDescription>
                <strong>Option 3: Request Access</strong>
                <p className="mt-2 text-sm">
                  Contact support at <a href="mailto:support@saasdashkit.com" className="text-blue-500 underline">support@saasdashkit.com</a> with your Google account email, and we'll add you as a test user.
                </p>
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTestUserInstructions(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setShowTestUserInstructions(false);
                window.open("https://console.cloud.google.com/apis/credentials/consent", "_blank");
              }}>
                Open Google Cloud Console
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Service Account Input Dialog */}
      <Dialog open={showServiceAccountInput} onOpenChange={setShowServiceAccountInput}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Connect GTM with Service Account</DialogTitle>
            <DialogDescription>
              Paste your Service Account JSON key. This is like an API key - no OAuth needed!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Alert>
              <AlertDescription className="text-sm">
                <strong>How to get a Service Account key:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Go to <a href="https://console.cloud.google.com/iam-admin/serviceaccounts" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Google Cloud Console → Service Accounts</a></li>
                  <li>Create a new service account (or use existing)</li>
                  <li>Grant it access to your GTM account in Google Tag Manager</li>
                  <li>Create a JSON key and download it</li>
                  <li>Paste the JSON content below</li>
                </ol>
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="serviceAccountKey">Service Account JSON Key</Label>
              <Textarea
                id="serviceAccountKey"
                placeholder='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
                value={serviceAccountKey}
                onChange={(e) => setServiceAccountKey(e.target.value)}
                className="font-mono text-xs"
                rows={8}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountId">GTM Account ID (Optional)</Label>
                <Input
                  id="accountId"
                  placeholder="Auto-detected if empty"
                  value={serviceAccountAccountId}
                  onChange={(e) => setServiceAccountAccountId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="containerId">GTM Container ID (Optional)</Label>
                <Input
                  id="containerId"
                  placeholder="Auto-detected if empty"
                  value={serviceAccountContainerId}
                  onChange={(e) => setServiceAccountContainerId(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowServiceAccountInput(false);
                setServiceAccountKey("");
                setServiceAccountAccountId("");
                setServiceAccountContainerId("");
              }}>
                Cancel
              </Button>
              <Button 
                onClick={() => connectServiceAccountMutation.mutate()}
                disabled={!serviceAccountKey || connectServiceAccountMutation.isPending}
              >
                {connectServiceAccountMutation.isPending ? "Connecting..." : "Connect"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* GA4 Service Account Input Dialog */}
      <Dialog open={showGa4ServiceAccountInput} onOpenChange={setShowGa4ServiceAccountInput}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Connect Google Analytics with Service Account</DialogTitle>
            <DialogDescription>
              Paste your Service Account JSON key. This is like an API key - no OAuth needed!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Alert>
              <AlertDescription className="text-sm">
                <strong>How to get a Service Account key:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Go to <a href="https://console.cloud.google.com/iam-admin/serviceaccounts" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Google Cloud Console → Service Accounts</a></li>
                  <li>Create a new service account (or use existing)</li>
                  <li>Grant it access to your GA4 property in Google Analytics</li>
                  <li>Create a JSON key and download it</li>
                  <li>Paste the JSON content below</li>
                </ol>
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="ga4ServiceAccountKey">Service Account JSON Key</Label>
              <Textarea
                id="ga4ServiceAccountKey"
                placeholder='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
                value={ga4ServiceAccountKey}
                onChange={(e) => setGa4ServiceAccountKey(e.target.value)}
                className="font-mono text-xs"
                rows={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ga4PropertyId">GA4 Property ID (Optional)</Label>
              <Input
                id="ga4PropertyId"
                placeholder="properties/123456789 (Auto-detected if empty)"
                value={ga4PropertyId}
                onChange={(e) => setGa4PropertyId(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowGa4ServiceAccountInput(false);
                setGa4ServiceAccountKey("");
                setGa4PropertyId("");
              }}>
                Cancel
              </Button>
              <Button 
                onClick={() => connectGa4ServiceAccountMutation.mutate()}
                disabled={!ga4ServiceAccountKey || connectGa4ServiceAccountMutation.isPending}
              >
                {connectGa4ServiceAccountMutation.isPending ? "Connecting..." : "Connect"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Google Tag Manager Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Track page views, sessions, users, clicks, conversions, traffic sources, and more
          </p>
          {gtmStatus?.connected && (
            <p className="text-xs text-muted-foreground mt-1">
              GTM Connected: Account {gtmStatus.accountId} | Container {gtmStatus.containerId}
            </p>
          )}
          {ga4Status?.connected && (
            <p className="text-xs text-muted-foreground mt-1">
              GA4 Connected: Property {ga4Status.propertyId}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {ga4Status?.connected ? (
            <Button
              onClick={() => disconnectGa4Mutation.mutate()}
              disabled={disconnectGa4Mutation.isPending}
              variant="destructive"
              size="sm"
            >
              Disconnect GA4
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => connectGa4Mutation.mutate()}
                disabled={connectGa4Mutation.isPending}
                variant="default"
                size="sm"
              >
                {connectGa4Mutation.isPending ? "Connecting..." : "Connect Google Analytics"}
              </Button>
              <Button
                onClick={() => setShowGa4ServiceAccountInput(true)}
                variant="outline"
                size="sm"
              >
                Connect GA4 (Service Account)
              </Button>
            </div>
          )}
          {gtmStatus?.connected ? (
            <Button
              onClick={() => disconnectGtmMutation.mutate()}
              disabled={disconnectGtmMutation.isPending}
              variant="destructive"
              size="sm"
            >
              Disconnect GTM
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => connectGtmMutation.mutate()}
                disabled={connectGtmMutation.isPending}
                variant="default"
                size="sm"
              >
                {connectGtmMutation.isPending ? "Connecting..." : "Connect GTM (OAuth)"}
              </Button>
              <Button
                onClick={() => setShowServiceAccountInput(true)}
                variant="outline"
                size="sm"
              >
                Connect GTM (Service Account)
              </Button>
            </div>
          )}
          <Select value={chartType} onValueChange={(value: "line" | "bar") => setChartType(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
            </SelectContent>
          </Select>
          <Select value={metric} onValueChange={(value: any) => setMetric(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pageViews">Page Views</SelectItem>
              <SelectItem value="sessions">Sessions</SelectItem>
              <SelectItem value="users">Users</SelectItem>
              <SelectItem value="clicks">Clicks</SelectItem>
              <SelectItem value="conversions">Conversions</SelectItem>
            </SelectContent>
          </Select>
          {!hasData && (
            <Button 
              onClick={() => seedMockDataMutation.mutate()} 
              disabled={seedMockDataMutation.isPending}
              variant="default"
            >
              {seedMockDataMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Seeding...
                </>
              ) : (
                "Load Sample Data"
              )}
            </Button>
          )}
          <Button 
            onClick={handleRefresh} 
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {!hasData && !loading && (
        <Alert>
          <AlertDescription>
            No GTM data available. Click "Load Sample Data" to populate with mock data for demonstration.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Page Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalPageViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalSessions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MousePointer className="w-4 h-4" />
              Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalClicks.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalConversions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total conversions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Time Series Chart */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              {metric === "pageViews" ? "Page Views" :
               metric === "sessions" ? "Sessions" :
               metric === "users" ? "Users" :
               metric === "clicks" ? "Clicks" : "Conversions"} Over Time
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              Last 30 days
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] w-full">
            {analyticsError ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-destructive mb-2">Error loading data</p>
                  <p className="text-sm text-muted-foreground">{String(analyticsError)}</p>
                </div>
              </div>
            ) : gtmData.length > 0 ? (
              chartType === "line" ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <Bar data={chartData} options={chartOptions} />
              )
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Traffic Source and Landing Pages Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Traffic Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              {trafficSourcesError ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-destructive mb-2">Error loading data</p>
                    <p className="text-sm text-muted-foreground">{String(trafficSourcesError)}</p>
                  </div>
                </div>
              ) : trafficSources.length > 0 ? (
                <Doughnut data={trafficSourceData} options={pieChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {trafficSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{source.source}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{source.sessions.toLocaleString()}</span>
                    <span className="text-muted-foreground w-12 text-right">{source.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Landing Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              {landingPages.length > 0 ? (
                <Bar data={landingPagesData} options={barChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {landingPages.slice(0, 5).map((page, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate flex-1">{page.page}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{page.sessions.toLocaleString()}</span>
                    <span className="text-muted-foreground w-12 text-right">{page.bounceRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Viewed Pages - Full Width (Twice as Big) */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Most Viewed Pages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] w-full">
            {topPages.length > 0 ? (
              <Bar data={topPagesData} options={barChartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No data available</p>
              </div>
            )}
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topPages.map((page, index) => (
              <div key={index} className="flex items-center justify-between text-sm p-3 rounded-lg border bg-card">
                <span className="text-muted-foreground truncate flex-1 font-medium">{page.page}</span>
                <div className="flex items-center gap-3 ml-4">
                  <span className="font-bold text-foreground">{page.views.toLocaleString()}</span>
                  <span className="text-muted-foreground w-12 text-right text-xs">{page.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Device Types Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Device Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              {deviceData.length > 0 ? (
                <Pie data={deviceDataChart} options={pieChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {deviceData.map((device, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {device.device === "Desktop" && <Monitor className="w-4 h-4 text-muted-foreground" />}
                    {device.device === "Mobile" && <Smartphone className="w-4 h-4 text-muted-foreground" />}
                    {device.device === "Tablet" && <Tablet className="w-4 h-4 text-muted-foreground" />}
                    <span className="text-muted-foreground">{device.device}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{device.sessions.toLocaleString()}</span>
                    <span className="text-muted-foreground w-12 text-right">{device.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Browser Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              {browserData.length > 0 ? (
                <Bar data={browserDataChart} options={barChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {browserData.map((browser, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{browser.browser}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{browser.sessions.toLocaleString()}</span>
                    <span className="text-muted-foreground w-12 text-right">{browser.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Combined Multi-Metric Chart - Big chart below Device Types */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Page Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] w-full">
            {topPages.length > 0 ? (
              <Bar data={combinedMetricsData} options={combinedMetricsOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Charts - Big chart with selector */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <DetailChartIcon className="w-4 h-4" />
              {detailChartConfig.title}
            </CardTitle>
            <Select 
              value={selectedDetailChart} 
              onValueChange={(value: typeof selectedDetailChart) => setSelectedDetailChart(value)}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keywords">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Top Keywords
                  </div>
                </SelectItem>
                <SelectItem value="campaigns">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4" />
                    Campaign Performance
                  </div>
                </SelectItem>
                <SelectItem value="referrers">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Top Referrers
                  </div>
                </SelectItem>
                <SelectItem value="exitPages">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Exit Pages
                  </div>
                </SelectItem>
                <SelectItem value="pageLoadTimes">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Page Load Times
                  </div>
                </SelectItem>
                <SelectItem value="conversionRates">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Conversion Rates by Page
                  </div>
                </SelectItem>
                <SelectItem value="sessionDurations">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Average Session Duration
                  </div>
                </SelectItem>
                <SelectItem value="contentEngagement">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Content Engagement
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] w-full">
            {(() => {
              const chartData = detailChartConfig.data;
              const hasData = chartData.labels.length > 0;
              
              if (!hasData) {
                return (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                );
              }

              // Use Bar chart for most, but could use different chart types
              if (selectedDetailChart === "keywords" || 
                  selectedDetailChart === "campaigns" || 
                  selectedDetailChart === "referrers" ||
                  selectedDetailChart === "exitPages" ||
                  selectedDetailChart === "pageLoadTimes" ||
                  selectedDetailChart === "conversionRates" ||
                  selectedDetailChart === "sessionDurations" ||
                  selectedDetailChart === "contentEngagement") {
                return <Bar data={chartData} options={barChartOptions} />;
              }

              return <Bar data={chartData} options={barChartOptions} />;
            })()}
          </div>
          {/* Data table below chart */}
          <div className="mt-6 space-y-2">
            {(() => {
              switch (selectedDetailChart) {
                case "keywords":
                  return keywords.slice(0, 10).map((keyword, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-3 rounded-lg border bg-card">
                      <span className="text-muted-foreground truncate flex-1 font-medium">{keyword.keyword}</span>
                      <div className="flex items-center gap-3 ml-4">
                        <span className="font-bold text-foreground">{keyword.searches.toLocaleString()}</span>
                        <span className="text-muted-foreground w-12 text-right text-xs">{keyword.percentage}%</span>
                      </div>
                    </div>
                  ));
                case "campaigns":
                  return campaigns.slice(0, 10).map((campaign, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-3 rounded-lg border bg-card">
                      <span className="text-muted-foreground truncate flex-1 font-medium">{campaign.campaign}</span>
                      <div className="flex items-center gap-3 ml-4">
                        <span className="font-bold text-foreground">{campaign.clicks.toLocaleString()}</span>
                        <span className="text-muted-foreground text-xs">({campaign.conversions} conv.)</span>
                      </div>
                    </div>
                  ));
                case "referrers":
                  return referrers.slice(0, 10).map((referrer, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-3 rounded-lg border bg-card">
                      <span className="text-muted-foreground truncate flex-1 font-medium">{referrer.source}</span>
                      <div className="flex items-center gap-3 ml-4">
                        <span className="font-bold text-foreground">{referrer.visits.toLocaleString()}</span>
                        <span className="text-muted-foreground w-12 text-right text-xs">{referrer.percentage}%</span>
                      </div>
                    </div>
                  ));
                case "exitPages":
                  return exitPages.slice(0, 10).map((page, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-3 rounded-lg border bg-card">
                      <span className="text-muted-foreground truncate flex-1 font-medium">{page.page}</span>
                      <div className="flex items-center gap-3 ml-4">
                        <span className="font-bold text-foreground">{page.exits.toLocaleString()}</span>
                        <span className="text-muted-foreground w-12 text-right text-xs">{page.percentage}%</span>
                      </div>
                    </div>
                  ));
                case "pageLoadTimes":
                  return pageLoadTimes.slice(0, 10).map((page, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-3 rounded-lg border bg-card">
                      <span className="text-muted-foreground truncate flex-1 font-medium">{page.page}</span>
                      <div className="flex items-center gap-3 ml-4">
                        <span className="font-bold text-foreground">{page.loadTime.toFixed(1)}s</span>
                      </div>
                    </div>
                  ));
                case "conversionRates":
                  return conversionRates.slice(0, 10).map((page, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-3 rounded-lg border bg-card">
                      <span className="text-muted-foreground truncate flex-1 font-medium">{page.page}</span>
                      <div className="flex items-center gap-3 ml-4">
                        <span className="font-bold text-foreground">{page.rate.toFixed(1)}%</span>
                        <span className="text-muted-foreground text-xs">({page.conversions})</span>
                      </div>
                    </div>
                  ));
                case "sessionDurations":
                  return sessionDurations.slice(0, 10).map((page, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-3 rounded-lg border bg-card">
                      <span className="text-muted-foreground truncate flex-1 font-medium">{page.page}</span>
                      <div className="flex items-center gap-3 ml-4">
                        <span className="font-bold text-foreground">{page.duration.toFixed(1)} min</span>
                      </div>
                    </div>
                  ));
                case "contentEngagement":
                  return contentEngagement.slice(0, 10).map((page, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-3 rounded-lg border bg-card">
                      <span className="text-muted-foreground truncate flex-1 font-medium">{page.page}</span>
                      <div className="flex items-center gap-3 ml-4">
                        <span className="font-bold text-foreground">{page.avgTime.toFixed(1)} min</span>
                        <span className="text-muted-foreground text-xs">({page.bounceRate}% bounce)</span>
                      </div>
                    </div>
                  ));
                default:
                  return null;
              }
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
