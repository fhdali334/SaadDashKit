import {
  type KnowledgeBaseFile,
  type InsertKnowledgeBaseFile,
  type ProjectConfig,
  type CreditAccount,
  type InsertCreditAccount,
  type Transaction,
  type InsertTransaction,
  type UsageRecord,
  type InsertUsageRecord,
  type AiAnalysis,
  type InsertAiAnalysis,
  type AiKeyword,
  type InsertAiKeyword,
  type AiKeyphrase,
  type InsertAiKeyphrase,
  type Product,
  type InsertProduct,
  type UserBalance,
  type GtmCredentials,
  type InsertGtmCredentials,
  type Ga4Credentials,
  type InsertGa4Credentials,
  type GtmAnalyticsData,
  type InsertGtmAnalyticsData,
  type GtmTrafficSource,
  type InsertGtmTrafficSource,
  type GtmPageView,
  type InsertGtmPageView,
  type GtmReferrer,
  type InsertGtmReferrer,
  type GtmKeyword,
  type InsertGtmKeyword,
  type GtmCampaign,
  type InsertGtmCampaign,
  type ShopifyCredentials,
  type InsertShopifyCredentials,
  type WordPressCredentials,
  type InsertWordPressCredentials,
  type BigCommerceCredentials,
  type InsertBigCommerceCredentials,
  type SquarespaceCredentials,
  type InsertSquarespaceCredentials,
  type WixCredentials,
  type InsertWixCredentials,
  type WebflowCredentials,
  type InsertWebflowCredentials
} from "@shared/schema";
import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

export interface IStorage {
  // Knowledge Base
  getKnowledgeBaseFiles(): Promise<KnowledgeBaseFile[]>;
  getKnowledgeBaseFile(id: string): Promise<KnowledgeBaseFile | undefined>;
  createKnowledgeBaseFile(file: InsertKnowledgeBaseFile): Promise<KnowledgeBaseFile>;
  deleteKnowledgeBaseFile(id: string): Promise<boolean>;
  
  // Credit/Budget Management (old system)
  getProjectConfig(projectId: string): Promise<ProjectConfig>;
  updateProjectConfig(config: ProjectConfig): Promise<ProjectConfig>;
  addCredits(projectId: string, credits: number): Promise<ProjectConfig>;
  resetProject(projectId: string): Promise<void>;
  
  // Cost Tab - Credit Account methods
  getCreditAccount(accountId: string): Promise<CreditAccount | undefined>;
  getDefaultCreditAccount(): Promise<CreditAccount>;
  updateCreditsUsed(accountId: string, newCreditsUsed: string): Promise<CreditAccount>;
  updateCreditLimit(accountId: string, newCreditLimit: string): Promise<CreditAccount>;
  updatePlanId(accountId: string, planId: string): Promise<CreditAccount>;
  updateVoiceflowCredits(accountId: string, newVoiceflowCredits: string): Promise<CreditAccount>;
  updateVoiceflowCreditsUsed(accountId: string, newVoiceflowCreditsUsed: string): Promise<CreditAccount>;
  resetCreditAccount(accountId: string): Promise<CreditAccount>;
  
  // Cost Tab - Transaction methods
  getAllTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // Cost Tab - Usage Record methods
  getAllUsageRecords(): Promise<UsageRecord[]>;
  createUsageRecord(usageRecord: InsertUsageRecord): Promise<UsageRecord>;
  
  // AI Analysis methods
  createAiAnalysis(analysis: InsertAiAnalysis): Promise<AiAnalysis>;
  getAiAnalyses(projectId: string): Promise<AiAnalysis[]>;
  getAiAnalysis(analysisId: string): Promise<AiAnalysis | undefined>;
  createAiKeyword(keyword: InsertAiKeyword): Promise<AiKeyword>;
  getAiKeywords(analysisId: string): Promise<AiKeyword[]>;
  createAiKeyphrase(keyphrase: InsertAiKeyphrase): Promise<AiKeyphrase>;
  getAiKeyphrases(analysisId: string): Promise<AiKeyphrase[]>;
  
  // Product methods (scoped by projectId and vf_api_key)
  getProducts(projectId: string, vf_api_key: string): Promise<Product[]>;
  getProduct(productId: string, projectId: string, vf_api_key: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  deleteProduct(productId: string, projectId: string, vf_api_key: string): Promise<boolean>;
  getUserBalance(projectId: string, vf_api_key: string): Promise<UserBalance>;
  updateUserBalance(projectId: string, vf_api_key: string, balance: number): Promise<UserBalance>;
  
  // GTM Credentials methods
  getGtmCredentials(projectId: string): Promise<GtmCredentials | undefined>;
  createOrUpdateGtmCredentials(credentials: InsertGtmCredentials): Promise<GtmCredentials>;
  deleteGtmCredentials(projectId: string): Promise<boolean>;
  
  // GA4 Credentials methods
  getGa4Credentials(projectId: string): Promise<Ga4Credentials | undefined>;
  createOrUpdateGa4Credentials(credentials: InsertGa4Credentials): Promise<Ga4Credentials>;
  deleteGa4Credentials(projectId: string): Promise<boolean>;
  
  // GTM Analytics Data methods
  getGtmAnalyticsData(projectId: string, startDate?: string, endDate?: string): Promise<GtmAnalyticsData[]>;
  upsertGtmAnalyticsData(data: InsertGtmAnalyticsData): Promise<GtmAnalyticsData>;
  
  // GTM Traffic Sources methods
  getGtmTrafficSources(projectId: string, date?: string): Promise<GtmTrafficSource[]>;
  upsertGtmTrafficSources(sources: InsertGtmTrafficSource[]): Promise<GtmTrafficSource[]>;
  
  // GTM Page Views methods
  getGtmPageViews(projectId: string, date?: string, limit?: number): Promise<GtmPageView[]>;
  upsertGtmPageViews(views: InsertGtmPageView[]): Promise<GtmPageView[]>;
  
  // GTM Referrers methods
  getGtmReferrers(projectId: string, date?: string, limit?: number): Promise<GtmReferrer[]>;
  upsertGtmReferrers(referrers: InsertGtmReferrer[]): Promise<GtmReferrer[]>;
  
  // GTM Keywords methods
  getGtmKeywords(projectId: string, date?: string, limit?: number): Promise<GtmKeyword[]>;
  upsertGtmKeywords(keywords: InsertGtmKeyword[]): Promise<GtmKeyword[]>;
  
  // GTM Campaigns methods
  getGtmCampaigns(projectId: string, date?: string, limit?: number): Promise<GtmCampaign[]>;
  upsertGtmCampaigns(campaigns: InsertGtmCampaign[]): Promise<GtmCampaign[]>;
  
  // Shopify Credentials methods
  getShopifyCredentials(projectId: string): Promise<ShopifyCredentials | undefined>;
  createOrUpdateShopifyCredentials(credentials: InsertShopifyCredentials): Promise<ShopifyCredentials>;
  deleteShopifyCredentials(projectId: string): Promise<boolean>;
  
  // WordPress Credentials methods
  getWordPressCredentials(projectId: string): Promise<WordPressCredentials | undefined>;
  createOrUpdateWordPressCredentials(credentials: InsertWordPressCredentials): Promise<WordPressCredentials>;
  deleteWordPressCredentials(projectId: string): Promise<boolean>;
  
  // BigCommerce Credentials methods
  getBigCommerceCredentials(projectId: string): Promise<BigCommerceCredentials | undefined>;
  createOrUpdateBigCommerceCredentials(credentials: InsertBigCommerceCredentials): Promise<BigCommerceCredentials>;
  deleteBigCommerceCredentials(projectId: string): Promise<boolean>;
  
  // Squarespace Credentials methods
  getSquarespaceCredentials(projectId: string): Promise<SquarespaceCredentials | undefined>;
  createOrUpdateSquarespaceCredentials(credentials: InsertSquarespaceCredentials): Promise<SquarespaceCredentials>;
  deleteSquarespaceCredentials(projectId: string): Promise<boolean>;
  
  // Wix Credentials methods
  getWixCredentials(projectId: string): Promise<WixCredentials | undefined>;
  createOrUpdateWixCredentials(credentials: InsertWixCredentials): Promise<WixCredentials>;
  deleteWixCredentials(projectId: string): Promise<boolean>;
  
  // Webflow Credentials methods
  getWebflowCredentials(projectId: string): Promise<WebflowCredentials | undefined>;
  createOrUpdateWebflowCredentials(credentials: InsertWebflowCredentials): Promise<WebflowCredentials>;
  deleteWebflowCredentials(projectId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private knowledgeBaseFiles: Map<string, KnowledgeBaseFile>;
  private projectConfigs: Map<string, ProjectConfig>;
  private creditAccounts: Map<string, CreditAccount>;
  private transactions: Map<string, Transaction>;
  private usageRecords: Map<string, UsageRecord>;
  private aiAnalyses: Map<string, AiAnalysis>;
  private aiKeywords: Map<string, AiKeyword>;
  private aiKeyphrases: Map<string, AiKeyphrase>;
  private products: Map<string, Product>;
  private userBalances: Map<string, UserBalance>;
  private gtmCredentials: Map<string, GtmCredentials>;
  private ga4Credentials: Map<string, Ga4Credentials>;
  private gtmAnalyticsData: Map<string, GtmAnalyticsData>;
  private gtmTrafficSources: Map<string, GtmTrafficSource>;
  private gtmPageViews: Map<string, GtmPageView>;
  private gtmReferrers: Map<string, GtmReferrer>;
  private gtmKeywords: Map<string, GtmKeyword>;
  private gtmCampaigns: Map<string, GtmCampaign>;
  private shopifyCredentials: Map<string, ShopifyCredentials>;
  private wordpressCredentials: Map<string, WordPressCredentials>;
  private bigcommerceCredentials: Map<string, BigCommerceCredentials>;
  private squarespaceCredentials: Map<string, SquarespaceCredentials>;
  private wixCredentials: Map<string, WixCredentials>;
  private webflowCredentials: Map<string, WebflowCredentials>;
  private defaultAccountId: string;
  private aiDataPath: string;
  private productsDataPath: string;
  private configDataPath: string;
  private gtmDataPath: string;

  constructor() {
    this.knowledgeBaseFiles = new Map();
    this.projectConfigs = new Map();
    this.creditAccounts = new Map();
    this.transactions = new Map();
    this.usageRecords = new Map();
    this.aiAnalyses = new Map();
    this.aiKeywords = new Map();
    this.aiKeyphrases = new Map();
    this.products = new Map();
    this.userBalances = new Map();
    this.gtmCredentials = new Map();
    this.ga4Credentials = new Map();
    this.gtmAnalyticsData = new Map();
    this.gtmTrafficSources = new Map();
    this.gtmPageViews = new Map();
    this.gtmReferrers = new Map();
    this.gtmKeywords = new Map();
    this.gtmCampaigns = new Map();
    this.shopifyCredentials = new Map();
    this.wordpressCredentials = new Map();
    this.bigcommerceCredentials = new Map();
    this.squarespaceCredentials = new Map();
    this.wixCredentials = new Map();
    this.webflowCredentials = new Map();
    this.defaultAccountId = randomUUID();

    // Ensure data directories exist
    this.aiDataPath = join(process.cwd(), 'server', 'data', 'ai-analysis');
    this.productsDataPath = join(process.cwd(), 'server', 'data', 'products');
    this.configDataPath = join(process.cwd(), 'server', 'data', 'configs');
    this.gtmDataPath = join(process.cwd(), 'server', 'data', 'gtm');
    
    // Ensure GTM data directory exists
    if (!existsSync(this.gtmDataPath)) {
      mkdirSync(this.gtmDataPath, { recursive: true });
    }
    if (!existsSync(this.aiDataPath)) {
      mkdirSync(this.aiDataPath, { recursive: true });
    }
    if (!existsSync(this.productsDataPath)) {
      mkdirSync(this.productsDataPath, { recursive: true });
    }
    if (!existsSync(this.configDataPath)) {
      mkdirSync(this.configDataPath, { recursive: true });
    }

    this.initializeCostDemoData();
    this.loadAiAnalysisData();
    this.loadProductsData();
    this.loadProjectConfigs();
    this.loadShopifyCredentials();
    this.loadWordPressCredentials();
    this.loadBigCommerceCredentials();
    this.loadSquarespaceCredentials();
    this.loadWixCredentials();
    this.loadWebflowCredentials();
  }

  private loadAiAnalysisData() {
    try {
      // Load analyses
      const analysesPath = join(this.aiDataPath, 'analyses.json');
      if (existsSync(analysesPath)) {
        const analyses = JSON.parse(readFileSync(analysesPath, 'utf-8')) as AiAnalysis[];
        analyses.forEach(analysis => {
          this.aiAnalyses.set(analysis.id, analysis);
        });
      }

      // Load keywords
      const keywordsPath = join(this.aiDataPath, 'keywords.json');
      if (existsSync(keywordsPath)) {
        const keywords = JSON.parse(readFileSync(keywordsPath, 'utf-8')) as AiKeyword[];
        keywords.forEach(keyword => {
          this.aiKeywords.set(keyword.id, keyword);
        });
      }

      // Load keyphrases
      const keyphrasesPath = join(this.aiDataPath, 'keyphrases.json');
      if (existsSync(keyphrasesPath)) {
        const keyphrases = JSON.parse(readFileSync(keyphrasesPath, 'utf-8')) as AiKeyphrase[];
        keyphrases.forEach(keyphrase => {
          this.aiKeyphrases.set(keyphrase.id, keyphrase);
        });
      }
    } catch (error) {
      console.error('[AI Storage] Error loading persistent data:', error);
    }
  }

  private saveAiAnalysisData() {
    try {
      // Save analyses
      const analysesPath = join(this.aiDataPath, 'analyses.json');
      const analyses = Array.from(this.aiAnalyses.values());
      writeFileSync(analysesPath, JSON.stringify(analyses, null, 2));

      // Save keywords
      const keywordsPath = join(this.aiDataPath, 'keywords.json');
      const keywords = Array.from(this.aiKeywords.values());
      writeFileSync(keywordsPath, JSON.stringify(keywords, null, 2));

      // Save keyphrases
      const keyphrasesPath = join(this.aiDataPath, 'keyphrases.json');
      const keyphrases = Array.from(this.aiKeyphrases.values());
      writeFileSync(keyphrasesPath, JSON.stringify(keyphrases, null, 2));
    } catch (error) {
      console.error('[AI Storage] Error saving persistent data:', error);
    }
  }
  
  private initializeCostDemoData() {
    const now = new Date();
    
    // Create demo credit account with some usage
    const account: CreditAccount = {
      id: this.defaultAccountId,
      userId: "demo-user",
      creditLimit: "100.00",
      creditsUsed: "45.50",
      voiceflowCredits: "5000", // Separate Voiceflow credits
      voiceflowCreditsUsed: "0",
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    };
    this.creditAccounts.set(this.defaultAccountId, account);

    // Create demo transactions
    const demoTransactions: Transaction[] = [
      {
        id: randomUUID(),
        accountId: this.defaultAccountId,
        type: "purchase",
        amount: "100.00",
        description: "Initial Credit Top-up",
        stripePaymentIntentId: null,
        status: "completed",
        createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        accountId: this.defaultAccountId,
        type: "deduction",
        amount: "15.50",
        description: "API Usage - Week 1",
        stripePaymentIntentId: null,
        status: "completed",
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        accountId: this.defaultAccountId,
        type: "deduction",
        amount: "18.00",
        description: "API Usage - Week 2",
        stripePaymentIntentId: null,
        status: "completed",
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        accountId: this.defaultAccountId,
        type: "deduction",
        amount: "12.00",
        description: "API Usage - Week 3",
        stripePaymentIntentId: null,
        status: "completed",
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    ];

    demoTransactions.forEach(t => this.transactions.set(t.id, t));

    // Create demo usage records
    const categories = ['api_calls', 'storage', 'compute', 'bandwidth'] as const;
    for (let i = 0; i < 7; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const numRecords = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numRecords; j++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const amount = (Math.random() * 3 + 1).toFixed(2);
        const tokens = Math.floor(parseFloat(amount) / 0.006);
        
        const record: UsageRecord = {
          id: randomUUID(),
          accountId: this.defaultAccountId,
          amount,
          tokens,
          category,
          description: `${category.replace('_', ' ').toUpperCase()} usage`,
          metadata: JSON.stringify({ date: date.toISOString() }),
          createdAt: date,
        };
        
        this.usageRecords.set(record.id, record);
      }
    }
  }

  async getKnowledgeBaseFiles(): Promise<KnowledgeBaseFile[]> {
    return Array.from(this.knowledgeBaseFiles.values());
  }

  async getKnowledgeBaseFile(id: string): Promise<KnowledgeBaseFile | undefined> {
    return this.knowledgeBaseFiles.get(id);
  }

  async createKnowledgeBaseFile(insertFile: InsertKnowledgeBaseFile): Promise<KnowledgeBaseFile> {
    const id = randomUUID();
    const file: KnowledgeBaseFile = {
      ...insertFile,
      id,
      uploadedAt: new Date().toISOString(),
      status: "active",
    };
    this.knowledgeBaseFiles.set(id, file);
    return file;
  }

  async deleteKnowledgeBaseFile(id: string): Promise<boolean> {
    return this.knowledgeBaseFiles.delete(id);
  }

  private loadProjectConfigs() {
    try {
      const configsPath = join(this.configDataPath, 'project-configs.json');
      if (existsSync(configsPath)) {
        const configs = JSON.parse(readFileSync(configsPath, 'utf-8')) as ProjectConfig[];
        configs.forEach(config => {
          this.projectConfigs.set(config.project_id, config);
        });
      }
    } catch (error) {
      console.error('[Config Storage] Error loading project configs:', error);
    }
  }

  private saveProjectConfigs() {
    try {
      const configsPath = join(this.configDataPath, 'project-configs.json');
      const configs = Array.from(this.projectConfigs.values());
      writeFileSync(configsPath, JSON.stringify(configs, null, 2));
    } catch (error) {
      console.error('[Config Storage] Error saving project configs:', error);
    }
  }

  async getProjectConfig(projectId: string): Promise<ProjectConfig> {
    let config = this.projectConfigs.get(projectId);
    if (!config) {
      config = {
        project_id: projectId,
        budget: 60.0,
        credits_used: 0,
        start_date: new Date().toISOString(),
        vf_api_key: undefined,
        ga4_measurement_id: undefined,
      };
      this.projectConfigs.set(projectId, config);
      this.saveProjectConfigs();
    }
    return config;
  }

  async updateProjectConfig(config: ProjectConfig): Promise<ProjectConfig> {
    this.projectConfigs.set(config.project_id, config);
    this.saveProjectConfigs();
    return config;
  }

  async addCredits(projectId: string, credits: number): Promise<ProjectConfig> {
    const config = await this.getProjectConfig(projectId);
    config.credits_used += credits;
    this.projectConfigs.set(projectId, config);
    return config;
  }

  async resetProject(projectId: string): Promise<void> {
    const config = await this.getProjectConfig(projectId);
    config.credits_used = 0;
    config.start_date = new Date().toISOString();
    this.projectConfigs.set(projectId, config);
  }

  // Cost Tab - Credit Account methods
  async getCreditAccount(accountId: string): Promise<CreditAccount | undefined> {
    return this.creditAccounts.get(accountId);
  }

  async getDefaultCreditAccount(): Promise<CreditAccount> {
    const account = this.creditAccounts.get(this.defaultAccountId);
    if (!account) {
      throw new Error("Default credit account not found");
    }
    return account;
  }

  async updateCreditsUsed(accountId: string, newCreditsUsed: string): Promise<CreditAccount> {
    const account = this.creditAccounts.get(accountId);
    if (!account) {
      throw new Error(`Credit account ${accountId} not found`);
    }
    account.creditsUsed = newCreditsUsed;
    account.updatedAt = new Date();
    this.creditAccounts.set(accountId, account);
    return account;
  }

  async updateCreditLimit(accountId: string, newCreditLimit: string): Promise<CreditAccount> {
    const account = this.creditAccounts.get(accountId);
    if (!account) {
      throw new Error(`Credit account ${accountId} not found`);
    }
    account.creditLimit = newCreditLimit;
    account.updatedAt = new Date();
    this.creditAccounts.set(accountId, account);
    return account;
  }

  async updatePlanId(accountId: string, planId: string): Promise<CreditAccount> {
    const account = this.creditAccounts.get(accountId);
    if (!account) {
      throw new Error(`Credit account ${accountId} not found`);
    }
    account.planId = planId;
    account.updatedAt = new Date();
    this.creditAccounts.set(accountId, account);
    return account;
  }

  async updateVoiceflowCredits(accountId: string, newVoiceflowCredits: string): Promise<CreditAccount> {
    const account = this.creditAccounts.get(accountId);
    if (!account) {
      throw new Error(`Credit account ${accountId} not found`);
    }
    account.voiceflowCredits = newVoiceflowCredits;
    account.updatedAt = new Date();
    this.creditAccounts.set(accountId, account);
    return account;
  }

  async updateVoiceflowCreditsUsed(accountId: string, newVoiceflowCreditsUsed: string): Promise<CreditAccount> {
    const account = this.creditAccounts.get(accountId);
    if (!account) {
      throw new Error(`Credit account ${accountId} not found`);
    }
    account.voiceflowCreditsUsed = newVoiceflowCreditsUsed;
    account.updatedAt = new Date();
    this.creditAccounts.set(accountId, account);
    return account;
  }

  async resetCreditAccount(accountId: string): Promise<CreditAccount> {
    const account = this.creditAccounts.get(accountId);
    if (!account) {
      throw new Error(`Credit account ${accountId} not found`);
    }
    // Reset usage to 0 and set new period start (back to 30 days)
    account.creditsUsed = "0.00";
    account.createdAt = new Date();
    account.updatedAt = new Date();
    this.creditAccounts.set(accountId, account);
    return account;
  }

  // Cost Tab - Transaction methods
  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const transaction: Transaction = {
      id: randomUUID(),
      ...insertTransaction,
      createdAt: new Date(),
    };
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  // Cost Tab - Usage Record methods
  async getAllUsageRecords(): Promise<UsageRecord[]> {
    return Array.from(this.usageRecords.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createUsageRecord(insertRecord: InsertUsageRecord): Promise<UsageRecord> {
    const record: UsageRecord = {
      id: randomUUID(),
      ...insertRecord,
      createdAt: new Date(),
    };
    this.usageRecords.set(record.id, record);
    return record;
  }

  // AI Analysis methods
  async createAiAnalysis(insertAnalysis: InsertAiAnalysis): Promise<AiAnalysis> {
    const analysis: AiAnalysis = {
      id: randomUUID(),
      ...insertAnalysis,
      createdAt: new Date(),
    };
    this.aiAnalyses.set(analysis.id, analysis);
    this.saveAiAnalysisData();
    return analysis;
  }

  async getAiAnalyses(projectId: string): Promise<AiAnalysis[]> {
    return Array.from(this.aiAnalyses.values())
      .filter(a => a.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAiAnalysis(analysisId: string): Promise<AiAnalysis | undefined> {
    return this.aiAnalyses.get(analysisId);
  }

  async createAiKeyword(insertKeyword: InsertAiKeyword): Promise<AiKeyword> {
    const keyword: AiKeyword = {
      id: randomUUID(),
      ...insertKeyword,
    };
    this.aiKeywords.set(keyword.id, keyword);
    this.saveAiAnalysisData();
    return keyword;
  }

  async getAiKeywords(analysisId: string): Promise<AiKeyword[]> {
    return Array.from(this.aiKeywords.values())
      .filter(k => k.analysisId === analysisId)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  async createAiKeyphrase(insertKeyphrase: InsertAiKeyphrase): Promise<AiKeyphrase> {
    const keyphrase: AiKeyphrase = {
      id: randomUUID(),
      ...insertKeyphrase,
    };
    this.aiKeyphrases.set(keyphrase.id, keyphrase);
    this.saveAiAnalysisData();
    return keyphrase;
  }

  async getAiKeyphrases(analysisId: string): Promise<AiKeyphrase[]> {
    return Array.from(this.aiKeyphrases.values())
      .filter(k => k.analysisId === analysisId)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private loadProductsData() {
    try {
      const productsPath = join(this.productsDataPath, 'products.json');
      if (existsSync(productsPath)) {
        const products = JSON.parse(readFileSync(productsPath, 'utf-8')) as Product[];
        products.forEach(product => {
          // Use composite key: projectId + vf_api_key
          const key = `${product.projectId}:${product.vf_api_key}:${product.id}`;
          this.products.set(key, product);
        });
      }

      const balancesPath = join(this.productsDataPath, 'balances.json');
      if (existsSync(balancesPath)) {
        const balances = JSON.parse(readFileSync(balancesPath, 'utf-8')) as UserBalance[];
        balances.forEach(balance => {
          // Use composite key: projectId + vf_api_key
          const key = `${balance.projectId}:${balance.vf_api_key}`;
          this.userBalances.set(key, balance);
        });
      }
    } catch (error) {
      console.error('[Products Storage] Error loading products data:', error);
    }
  }

  private saveProductsData() {
    try {
      const productsPath = join(this.productsDataPath, 'products.json');
      const products = Array.from(this.products.values());
      writeFileSync(productsPath, JSON.stringify(products, null, 2));

      const balancesPath = join(this.productsDataPath, 'balances.json');
      const balances = Array.from(this.userBalances.values());
      writeFileSync(balancesPath, JSON.stringify(balances, null, 2));
    } catch (error) {
      console.error('[Products Storage] Error saving products data:', error);
    }
  }

  // Product methods (scoped by projectId and vf_api_key)
  async getProducts(projectId: string, vf_api_key: string): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(p => p.projectId === projectId && p.vf_api_key === vf_api_key)
      .sort((a, b) => {
        const dateA = typeof a.created_at === 'string' ? new Date(a.created_at) : a.created_at;
        const dateB = typeof b.created_at === 'string' ? new Date(b.created_at) : b.created_at;
        return dateB.getTime() - dateA.getTime();
      });
  }

  async getProduct(productId: string, projectId: string, vf_api_key: string): Promise<Product | undefined> {
    // Find product by ID and verify it belongs to this project/api key combo
    const product = Array.from(this.products.values()).find(
      p => p.id === productId && p.projectId === projectId && p.vf_api_key === vf_api_key
    );
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const product: Product = {
      id: randomUUID(),
      ...insertProduct,
      created_at: new Date(),
    };
    // Use composite key for storage
    const key = `${product.projectId}:${product.vf_api_key}:${product.id}`;
    this.products.set(key, product);
    this.saveProductsData();
    return product;
  }

  async deleteProduct(productId: string, projectId: string, vf_api_key: string): Promise<boolean> {
    const product = await this.getProduct(productId, projectId, vf_api_key);
    if (product) {
      const key = `${product.projectId}:${product.vf_api_key}:${product.id}`;
      this.products.delete(key);
      this.saveProductsData();
      return true;
    }
    return false;
  }

  async getUserBalance(projectId: string, vf_api_key: string): Promise<UserBalance> {
    const key = `${projectId}:${vf_api_key}`;
    let balance = this.userBalances.get(key);
    if (!balance) {
      balance = {
        projectId,
        vf_api_key,
        balance_usd: 100.00,
        created_at: new Date(),
      };
      this.userBalances.set(key, balance);
      this.saveProductsData();
    }
    return balance;
  }

  async updateUserBalance(projectId: string, vf_api_key: string, balance: number): Promise<UserBalance> {
    const userBalance = await this.getUserBalance(projectId, vf_api_key);
    userBalance.balance_usd = balance;
    const key = `${projectId}:${vf_api_key}`;
    this.userBalances.set(key, userBalance);
    this.saveProductsData();
    return userBalance;
  }

  // GTM Credentials methods
  async getGtmCredentials(projectId: string): Promise<GtmCredentials | undefined> {
    return Array.from(this.gtmCredentials.values()).find(c => c.projectId === projectId);
  }

  async createOrUpdateGtmCredentials(insertCredentials: InsertGtmCredentials): Promise<GtmCredentials> {
    const existing = await this.getGtmCredentials(insertCredentials.projectId);
    
    if (existing) {
      // Update existing
      const updated: GtmCredentials = {
        ...existing,
        ...insertCredentials,
        updatedAt: new Date(),
      };
      this.gtmCredentials.set(existing.id, updated);
      return updated;
    } else {
      // Create new
      const credentials: GtmCredentials = {
        id: randomUUID(),
        ...insertCredentials,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.gtmCredentials.set(credentials.id, credentials);
      return credentials;
    }
  }

  async deleteGtmCredentials(projectId: string): Promise<boolean> {
    const existing = await this.getGtmCredentials(projectId);
    if (existing) {
      return this.gtmCredentials.delete(existing.id);
    }
    return false;
  }

  // GA4 Credentials methods
  async getGa4Credentials(projectId: string): Promise<Ga4Credentials | undefined> {
    return Array.from(this.ga4Credentials.values()).find(c => c.projectId === projectId);
  }

  async createOrUpdateGa4Credentials(insertCredentials: InsertGa4Credentials): Promise<Ga4Credentials> {
    const existing = await this.getGa4Credentials(insertCredentials.projectId);
    
    if (existing) {
      // Update existing
      const updated: Ga4Credentials = {
        ...existing,
        ...insertCredentials,
        updatedAt: new Date(),
      };
      this.ga4Credentials.set(existing.id, updated);
      return updated;
    } else {
      // Create new
      const credentials: Ga4Credentials = {
        id: randomUUID(),
        ...insertCredentials,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.ga4Credentials.set(credentials.id, credentials);
      return credentials;
    }
  }

  async deleteGa4Credentials(projectId: string): Promise<boolean> {
    const existing = await this.getGa4Credentials(projectId);
    if (existing) {
      return this.ga4Credentials.delete(existing.id);
    }
    return false;
  }

  // GTM Analytics Data methods
  async getGtmAnalyticsData(projectId: string, startDate?: string, endDate?: string): Promise<GtmAnalyticsData[]> {
    let data = Array.from(this.gtmAnalyticsData.values())
      .filter(d => d.projectId === projectId);
    
    if (startDate) {
      data = data.filter(d => d.date >= startDate);
    }
    if (endDate) {
      data = data.filter(d => d.date <= endDate);
    }
    
    return data.sort((a, b) => a.date.localeCompare(b.date));
  }

  async upsertGtmAnalyticsData(insertData: InsertGtmAnalyticsData): Promise<GtmAnalyticsData> {
    const existing = Array.from(this.gtmAnalyticsData.values())
      .find(d => d.projectId === insertData.projectId && d.date === insertData.date);
    
    if (existing) {
      const updated: GtmAnalyticsData = {
        ...existing,
        ...insertData,
      };
      this.gtmAnalyticsData.set(existing.id, updated);
      return updated;
    } else {
      const data: GtmAnalyticsData = {
        id: randomUUID(),
        ...insertData,
        createdAt: new Date(),
      };
      this.gtmAnalyticsData.set(data.id, data);
      return data;
    }
  }

  // GTM Traffic Sources methods
  async getGtmTrafficSources(projectId: string, date?: string): Promise<GtmTrafficSource[]> {
    let sources = Array.from(this.gtmTrafficSources.values())
      .filter(s => s.projectId === projectId);
    
    if (date) {
      sources = sources.filter(s => s.date === date);
    }
    
    return sources.sort((a, b) => b.sessions - a.sessions);
  }

  async upsertGtmTrafficSources(sources: InsertGtmTrafficSource[]): Promise<GtmTrafficSource[]> {
    const results: GtmTrafficSource[] = [];
    
    for (const insertSource of sources) {
      const existing = Array.from(this.gtmTrafficSources.values())
        .find(s => s.projectId === insertSource.projectId && 
                   s.source === insertSource.source && 
                   s.date === insertSource.date);
      
      if (existing) {
        const updated: GtmTrafficSource = {
          ...existing,
          ...insertSource,
        };
        this.gtmTrafficSources.set(existing.id, updated);
        results.push(updated);
      } else {
        const source: GtmTrafficSource = {
          id: randomUUID(),
          ...insertSource,
          createdAt: new Date(),
        };
        this.gtmTrafficSources.set(source.id, source);
        results.push(source);
      }
    }
    
    return results;
  }

  // GTM Page Views methods
  async getGtmPageViews(projectId: string, date?: string, limit?: number): Promise<GtmPageView[]> {
    let views = Array.from(this.gtmPageViews.values())
      .filter(v => v.projectId === projectId);
    
    if (date) {
      views = views.filter(v => v.date === date);
    }
    
    views = views.sort((a, b) => b.views - a.views);
    
    if (limit) {
      views = views.slice(0, limit);
    }
    
    return views;
  }

  async upsertGtmPageViews(views: InsertGtmPageView[]): Promise<GtmPageView[]> {
    const results: GtmPageView[] = [];
    
    for (const insertView of views) {
      const existing = Array.from(this.gtmPageViews.values())
        .find(v => v.projectId === insertView.projectId && 
                   v.page === insertView.page && 
                   v.date === insertView.date);
      
      if (existing) {
        const updated: GtmPageView = {
          ...existing,
          ...insertView,
        };
        this.gtmPageViews.set(existing.id, updated);
        results.push(updated);
      } else {
        const view: GtmPageView = {
          id: randomUUID(),
          ...insertView,
          createdAt: new Date(),
        };
        this.gtmPageViews.set(view.id, view);
        results.push(view);
      }
    }
    
    return results;
  }

  // GTM Referrers methods
  async getGtmReferrers(projectId: string, date?: string, limit?: number): Promise<GtmReferrer[]> {
    let referrers = Array.from(this.gtmReferrers.values())
      .filter(r => r.projectId === projectId);
    
    if (date) {
      referrers = referrers.filter(r => r.date === date);
    }
    
    referrers = referrers.sort((a, b) => b.visits - a.visits);
    
    if (limit) {
      referrers = referrers.slice(0, limit);
    }
    
    return referrers;
  }

  async upsertGtmReferrers(referrers: InsertGtmReferrer[]): Promise<GtmReferrer[]> {
    const results: GtmReferrer[] = [];
    
    for (const insertReferrer of referrers) {
      const existing = Array.from(this.gtmReferrers.values())
        .find(r => r.projectId === insertReferrer.projectId && 
                   r.source === insertReferrer.source && 
                   r.date === insertReferrer.date);
      
      if (existing) {
        const updated: GtmReferrer = {
          ...existing,
          ...insertReferrer,
        };
        this.gtmReferrers.set(existing.id, updated);
        results.push(updated);
      } else {
        const referrer: GtmReferrer = {
          id: randomUUID(),
          ...insertReferrer,
          createdAt: new Date(),
        };
        this.gtmReferrers.set(referrer.id, referrer);
        results.push(referrer);
      }
    }
    
    return results;
  }

  // GTM Keywords methods
  async getGtmKeywords(projectId: string, date?: string, limit?: number): Promise<GtmKeyword[]> {
    let keywords = Array.from(this.gtmKeywords.values())
      .filter(k => k.projectId === projectId);
    
    if (date) {
      keywords = keywords.filter(k => k.date === date);
    }
    
    keywords = keywords.sort((a, b) => b.searches - a.searches);
    
    if (limit) {
      keywords = keywords.slice(0, limit);
    }
    
    return keywords;
  }

  async upsertGtmKeywords(keywords: InsertGtmKeyword[]): Promise<GtmKeyword[]> {
    const results: GtmKeyword[] = [];
    
    for (const insertKeyword of keywords) {
      const existing = Array.from(this.gtmKeywords.values())
        .find(k => k.projectId === insertKeyword.projectId && 
                   k.keyword === insertKeyword.keyword && 
                   k.date === insertKeyword.date);
      
      if (existing) {
        const updated: GtmKeyword = {
          ...existing,
          ...insertKeyword,
        };
        this.gtmKeywords.set(existing.id, updated);
        results.push(updated);
      } else {
        const keyword: GtmKeyword = {
          id: randomUUID(),
          ...insertKeyword,
          createdAt: new Date(),
        };
        this.gtmKeywords.set(keyword.id, keyword);
        results.push(keyword);
      }
    }
    
    return results;
  }

  // GTM Campaigns methods
  async getGtmCampaigns(projectId: string, date?: string, limit?: number): Promise<GtmCampaign[]> {
    let campaigns = Array.from(this.gtmCampaigns.values())
      .filter(c => c.projectId === projectId);
    
    if (date) {
      campaigns = campaigns.filter(c => c.date === date);
    }
    
    campaigns = campaigns.sort((a, b) => b.clicks - a.clicks);
    
    if (limit) {
      campaigns = campaigns.slice(0, limit);
    }
    
    return campaigns;
  }

  async upsertGtmCampaigns(campaigns: InsertGtmCampaign[]): Promise<GtmCampaign[]> {
    const results: GtmCampaign[] = [];
    
    for (const insertCampaign of campaigns) {
      const existing = Array.from(this.gtmCampaigns.values())
        .find(c => c.projectId === insertCampaign.projectId && 
                   c.campaign === insertCampaign.campaign && 
                   c.date === insertCampaign.date);
      
      if (existing) {
        const updated: GtmCampaign = {
          ...existing,
          ...insertCampaign,
        };
        this.gtmCampaigns.set(existing.id, updated);
        results.push(updated);
      } else {
        const campaign: GtmCampaign = {
          id: randomUUID(),
          ...insertCampaign,
          createdAt: new Date(),
        };
        this.gtmCampaigns.set(campaign.id, campaign);
        results.push(campaign);
      }
    }
    
    return results;
  }

  // Shopify Credentials methods
  async getShopifyCredentials(projectId: string): Promise<ShopifyCredentials | undefined> {
    return this.shopifyCredentials.get(projectId);
  }

  async createOrUpdateShopifyCredentials(credentials: InsertShopifyCredentials): Promise<ShopifyCredentials> {
    const existing = this.shopifyCredentials.get(credentials.projectId);
    
    let updatedCredentials: ShopifyCredentials;
    if (existing) {
      updatedCredentials = {
        ...existing,
        ...credentials,
        updatedAt: new Date(),
      };
      this.shopifyCredentials.set(credentials.projectId, updatedCredentials);
    } else {
      updatedCredentials = {
        id: randomUUID(),
        ...credentials,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.shopifyCredentials.set(credentials.projectId, updatedCredentials);
    }
    
    // Persist to disk
    this.saveShopifyCredentials();
    return updatedCredentials;
  }

  async deleteShopifyCredentials(projectId: string): Promise<boolean> {
    const deleted = this.shopifyCredentials.delete(projectId);
    if (deleted) {
      this.saveShopifyCredentials();
    }
    return deleted;
  }

  private loadShopifyCredentials() {
    try {
      const credentialsPath = join(this.configDataPath, 'shopify-credentials.json');
      if (existsSync(credentialsPath)) {
        const credentials = JSON.parse(readFileSync(credentialsPath, 'utf-8')) as ShopifyCredentials[];
        credentials.forEach(cred => {
          // Convert date strings back to Date objects if needed
          const credWithDates: ShopifyCredentials = {
            ...cred,
            createdAt: typeof cred.createdAt === 'string' ? cred.createdAt : cred.createdAt,
            updatedAt: typeof cred.updatedAt === 'string' ? cred.updatedAt : cred.updatedAt,
          };
          this.shopifyCredentials.set(cred.projectId, credWithDates);
        });
        console.log(`[Shopify Storage] Loaded ${credentials.length} Shopify credential(s) from disk`);
      }
    } catch (error) {
      console.error('[Shopify Storage] Error loading credentials:', error);
    }
  }

  private saveShopifyCredentials() {
    try {
      const credentialsPath = join(this.configDataPath, 'shopify-credentials.json');
      const credentials = Array.from(this.shopifyCredentials.values()).map(cred => ({
        ...cred,
        createdAt: cred.createdAt instanceof Date ? cred.createdAt.toISOString() : cred.createdAt,
        updatedAt: cred.updatedAt instanceof Date ? cred.updatedAt.toISOString() : cred.updatedAt,
      }));
      writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
    } catch (error) {
      console.error('[Shopify Storage] Error saving credentials:', error);
    }
  }

  // WordPress Credentials methods
  async getWordPressCredentials(projectId: string): Promise<WordPressCredentials | undefined> {
    return this.wordpressCredentials.get(projectId);
  }

  async createOrUpdateWordPressCredentials(credentials: InsertWordPressCredentials): Promise<WordPressCredentials> {
    const existing = this.wordpressCredentials.get(credentials.projectId);
    
    let updatedCredentials: WordPressCredentials;
    if (existing) {
      updatedCredentials = {
        ...existing,
        ...credentials,
        updatedAt: new Date(),
      };
      this.wordpressCredentials.set(credentials.projectId, updatedCredentials);
    } else {
      updatedCredentials = {
        id: randomUUID(),
        ...credentials,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.wordpressCredentials.set(credentials.projectId, updatedCredentials);
    }
    
    // Persist to disk
    this.saveWordPressCredentials();
    return updatedCredentials;
  }

  async deleteWordPressCredentials(projectId: string): Promise<boolean> {
    const deleted = this.wordpressCredentials.delete(projectId);
    if (deleted) {
      this.saveWordPressCredentials();
    }
    return deleted;
  }

  private loadWordPressCredentials() {
    try {
      const credentialsPath = join(this.configDataPath, 'wordpress-credentials.json');
      if (existsSync(credentialsPath)) {
        const credentials = JSON.parse(readFileSync(credentialsPath, 'utf-8')) as WordPressCredentials[];
        credentials.forEach(cred => {
          const credWithDates: WordPressCredentials = {
            ...cred,
            createdAt: typeof cred.createdAt === 'string' ? cred.createdAt : cred.createdAt,
            updatedAt: typeof cred.updatedAt === 'string' ? cred.updatedAt : cred.updatedAt,
          };
          this.wordpressCredentials.set(cred.projectId, credWithDates);
        });
        console.log(`[WordPress Storage] Loaded ${credentials.length} WordPress credential(s) from disk`);
      }
    } catch (error) {
      console.error('[WordPress Storage] Error loading credentials:', error);
    }
  }

  private saveWordPressCredentials() {
    try {
      const credentialsPath = join(this.configDataPath, 'wordpress-credentials.json');
      const credentials = Array.from(this.wordpressCredentials.values()).map(cred => ({
        ...cred,
        createdAt: cred.createdAt instanceof Date ? cred.createdAt.toISOString() : cred.createdAt,
        updatedAt: cred.updatedAt instanceof Date ? cred.updatedAt.toISOString() : cred.updatedAt,
      }));
      writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
    } catch (error) {
      console.error('[WordPress Storage] Error saving credentials:', error);
    }
  }

  // BigCommerce Credentials methods
  async getBigCommerceCredentials(projectId: string): Promise<BigCommerceCredentials | undefined> {
    return this.bigcommerceCredentials.get(projectId);
  }

  async createOrUpdateBigCommerceCredentials(credentials: InsertBigCommerceCredentials): Promise<BigCommerceCredentials> {
    const existing = this.bigcommerceCredentials.get(credentials.projectId);
    
    let updatedCredentials: BigCommerceCredentials;
    if (existing) {
      updatedCredentials = {
        ...existing,
        ...credentials,
        updatedAt: new Date(),
      };
      this.bigcommerceCredentials.set(credentials.projectId, updatedCredentials);
    } else {
      updatedCredentials = {
        id: randomUUID(),
        ...credentials,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.bigcommerceCredentials.set(credentials.projectId, updatedCredentials);
    }
    
    // Persist to disk
    this.saveBigCommerceCredentials();
    return updatedCredentials;
  }

  async deleteBigCommerceCredentials(projectId: string): Promise<boolean> {
    const deleted = this.bigcommerceCredentials.delete(projectId);
    if (deleted) {
      this.saveBigCommerceCredentials();
    }
    return deleted;
  }

  private loadBigCommerceCredentials() {
    try {
      const credentialsPath = join(this.configDataPath, 'bigcommerce-credentials.json');
      if (existsSync(credentialsPath)) {
        const credentials = JSON.parse(readFileSync(credentialsPath, 'utf-8')) as BigCommerceCredentials[];
        credentials.forEach(cred => {
          const credWithDates: BigCommerceCredentials = {
            ...cred,
            createdAt: typeof cred.createdAt === 'string' ? cred.createdAt : cred.createdAt,
            updatedAt: typeof cred.updatedAt === 'string' ? cred.updatedAt : cred.updatedAt,
          };
          this.bigcommerceCredentials.set(cred.projectId, credWithDates);
        });
        console.log(`[BigCommerce Storage] Loaded ${credentials.length} BigCommerce credential(s) from disk`);
      }
    } catch (error) {
      console.error('[BigCommerce Storage] Error loading credentials:', error);
    }
  }

  private saveBigCommerceCredentials() {
    try {
      const credentialsPath = join(this.configDataPath, 'bigcommerce-credentials.json');
      const credentials = Array.from(this.bigcommerceCredentials.values()).map(cred => ({
        ...cred,
        createdAt: cred.createdAt instanceof Date ? cred.createdAt.toISOString() : cred.createdAt,
        updatedAt: cred.updatedAt instanceof Date ? cred.updatedAt.toISOString() : cred.updatedAt,
      }));
      writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
    } catch (error) {
      console.error('[BigCommerce Storage] Error saving credentials:', error);
    }
  }

  // Squarespace Credentials methods
  async getSquarespaceCredentials(projectId: string): Promise<SquarespaceCredentials | undefined> {
    return this.squarespaceCredentials.get(projectId);
  }

  async createOrUpdateSquarespaceCredentials(credentials: InsertSquarespaceCredentials): Promise<SquarespaceCredentials> {
    const existing = this.squarespaceCredentials.get(credentials.projectId);

    let updatedCredentials: SquarespaceCredentials;
    if (existing) {
      updatedCredentials = {
        ...existing,
        ...credentials,
        updatedAt: new Date(),
      };
      this.squarespaceCredentials.set(credentials.projectId, updatedCredentials);
    } else {
      updatedCredentials = {
        id: randomUUID(),
        ...credentials,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.squarespaceCredentials.set(credentials.projectId, updatedCredentials);
    }

    // Persist to disk
    this.saveSquarespaceCredentials();
    return updatedCredentials;
  }

  async deleteSquarespaceCredentials(projectId: string): Promise<boolean> {
    const deleted = this.squarespaceCredentials.delete(projectId);
    if (deleted) {
      this.saveSquarespaceCredentials();
    }
    return deleted;
  }

  private loadSquarespaceCredentials() {
    try {
      const credentialsPath = join(this.configDataPath, 'squarespace-credentials.json');
      if (existsSync(credentialsPath)) {
        const credentials = JSON.parse(readFileSync(credentialsPath, 'utf-8')) as SquarespaceCredentials[];
        credentials.forEach(cred => {
          const credWithDates: SquarespaceCredentials = {
            ...cred,
            createdAt: typeof cred.createdAt === 'string' ? cred.createdAt : cred.createdAt,
            updatedAt: typeof cred.updatedAt === 'string' ? cred.updatedAt : cred.updatedAt,
          };
          this.squarespaceCredentials.set(cred.projectId, credWithDates);
        });
        console.log(`[Squarespace Storage] Loaded ${credentials.length} Squarespace credential(s) from disk`);
      }
    } catch (error) {
      console.error('[Squarespace Storage] Error loading credentials:', error);
    }
  }

  private saveSquarespaceCredentials() {
    try {
      const credentialsPath = join(this.configDataPath, 'squarespace-credentials.json');
      const credentials = Array.from(this.squarespaceCredentials.values()).map(cred => ({
        ...cred,
        createdAt: cred.createdAt instanceof Date ? cred.createdAt.toISOString() : cred.createdAt,
        updatedAt: cred.updatedAt instanceof Date ? cred.updatedAt.toISOString() : cred.updatedAt,
      }));
      writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
    } catch (error) {
      console.error('[Squarespace Storage] Error saving credentials:', error);
    }
  }

  // Wix Credentials methods
  async getWixCredentials(projectId: string): Promise<WixCredentials | undefined> {
    return this.wixCredentials.get(projectId);
  }

  async createOrUpdateWixCredentials(credentials: InsertWixCredentials): Promise<WixCredentials> {
    const existing = this.wixCredentials.get(credentials.projectId);

    let updatedCredentials: WixCredentials;
    if (existing) {
      updatedCredentials = {
        ...existing,
        ...credentials,
        updatedAt: new Date(),
      };
      this.wixCredentials.set(credentials.projectId, updatedCredentials);
    } else {
      updatedCredentials = {
        id: randomUUID(),
        ...credentials,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.wixCredentials.set(credentials.projectId, updatedCredentials);
    }

    // Persist to disk
    this.saveWixCredentials();
    return updatedCredentials;
  }

  async deleteWixCredentials(projectId: string): Promise<boolean> {
    const deleted = this.wixCredentials.delete(projectId);
    if (deleted) {
      this.saveWixCredentials();
    }
    return deleted;
  }

  private loadWixCredentials() {
    try {
      const credentialsPath = join(this.configDataPath, 'wix-credentials.json');
      if (existsSync(credentialsPath)) {
        const credentials = JSON.parse(readFileSync(credentialsPath, 'utf-8')) as WixCredentials[];
        credentials.forEach(cred => {
          const credWithDates: WixCredentials = {
            ...cred,
            createdAt: typeof cred.createdAt === 'string' ? cred.createdAt : cred.createdAt,
            updatedAt: typeof cred.updatedAt === 'string' ? cred.updatedAt : cred.updatedAt,
          };
          this.wixCredentials.set(cred.projectId, credWithDates);
        });
        console.log(`[Wix Storage] Loaded ${credentials.length} Wix credential(s) from disk`);
      }
    } catch (error) {
      console.error('[Wix Storage] Error loading credentials:', error);
    }
  }

  private saveWixCredentials() {
    try {
      const credentialsPath = join(this.configDataPath, 'wix-credentials.json');
      const credentials = Array.from(this.wixCredentials.values()).map(cred => ({
        ...cred,
        createdAt: cred.createdAt instanceof Date ? cred.createdAt.toISOString() : cred.createdAt,
        updatedAt: cred.updatedAt instanceof Date ? cred.updatedAt.toISOString() : cred.updatedAt,
      }));
      writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
    } catch (error) {
      console.error('[Wix Storage] Error saving credentials:', error);
    }
  }

  // Webflow Credentials methods
  async getWebflowCredentials(projectId: string): Promise<WebflowCredentials | undefined> {
    return this.webflowCredentials.get(projectId);
  }

  async createOrUpdateWebflowCredentials(credentials: InsertWebflowCredentials): Promise<WebflowCredentials> {
    const existing = this.webflowCredentials.get(credentials.projectId);

    let updatedCredentials: WebflowCredentials;
    if (existing) {
      updatedCredentials = {
        ...existing,
        ...credentials,
        updatedAt: new Date(),
      };
      this.webflowCredentials.set(credentials.projectId, updatedCredentials);
    } else {
      updatedCredentials = {
        id: randomUUID(),
        ...credentials,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.webflowCredentials.set(credentials.projectId, updatedCredentials);
    }

    // Persist to disk
    this.saveWebflowCredentials();
    return updatedCredentials;
  }

  async deleteWebflowCredentials(projectId: string): Promise<boolean> {
    const deleted = this.webflowCredentials.delete(projectId);
    if (deleted) {
      this.saveWebflowCredentials();
    }
    return deleted;
  }

  private loadWebflowCredentials() {
    try {
      const credentialsPath = join(this.configDataPath, 'webflow-credentials.json');
      if (existsSync(credentialsPath)) {
        const credentials = JSON.parse(readFileSync(credentialsPath, 'utf-8')) as WebflowCredentials[];
        credentials.forEach(cred => {
          const credWithDates: WebflowCredentials = {
            ...cred,
            createdAt: typeof cred.createdAt === 'string' ? cred.createdAt : cred.createdAt,
            updatedAt: typeof cred.updatedAt === 'string' ? cred.updatedAt : cred.updatedAt,
          };
          this.webflowCredentials.set(cred.projectId, credWithDates);
        });
        console.log(`[Webflow Storage] Loaded ${credentials.length} Webflow credential(s) from disk`);
      }
    } catch (error) {
      console.error('[Webflow Storage] Error loading credentials:', error);
    }
  }

  private saveWebflowCredentials() {
    try {
      const credentialsPath = join(this.configDataPath, 'webflow-credentials.json');
      const credentials = Array.from(this.webflowCredentials.values()).map(cred => ({
        ...cred,
        createdAt: cred.createdAt instanceof Date ? cred.createdAt.toISOString() : cred.createdAt,
        updatedAt: cred.updatedAt instanceof Date ? cred.updatedAt.toISOString() : cred.updatedAt,
      }));
      writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
    } catch (error) {
      console.error('[Webflow Storage] Error saving credentials:', error);
    }
  }
}

export const storage = new MemStorage();
