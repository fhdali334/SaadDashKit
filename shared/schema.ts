import { z } from "zod";

// User table for authentication and API credentials storage
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  password: z.string(),
  apiKey: z.string(),
  projectId: z.string(),
  environmentId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const insertUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Shared links table for transcript sharing
export const sharedLinkSchema = z.object({
  id: z.number(),
  shareId: z.string(),
  transcriptId: z.string(),
  userId: z.number(),
  expiresAt: z.string().optional(),
  createdAt: z.string(),
});

export const insertSharedLinkSchema = sharedLinkSchema.omit({
  id: true,
  createdAt: true,
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SharedLink = z.infer<typeof sharedLinkSchema>;
export type InsertSharedLink = z.infer<typeof insertSharedLinkSchema>;

// Transcript schemas for API responses (loaded from CSV)
export const transcriptSchema = z.object({
  id: z.string(),
  sessionID: z.string(),
  projectID: z.string(),
  environmentID: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  endedAt: z.string().optional(),
  recordingURL: z.string().optional(),
  properties: z.array(z.any()).optional(),
  evaluations: z.array(z.any()).optional(),
});

export const messageSchema = z.object({
  transcriptID: z.string(),
  sessionID: z.string(),
  role: z.enum(["user", "ai"]),
  message: z.string(),
  logCreatedAt: z.string(),
});

export type Transcript = z.infer<typeof transcriptSchema>;
export type Message = z.infer<typeof messageSchema>;

// Legacy types for backward compatibility
export const transcriptMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.string(),
});

export type TranscriptMessage = z.infer<typeof transcriptMessageSchema>;

// Knowledge Base Types
export const knowledgeBaseFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number(),
  uploadedAt: z.string(),
  status: z.enum(["active", "inactive"]),
});

export const insertKnowledgeBaseFileSchema = knowledgeBaseFileSchema.omit({
  id: true,
  uploadedAt: true,
  status: true,
});

export type KnowledgeBaseFile = z.infer<typeof knowledgeBaseFileSchema>;
export type InsertKnowledgeBaseFile = z.infer<typeof insertKnowledgeBaseFileSchema>;

// Project Configuration and Credit Management
export const projectConfigSchema = z.object({
  project_id: z.string(),
  budget: z.number(),
  credits_used: z.number(),
  start_date: z.string(),
  vf_api_key: z.string().optional(),
  ga4_measurement_id: z.string().optional(), // GA4 Measurement ID (G-XXXXXXXXXX) for tracking
});

export const creditOperationSchema = z.object({
  project_id: z.string(),
  credits: z.number(),
});

export type ProjectConfig = z.infer<typeof projectConfigSchema>;
export type CreditOperation = z.infer<typeof creditOperationSchema>;

// Plan Types
export const planSchema = z.object({
  id: z.string(),
  name: z.string(),
  tier: z.number(), // 0 = free, 1 = starter, 2 = pro, 3 = enterprise
  initialBalance: z.number(), // Initial OpenAI balance in USD
  voiceflowCredits: z.number(), // Initial Voiceflow credits
  price: z.number(), // Monthly price in USD
});

export type Plan = z.infer<typeof planSchema>;

// Cost Tab Types (from VoiceflowBilling)
// Credit Accounts - Note: Credits are represented in dollars. 10,000 tokens = $60, so 1 token = $0.006
export const creditAccountSchema = z.object({
  id: z.string(),
  userId: z.string(),
  planId: z.string().optional(), // Plan ID associated with this account
  creditLimit: z.string(), // Maximum credits ($) allowed as string for precision
  creditsUsed: z.string(), // Total credits ($) consumed as string for precision
  voiceflowCredits: z.string().optional(), // Voiceflow credits (separate from balance, purchased explicitly)
  voiceflowCreditsUsed: z.string().optional(), // Voiceflow credits used
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

export const insertCreditAccountSchema = creditAccountSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreditAccount = z.infer<typeof creditAccountSchema>;
export type InsertCreditAccount = z.infer<typeof insertCreditAccountSchema>;

// Transactions (Credit Purchases and Deductions)
export const transactionSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  type: z.string(), // 'purchase' | 'deduction'
  amount: z.string(), // Amount in dollars (credits) as string for precision
  description: z.string(),
  stripePaymentIntentId: z.string().nullable(),
  status: z.string(), // 'pending' | 'completed' | 'failed'
  createdAt: z.union([z.string(), z.date()]),
});

export const insertTransactionSchema = transactionSchema.omit({
  id: true,
  createdAt: true,
});

export type Transaction = z.infer<typeof transactionSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// Usage Records
export const usageRecordSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  amount: z.string(), // Amount in dollars (credits) as string for precision
  tokens: z.number().optional(), // Token count for reference (optional)
  category: z.string(), // 'api_calls' | 'storage' | 'compute' | 'bandwidth'
  description: z.string(),
  metadata: z.string().optional(), // JSON string for additional data
  createdAt: z.union([z.string(), z.date()]),
});

export const insertUsageRecordSchema = usageRecordSchema.omit({
  id: true,
  createdAt: true,
});

export type UsageRecord = z.infer<typeof usageRecordSchema>;
export type InsertUsageRecord = z.infer<typeof insertUsageRecordSchema>;

// AI Analysis schemas
export const aiAnalysisSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  analysisDate: z.string(),
  conversionRate: z.number(),
  averageSentiment: z.number(), // -1 to 1 scale
  totalTranscripts: z.number(),
  reportUrl: z.string().optional(),
  createdAt: z.union([z.string(), z.date()]),
});

export const aiKeywordSchema = z.object({
  id: z.string(),
  analysisId: z.string(),
  keyword: z.string(),
  frequency: z.number(),
  relevanceScore: z.number(), // 0-1 scale
  category: z.string().optional(),
});

export const aiKeyphraseSchema = z.object({
  id: z.string(),
  analysisId: z.string(),
  keyphrase: z.string(),
  frequency: z.number(),
  relevanceScore: z.number(), // 0-1 scale
  context: z.string().optional(),
});

export const insertAiAnalysisSchema = aiAnalysisSchema.omit({
  id: true,
  createdAt: true,
});

export const insertAiKeywordSchema = aiKeywordSchema.omit({
  id: true,
});

export const insertAiKeyphraseSchema = aiKeyphraseSchema.omit({
  id: true,
});

export type AiAnalysis = z.infer<typeof aiAnalysisSchema>;
export type InsertAiAnalysis = z.infer<typeof insertAiAnalysisSchema>;
export type AiKeyword = z.infer<typeof aiKeywordSchema>;
export type InsertAiKeyword = z.infer<typeof insertAiKeywordSchema>;
export type AiKeyphrase = z.infer<typeof aiKeyphraseSchema>;
export type InsertAiKeyphrase = z.infer<typeof insertAiKeyphraseSchema>;

// Product schemas for RAG system
export const productSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  vf_api_key: z.string(),
  name: z.string(),
  description: z.string(),
  image_url: z.string(),
  product_url: z.string(),
  tags: z.string(),
  embedding: z.array(z.number()).optional(),
  created_at: z.union([z.string(), z.date()]),
});

export const insertProductSchema = productSchema.omit({
  id: true,
  created_at: true,
});

export type Product = z.infer<typeof productSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;

// User balance for products (scoped by projectId and vf_api_key)
export const userBalanceSchema = z.object({
  projectId: z.string(),
  vf_api_key: z.string(),
  balance_usd: z.number(),
  created_at: z.union([z.string(), z.date()]),
});

export type UserBalance = z.infer<typeof userBalanceSchema>;

// GTM (Google Tag Manager) Integration Schemas
export const gtmCredentialsSchema = z.object({
  id: z.string(),
  projectId: z.string(), // Links to project_configs.project_id
  accountId: z.string(), // GTM Account ID
  containerId: z.string(), // GTM Container ID
  accessToken: z.string().optional(), // OAuth access token (encrypted in DB) - optional if using service account
  refreshToken: z.string().optional(), // OAuth refresh token (encrypted in DB) - optional if using service account
  serviceAccountKey: z.string().optional(), // Service account JSON key (encrypted in DB) - alternative to OAuth
  authType: z.enum(["oauth", "service_account"]).default("oauth"), // Authentication method
  expiresAt: z.union([z.string(), z.date()]).optional(), // Token expiration (only for OAuth)
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

export const insertGtmCredentialsSchema = gtmCredentialsSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type GtmCredentials = z.infer<typeof gtmCredentialsSchema>;
export type InsertGtmCredentials = z.infer<typeof insertGtmCredentialsSchema>;

// Google Analytics (GA4) Integration Schemas
export const ga4CredentialsSchema = z.object({
  id: z.string(),
  projectId: z.string(), // Links to project_configs.project_id
  propertyId: z.string(), // GA4 Property ID (format: properties/123456789)
  accessToken: z.string().optional(), // OAuth access token (encrypted in DB) - optional if using service account
  refreshToken: z.string().optional(), // OAuth refresh token (encrypted in DB) - optional if using service account
  serviceAccountKey: z.string().optional(), // Service account JSON key (encrypted in DB) - alternative to OAuth
  authType: z.enum(["oauth", "service_account"]).default("oauth"), // Authentication method
  expiresAt: z.union([z.string(), z.date()]).optional(), // Token expiration (only for OAuth)
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

export const insertGa4CredentialsSchema = ga4CredentialsSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Ga4Credentials = z.infer<typeof ga4CredentialsSchema>;
export type InsertGa4Credentials = z.infer<typeof insertGa4CredentialsSchema>;

// GTM Analytics Data - Time Series
export const gtmAnalyticsDataSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  date: z.string(), // ISO date string (YYYY-MM-DD)
  pageViews: z.number().default(0),
  sessions: z.number().default(0),
  users: z.number().default(0),
  clicks: z.number().default(0),
  conversions: z.number().default(0),
  createdAt: z.union([z.string(), z.date()]),
});

export const insertGtmAnalyticsDataSchema = gtmAnalyticsDataSchema.omit({
  id: true,
  createdAt: true,
});

export type GtmAnalyticsData = z.infer<typeof gtmAnalyticsDataSchema>;
export type InsertGtmAnalyticsData = z.infer<typeof insertGtmAnalyticsDataSchema>;

// GTM Traffic Sources
export const gtmTrafficSourceSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  source: z.string(),
  sessions: z.number(),
  percentage: z.number(),
  date: z.string(), // ISO date string for time-based queries
  createdAt: z.union([z.string(), z.date()]),
});

export const insertGtmTrafficSourceSchema = gtmTrafficSourceSchema.omit({
  id: true,
  createdAt: true,
});

export type GtmTrafficSource = z.infer<typeof gtmTrafficSourceSchema>;
export type InsertGtmTrafficSource = z.infer<typeof insertGtmTrafficSourceSchema>;

// GTM Page Views
export const gtmPageViewSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  page: z.string(),
  views: z.number(),
  percentage: z.number(),
  date: z.string(),
  createdAt: z.union([z.string(), z.date()]),
});

export const insertGtmPageViewSchema = gtmPageViewSchema.omit({
  id: true,
  createdAt: true,
});

export type GtmPageView = z.infer<typeof gtmPageViewSchema>;
export type InsertGtmPageView = z.infer<typeof insertGtmPageViewSchema>;

// GTM Referrers
export const gtmReferrerSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  source: z.string(),
  visits: z.number(),
  percentage: z.number(),
  date: z.string(),
  createdAt: z.union([z.string(), z.date()]),
});

export const insertGtmReferrerSchema = gtmReferrerSchema.omit({
  id: true,
  createdAt: true,
});

export type GtmReferrer = z.infer<typeof gtmReferrerSchema>;
export type InsertGtmReferrer = z.infer<typeof insertGtmReferrerSchema>;

// GTM Keywords
export const gtmKeywordSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  keyword: z.string(),
  searches: z.number(),
  percentage: z.number(),
  date: z.string(),
  createdAt: z.union([z.string(), z.date()]),
});

export const insertGtmKeywordSchema = gtmKeywordSchema.omit({
  id: true,
  createdAt: true,
});

export type GtmKeyword = z.infer<typeof gtmKeywordSchema>;
export type InsertGtmKeyword = z.infer<typeof insertGtmKeywordSchema>;

// GTM Campaigns
export const gtmCampaignSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  campaign: z.string(),
  clicks: z.number(),
  conversions: z.number(),
  date: z.string(),
  createdAt: z.union([z.string(), z.date()]),
});

export const insertGtmCampaignSchema = gtmCampaignSchema.omit({
  id: true,
  createdAt: true,
});

export type GtmCampaign = z.infer<typeof gtmCampaignSchema>;
export type InsertGtmCampaign = z.infer<typeof insertGtmCampaignSchema>;

// Shopify Integration Schemas
export const shopifyCredentialsSchema = z.object({
  id: z.string(),
  projectId: z.string(), // Links to project_configs.project_id
  shopDomain: z.string(), // Shopify shop domain (e.g., "mystore.myshopify.com")
  storefrontAccessToken: z.string(), // Storefront API access token (public or private)
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

export const insertShopifyCredentialsSchema = shopifyCredentialsSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ShopifyCredentials = z.infer<typeof shopifyCredentialsSchema>;
export type InsertShopifyCredentials = z.infer<typeof insertShopifyCredentialsSchema>;

// WordPress/WooCommerce Integration Schemas
export const wordpressCredentialsSchema = z.object({
  id: z.string(),
  projectId: z.string(), // Links to project_configs.project_id
  siteUrl: z.string(), // WordPress site URL (e.g., "https://example.com")
  consumerKey: z.string(), // WooCommerce Consumer Key
  consumerSecret: z.string(), // WooCommerce Consumer Secret
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

export const insertWordpressCredentialsSchema = wordpressCredentialsSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type WordPressCredentials = z.infer<typeof wordpressCredentialsSchema>;
export type InsertWordPressCredentials = z.infer<typeof insertWordpressCredentialsSchema>;

// BigCommerce Integration Schemas
export const bigcommerceCredentialsSchema = z.object({
  id: z.string(),
  projectId: z.string(), // Links to project_configs.project_id
  storeHash: z.string(), // BigCommerce store hash (e.g., "abc123" from store URL abc123.mybigcommerce.com)
  accessToken: z.string(), // BigCommerce API access token
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

export const insertBigcommerceCredentialsSchema = bigcommerceCredentialsSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type BigCommerceCredentials = z.infer<typeof bigcommerceCredentialsSchema>;
export type InsertBigCommerceCredentials = z.infer<typeof insertBigcommerceCredentialsSchema>;

// Squarespace Integration Schemas
export const squarespaceCredentialsSchema = z.object({
  id: z.string(),
  projectId: z.string(), // Links to project_configs.project_id
  siteUrl: z.string(), // Squarespace site URL (e.g., "https://example.squarespace.com")
  apiKey: z.string(), // Squarespace API key
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

export const insertSquarespaceCredentialsSchema = squarespaceCredentialsSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SquarespaceCredentials = z.infer<typeof squarespaceCredentialsSchema>;
export type InsertSquarespaceCredentials = z.infer<typeof insertSquarespaceCredentialsSchema>;

// Wix Integration Schemas
export const wixCredentialsSchema = z.object({
  id: z.string(),
  projectId: z.string(), // Links to project_configs.project_id
  siteId: z.string(), // Wix site ID
  accessToken: z.string(), // Wix OAuth access token
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

export const insertWixCredentialsSchema = wixCredentialsSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type WixCredentials = z.infer<typeof wixCredentialsSchema>;
export type InsertWixCredentials = z.infer<typeof insertWixCredentialsSchema>;

// Webflow Integration Schemas
export const webflowCredentialsSchema = z.object({
  id: z.string(),
  projectId: z.string(), // Links to project_configs.project_id
  siteId: z.string(), // Webflow site ID
  accessToken: z.string(), // Webflow API access token
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

export const insertWebflowCredentialsSchema = webflowCredentialsSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type WebflowCredentials = z.infer<typeof webflowCredentialsSchema>;
export type InsertWebflowCredentials = z.infer<typeof insertWebflowCredentialsSchema>;
