// Test the actual publication API endpoint
const axios = require('axios');

async function testPublicationAPI() {
  try {
    const BASE_URL = 'http://localhost:3000';
    const publicationId = '698b0ad15b5a39a046c39100';
    
    console.log('=== TESTING PUBLICATION API ENDPOINT ===\n');
    
    // First, let's see if we can access the endpoint without auth (should fail)
    try {
      console.log('1. Testing without authentication:');
      await axios.get(`${BASE_URL}/api/users/publications/${publicationId}`);
      console.log('  ❌ Unexpected: Request succeeded without auth');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('  ✅ Expected: Authentication required (401)');
      } else {
        console.log('  ❓ Unexpected error:', error.response?.status, error.response?.data);
      }
    }
    
    console.log('\n=== TEST COMPLETE ===');
    console.log('\nTo test with authentication, you need a valid JWT token.');
    console.log('The endpoint should be: GET /api/users/publications/' + publicationId);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testPublicationAPI();