/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration'],
  testMatch: ['**/*.integration.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
  // Important for integration tests
  runInBand: true,
  forceExit: true,
  detectOpenHandles: true,
  noStackTrace: false,
  // Longer timeout for integration tests (2 minutes)
  testTimeout: 120000,
  // Don't use watchman (can cause hangs)
  watchman: false,
  // Clear mocks between tests
  clearMocks: true,
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.js'],
};
