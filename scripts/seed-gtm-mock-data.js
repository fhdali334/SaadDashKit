/**
 * Script to seed GTM mock data into the database
 * Usage: node scripts/seed-gtm-mock-data.js [projectId]
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is required');
  console.log('Please set DATABASE_URL in your .env file or environment variables');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // For production databases (Render, Neon, etc.), SSL is required
  ssl: process.env.DATABASE_URL?.includes('localhost') || process.env.DATABASE_URL?.includes('127.0.0.1')
    ? false 
    : { rejectUnauthorized: false }
});

async function seedGtmMockData(projectId) {
  if (!projectId) {
    console.error('Error: projectId is required');
    console.log('Usage: node scripts/seed-gtm-mock-data.js <projectId>');
    process.exit(1);
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  try {
    console.log(`Seeding GTM mock data for project: ${projectId}...`);

    // Seed analytics data for last 30 days
    console.log('Seeding analytics data (30 days)...');
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      await pool.query(`
        INSERT INTO gtm_analytics_data (project_id, date, page_views, sessions, users, clicks, conversions)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (project_id, date) 
        DO UPDATE SET 
          page_views = EXCLUDED.page_views,
          sessions = EXCLUDED.sessions,
          users = EXCLUDED.users,
          clicks = EXCLUDED.clicks,
          conversions = EXCLUDED.conversions
      `, [
        projectId,
        dateStr,
        Math.floor(Math.random() * 1000) + 500,
        Math.floor(Math.random() * 800) + 300,
        Math.floor(Math.random() * 600) + 200,
        Math.floor(Math.random() * 400) + 100,
        Math.floor(Math.random() * 50) + 10,
      ]);
    }

    // Seed traffic sources
    console.log('Seeding traffic sources...');
    const trafficSources = [
      { source: "Organic Search", sessions: 4520, percentage: 45 },
      { source: "Direct", sessions: 2800, percentage: 28 },
      { source: "Social Media", sessions: 1500, percentage: 15 },
      { source: "Referral", sessions: 800, percentage: 8 },
      { source: "Email", sessions: 380, percentage: 4 },
    ];

    for (const ts of trafficSources) {
      await pool.query(`
        INSERT INTO gtm_traffic_sources (project_id, source, sessions, percentage, date)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [projectId, ts.source, ts.sessions, ts.percentage, todayStr]);
    }

    // Seed page views
    console.log('Seeding page views...');
    const pageViews = [
      { page: "/home", views: 12500, percentage: 32 },
      { page: "/products", views: 8900, percentage: 23 },
      { page: "/about", views: 6200, percentage: 16 },
      { page: "/contact", views: 4500, percentage: 12 },
      { page: "/blog", views: 3800, percentage: 10 },
      { page: "/pricing", views: 2100, percentage: 5 },
      { page: "/faq", views: 1000, percentage: 2 },
      { page: "/blog/post-1", views: 3200, percentage: 8 },
      { page: "/blog/post-2", views: 2800, percentage: 7 },
      { page: "/products/item-1", views: 2400, percentage: 6 },
      { page: "/products/item-2", views: 2100, percentage: 5 },
      { page: "/products/item-3", views: 1800, percentage: 5 },
      { page: "/checkout", views: 1500, percentage: 4 },
      { page: "/checkout/complete", views: 1200, percentage: 3 },
      { page: "/blog/post-5", views: 1500, percentage: 15 },
    ];

    for (const pv of pageViews) {
      await pool.query(`
        INSERT INTO gtm_page_views (project_id, page, views, percentage, date)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [projectId, pv.page, pv.views, pv.percentage, todayStr]);
    }

    // Seed referrers
    console.log('Seeding referrers...');
    const referrers = [
      { source: "google.com", visits: 4200, percentage: 42 },
      { source: "facebook.com", visits: 1800, percentage: 18 },
      { source: "twitter.com", visits: 1200, percentage: 12 },
      { source: "linkedin.com", visits: 900, percentage: 9 },
      { source: "reddit.com", visits: 600, percentage: 6 },
      { source: "youtube.com", visits: 500, percentage: 5 },
      { source: "Other", visits: 800, percentage: 8 },
    ];

    for (const ref of referrers) {
      await pool.query(`
        INSERT INTO gtm_referrers (project_id, source, visits, percentage, date)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [projectId, ref.source, ref.visits, ref.percentage, todayStr]);
    }

    // Seed keywords
    console.log('Seeding keywords...');
    const keywords = [
      { keyword: "saas dashboard", searches: 3200, percentage: 32 },
      { keyword: "analytics tool", searches: 2100, percentage: 21 },
      { keyword: "business intelligence", searches: 1500, percentage: 15 },
      { keyword: "data visualization", searches: 1200, percentage: 12 },
      { keyword: "reporting software", searches: 900, percentage: 9 },
      { keyword: "dashboard software", searches: 600, percentage: 6 },
      { keyword: "analytics platform", searches: 500, percentage: 5 },
    ];

    for (const kw of keywords) {
      await pool.query(`
        INSERT INTO gtm_keywords (project_id, keyword, searches, percentage, date)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [projectId, kw.keyword, kw.searches, kw.percentage, todayStr]);
    }

    // Seed campaigns
    console.log('Seeding campaigns...');
    const campaigns = [
      { campaign: "Summer Sale 2024", clicks: 5200, conversions: 420 },
      { campaign: "Product Launch", clicks: 3800, conversions: 310 },
      { campaign: "Blog Promotion", clicks: 2100, conversions: 180 },
      { campaign: "Newsletter Signup", clicks: 1500, conversions: 240 },
      { campaign: "Free Trial", clicks: 3200, conversions: 280 },
      { campaign: "Webinar Series", clicks: 1800, conversions: 150 },
      { campaign: "Case Study", clicks: 1200, conversions: 95 },
      { campaign: "Social Media", clicks: 900, conversions: 65 },
    ];

    for (const camp of campaigns) {
      await pool.query(`
        INSERT INTO gtm_campaigns (project_id, campaign, clicks, conversions, date)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [projectId, camp.campaign, camp.clicks, camp.conversions, todayStr]);
    }

    console.log('✅ GTM mock data seeded successfully!');
    console.log(`   - Analytics data: 30 days`);
    console.log(`   - Traffic sources: ${trafficSources.length}`);
    console.log(`   - Page views: ${pageViews.length}`);
    console.log(`   - Referrers: ${referrers.length}`);
    console.log(`   - Keywords: ${keywords.length}`);
    console.log(`   - Campaigns: ${campaigns.length}`);

  } catch (error) {
    console.error('Error seeding GTM mock data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const projectId = process.argv[2];
seedGtmMockData(projectId);

