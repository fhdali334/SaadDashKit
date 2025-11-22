-- Initial Database Schema for SaasDashKit_V1
-- Compatible with PostgreSQL and TimescaleDB
-- Run this script manually to create all required tables

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and API credentials storage
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    project_id VARCHAR(255) NOT NULL,
    environment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Shared links table for transcript sharing
CREATE TABLE IF NOT EXISTS shared_links (
    id SERIAL PRIMARY KEY,
    share_id VARCHAR(255) UNIQUE NOT NULL,
    transcript_id VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge Base Files table
CREATE TABLE IF NOT EXISTS knowledge_base_files (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

-- Project Configuration table (legacy credit management)
CREATE TABLE IF NOT EXISTS project_configs (
    project_id VARCHAR(255) PRIMARY KEY,
    budget DECIMAL(10, 2) NOT NULL DEFAULT 0,
    credits_used DECIMAL(10, 2) NOT NULL DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    vf_api_key VARCHAR(255)
);

-- Credit Accounts table (new cost tab system)
CREATE TABLE IF NOT EXISTS credit_accounts (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(255) NOT NULL,
    credit_limit VARCHAR(255) NOT NULL DEFAULT '0',
    credits_used VARCHAR(255) NOT NULL DEFAULT '0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table (credit purchases and deductions)
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    account_id VARCHAR(255) NOT NULL REFERENCES credit_accounts(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('purchase', 'deduction')),
    amount VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    stripe_payment_intent_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Usage Records table
CREATE TABLE IF NOT EXISTS usage_records (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    account_id VARCHAR(255) NOT NULL REFERENCES credit_accounts(id) ON DELETE CASCADE,
    amount VARCHAR(255) NOT NULL,
    tokens INTEGER,
    category VARCHAR(50) NOT NULL CHECK (category IN ('api_calls', 'storage', 'compute', 'bandwidth')),
    description TEXT NOT NULL,
    metadata TEXT, -- JSON string for additional data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Analysis table
CREATE TABLE IF NOT EXISTS ai_analyses (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    project_id VARCHAR(255) NOT NULL,
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    conversion_rate DECIMAL(5, 4) NOT NULL, -- Decimal for precision (0.0000 to 1.0000)
    average_sentiment DECIMAL(3, 2) NOT NULL, -- -1.00 to 1.00 scale
    total_transcripts INTEGER NOT NULL DEFAULT 0,
    report_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Keywords table
CREATE TABLE IF NOT EXISTS ai_keywords (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    analysis_id VARCHAR(255) NOT NULL REFERENCES ai_analyses(id) ON DELETE CASCADE,
    keyword VARCHAR(255) NOT NULL,
    frequency INTEGER NOT NULL DEFAULT 0,
    relevance_score DECIMAL(3, 2) NOT NULL DEFAULT 0 CHECK (relevance_score >= 0 AND relevance_score <= 1),
    category VARCHAR(255)
);

-- AI Keyphrases table
CREATE TABLE IF NOT EXISTS ai_keyphrases (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    analysis_id VARCHAR(255) NOT NULL REFERENCES ai_analyses(id) ON DELETE CASCADE,
    keyphrase TEXT NOT NULL,
    frequency INTEGER NOT NULL DEFAULT 0,
    relevance_score DECIMAL(3, 2) NOT NULL DEFAULT 0 CHECK (relevance_score >= 0 AND relevance_score <= 1),
    context TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shared_links_share_id ON shared_links(share_id);
CREATE INDEX IF NOT EXISTS idx_shared_links_user_id ON shared_links(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_records_account_id ON usage_records(account_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_created_at ON usage_records(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_records_category ON usage_records(category);
CREATE INDEX IF NOT EXISTS idx_ai_keywords_analysis_id ON ai_keywords(analysis_id);
CREATE INDEX IF NOT EXISTS idx_ai_keyphrases_analysis_id ON ai_keyphrases(analysis_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_project_id ON ai_analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created_at ON ai_analyses(created_at);

-- GTM (Google Tag Manager) Credentials table
CREATE TABLE IF NOT EXISTS gtm_credentials (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    project_id VARCHAR(255) NOT NULL REFERENCES project_configs(project_id) ON DELETE CASCADE,
    account_id VARCHAR(255) NOT NULL,
    container_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL, -- Encrypted OAuth access token
    refresh_token TEXT NOT NULL, -- Encrypted OAuth refresh token
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id)
);

-- GTM Analytics Data (Time Series)
CREATE TABLE IF NOT EXISTS gtm_analytics_data (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    project_id VARCHAR(255) NOT NULL REFERENCES project_configs(project_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    page_views INTEGER NOT NULL DEFAULT 0,
    sessions INTEGER NOT NULL DEFAULT 0,
    users INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, date)
);

-- GTM Traffic Sources
CREATE TABLE IF NOT EXISTS gtm_traffic_sources (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    project_id VARCHAR(255) NOT NULL REFERENCES project_configs(project_id) ON DELETE CASCADE,
    source VARCHAR(255) NOT NULL,
    sessions INTEGER NOT NULL DEFAULT 0,
    percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- GTM Page Views
CREATE TABLE IF NOT EXISTS gtm_page_views (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    project_id VARCHAR(255) NOT NULL REFERENCES project_configs(project_id) ON DELETE CASCADE,
    page VARCHAR(500) NOT NULL,
    views INTEGER NOT NULL DEFAULT 0,
    percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- GTM Referrers
CREATE TABLE IF NOT EXISTS gtm_referrers (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    project_id VARCHAR(255) NOT NULL REFERENCES project_configs(project_id) ON DELETE CASCADE,
    source VARCHAR(500) NOT NULL,
    visits INTEGER NOT NULL DEFAULT 0,
    percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- GTM Keywords
CREATE TABLE IF NOT EXISTS gtm_keywords (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    project_id VARCHAR(255) NOT NULL REFERENCES project_configs(project_id) ON DELETE CASCADE,
    keyword VARCHAR(255) NOT NULL,
    searches INTEGER NOT NULL DEFAULT 0,
    percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- GTM Campaigns
CREATE TABLE IF NOT EXISTS gtm_campaigns (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    project_id VARCHAR(255) NOT NULL REFERENCES project_configs(project_id) ON DELETE CASCADE,
    campaign VARCHAR(255) NOT NULL,
    clicks INTEGER NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for GTM tables
CREATE INDEX IF NOT EXISTS idx_gtm_credentials_project_id ON gtm_credentials(project_id);
CREATE INDEX IF NOT EXISTS idx_gtm_analytics_data_project_id ON gtm_analytics_data(project_id);
CREATE INDEX IF NOT EXISTS idx_gtm_analytics_data_date ON gtm_analytics_data(date);
CREATE INDEX IF NOT EXISTS idx_gtm_traffic_sources_project_id ON gtm_traffic_sources(project_id);
CREATE INDEX IF NOT EXISTS idx_gtm_traffic_sources_date ON gtm_traffic_sources(date);
CREATE INDEX IF NOT EXISTS idx_gtm_page_views_project_id ON gtm_page_views(project_id);
CREATE INDEX IF NOT EXISTS idx_gtm_page_views_date ON gtm_page_views(date);
CREATE INDEX IF NOT EXISTS idx_gtm_referrers_project_id ON gtm_referrers(project_id);
CREATE INDEX IF NOT EXISTS idx_gtm_referrers_date ON gtm_referrers(date);
CREATE INDEX IF NOT EXISTS idx_gtm_keywords_project_id ON gtm_keywords(project_id);
CREATE INDEX IF NOT EXISTS idx_gtm_keywords_date ON gtm_keywords(date);
CREATE INDEX IF NOT EXISTS idx_gtm_campaigns_project_id ON gtm_campaigns(project_id);
CREATE INDEX IF NOT EXISTS idx_gtm_campaigns_date ON gtm_campaigns(date);

-- For TimescaleDB: Convert time-series tables to hypertables (optional)
-- Uncomment if you want to use TimescaleDB time-series features for usage_records
-- SELECT create_hypertable('usage_records', 'created_at', if_not_exists => TRUE);
-- SELECT create_hypertable('transactions', 'created_at', if_not_exists => TRUE);
-- SELECT create_hypertable('ai_analyses', 'created_at', if_not_exists => TRUE);
-- SELECT create_hypertable('gtm_analytics_data', 'date', if_not_exists => TRUE);

