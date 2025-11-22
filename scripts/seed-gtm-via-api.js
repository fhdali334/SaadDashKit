/**
 * Script to seed GTM mock data via API endpoint
 * This works through the application's storage layer (works with both memory and database storage)
 * Usage: node scripts/seed-gtm-via-api.js [baseUrl] [projectId]
 * 
 * Example:
 *   node scripts/seed-gtm-via-api.js https://saasdashkit-v1.onrender.com 66aeff0ea380c590e96e8e70
 * 
 * Note: You need to be logged in (have a valid session cookie) for this to work.
 * For local development, you can login first and copy the session cookie.
 */

const baseUrl = process.argv[2] || 'http://localhost:3000';
const projectId = process.argv[3];

if (!projectId) {
  console.error('Error: projectId is required');
  console.log('Usage: node scripts/seed-gtm-via-api.js [baseUrl] <projectId>');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/seed-gtm-via-api.js https://saasdashkit-v1.onrender.com 66aeff0ea380c590e96e8e70');
  console.log('');
  console.log('Note: This requires you to be logged in. The API endpoint uses requireAuth middleware.');
  process.exit(1);
}

async function seedViaApi() {
  try {
    console.log(`Seeding GTM mock data via API for project: ${projectId}`);
    console.log(`Base URL: ${baseUrl}`);
    console.log('');
    console.log('⚠️  Note: This requires authentication. Make sure you are logged in.');
    console.log('   For production, you can:');
    console.log('   1. Login via the web interface');
    console.log('   2. Copy the session cookie from browser DevTools');
    console.log('   3. Use curl with the cookie:');
    console.log(`      curl -X POST ${baseUrl}/api/gtm/seed-mock-data \\`);
    console.log('        -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \\');
    console.log('        -H "Content-Type: application/json"');
    console.log('');
    
    // Try to make the request
    const response = await fetch(`${baseUrl}/api/gtm/seed-mock-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error seeding GTM data:', data.error || 'Unknown error');
      console.error('Status:', response.status);
      if (response.status === 401) {
        console.error('');
        console.error('Authentication required. Please login first or provide session cookie.');
      }
      process.exit(1);
    }

    console.log('✅ GTM mock data seeded successfully!');
    console.log('');
    console.log('Seeded data:');
    console.log(`  - Analytics data: ${data.seeded.analyticsData} days`);
    console.log(`  - Traffic sources: ${data.seeded.trafficSources}`);
    console.log(`  - Page views: ${data.seeded.pageViews}`);
    console.log(`  - Referrers: ${data.seeded.referrers}`);
    console.log(`  - Keywords: ${data.seeded.keywords}`);
    console.log(`  - Campaigns: ${data.seeded.campaigns}`);
    console.log('');
    console.log(`Project ID: ${data.projectId}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('');
      console.error('Could not connect to server. Make sure the server is running.');
    }
    process.exit(1);
  }
}

seedViaApi();

