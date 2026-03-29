/**
 * Test API helper directly
 */
async function test() {
  // Import the route directly
  const routeModule = require('./src/app/api/users/route.ts');
  
  console.log('Route module exports:', Object.keys(routeModule));
  
  // Create a simple mock request
  const mockRequest = {
    url: 'http://localhost:3000/api/users',
    method: 'POST',
    headers: new Map([['content-type', 'application/json']]),
    json: async () => ({
      email: 'test@test.com',
      password: 'password123',
      name: { first: 'Test', last: 'User' }
    })
  };
  
  try {
    console.log('Calling POST handler...');
    const result = await routeModule.POST(mockRequest);
    console.log('Result type:', typeof result);
    console.log('Result:', result);
    
    // Try to parse as JSON
    if (result && result.json) {
      const data = await result.json();
      console.log('Parsed data:', data);
    }
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
  }
}

test();
