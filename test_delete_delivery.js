// Test script for delivery delete API
// Usage: node test_delete_delivery.js <delivery_id> <admin_token>

const axios = require('axios');

// Get command line arguments
const deliveryId = process.argv[2];
const adminToken = process.argv[3];

if (!deliveryId || !adminToken) {
  console.log('Usage: node test_delete_delivery.js <delivery_id> <admin_token>');
  console.log('Example: node test_delete_delivery.js 67890abcdef1234567890123 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  process.exit(1);
}

const API_BASE = 'http://localhost:5000/api/admin';

async function testDeleteDelivery() {
  try {
    console.log(`🚀 Testing DELETE delivery API...`);
    console.log(`Delivery ID: ${deliveryId}`);
    
    const response = await axios.delete(`${API_BASE}/deliveries/${deliveryId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ Success!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.log('\n❌ API Error:');
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('\n❌ Network Error:', error.message);
    }
  }
}

// Also test getting all deliveries first to see what's available
async function listDeliveries() {
  try {
    console.log('📋 Getting list of all deliveries...\n');
    
    const response = await axios.get(`${API_BASE}/deliveries`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const deliveries = response.data.data;
    console.log(`Found ${deliveries.length} deliveries:\n`);
    
    deliveries.forEach((delivery, index) => {
      console.log(`${index + 1}. ID: ${delivery._id}`);
      console.log(`   User: ${delivery.user?.firstName || 'N/A'} ${delivery.user?.lastName || 'N/A'}`);
      console.log(`   Publication: ${delivery.publication?.name || 'N/A'}`);
      console.log(`   Status: ${delivery.status}`);
      console.log(`   Created: ${new Date(delivery.createdAt).toLocaleString()}\n`);
    });
    
  } catch (error) {
    console.log('Error fetching deliveries:', error.message);
  }
}

// Run the tests
async function run() {
  await listDeliveries();
  console.log('----------------------------------------\n');
  await testDeleteDelivery();
}

run();
