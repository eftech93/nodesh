/**
 * Jest setup for integration tests
 */

// Set longer timeout for integration tests
jest.setTimeout(120000);

// Log when tests start
console.log('\n🧪 Starting integration tests...\n');

// Handle unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
