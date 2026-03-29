/**
 * Quick test script for API helpers
 */
const { NextJSLoader } = require('@eftech93/nodesh');

async function test() {
  const loader = new NextJSLoader({
    rootPath: __dirname
  });

  console.log('Loading...');
  const context = await loader.load();
  console.log('Loaded!');

  // Test the API helper
  console.log('\nTesting apiStatsGet...');
  try {
    const result = await context.apiStatsGet();
    console.log('Result:', result);
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
  }
}

test().catch(console.error);
