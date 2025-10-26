// Debug redirect validation issue
import app from './dist/src/index.js';

async function testRequest(url, description) {
  console.log(`\n=== ${description} ===`);
  console.log(`Request URL: ${url}`);
  
  try {
    const response = await app.request(url, {});
    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
    
    const body = await response.json();
    console.log(`Body:`, JSON.stringify(body, null, 2));
  } catch (error) {
    console.log(`Error:`, error.message);
  }
}

// Test the specific failing case
testRequest('/r', 'Missing to parameter');

// Test a working case for comparison
testRequest('/r?to=https%3A%2F%2Fexample.com', 'Valid URL');