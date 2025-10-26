import app from '../src/index.js';

console.log('Testing app import...');

async function testRequest(url) {
  console.log(`Testing: ${url}`);
  try {
    const response = await app.request(url, {});
    console.log(`Status: ${response.status}`);
    const body = await response.json();
    console.log(`Body:`, JSON.stringify(body, null, 2));
  } catch (error) {
    console.log(`Error:`, error.message);
  }
}

// Test the specific failing case
console.log('=== Testing missing to parameter ===');
testRequest('/r');