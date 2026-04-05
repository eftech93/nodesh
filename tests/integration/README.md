# NodeSH Integration Tests

This directory contains comprehensive integration tests for the NodeSH CLI. These tests verify that the CLI works correctly with real projects (Express, NestJS, Next.js) and actual database connections.

## Architecture

```
integration/
├── cli-harness.ts                    # Core test utilities
├── nextjs.integration.test.ts        # Next.js project tests
├── nestjs.integration.test.ts        # NestJS project tests
├── express.integration.test.ts       # Express project tests
├── autocomplete.integration.test.ts  # Autocomplete tests
└── README.md                         # This file
```

## Prerequisites

- Docker and Docker Compose
- Node.js 14+
- All example projects built and dependencies installed

## Quick Start

### 1. Start Test Databases

```bash
npm run test:docker:up
```

This starts all test databases defined in `docker-compose.test.yml`:
- MongoDB (port 27017)
- Redis (port 6379)
- PostgreSQL (port 5432)
- MySQL (port 3306)
- Neo4j (port 7687)
- DynamoDB Local (port 8000)

### 2. Run Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific project tests
npm run test:integration:nextjs
npm run test:integration:nestjs
npm run test:integration:express

# Run autocomplete tests
npm run test:integration:autocomplete
```

### 3. Stop Test Databases

```bash
npm run test:docker:down
```

## Test Environment

Test environment variables are defined in `.env.test`:

```bash
# MongoDB
MONGODB_URI=mongodb://admin:password@localhost:27017/nodesh_test?authSource=admin

# PostgreSQL
PGHOST=localhost
PGPORT=5432
PGDATABASE=nodesh_test
PGUSER=nodesh
PGPASSWORD=nodesh_password

# ... etc
```

## Writing Integration Tests

### Basic Test Structure

```typescript
import { CLISession, waitForDatabases, setupTestEnv } from './cli-harness';
import * as path from 'path';

describe('My Feature', () => {
  let session: CLISession;
  const projectPath = path.join(__dirname, '../../example-nextjs');

  beforeAll(async () => {
    setupTestEnv();
    await waitForDatabases();
  }, 120000);

  afterEach(async () => {
    if (session) {
      await session.close();
    }
  });

  it('should do something', async () => {
    session = await CLISession.create({ projectPath });
    
    const result = await session.execute('await someCommand()');
    expect(result.output).toContain('expected');
    expect(result.timedOut).toBe(false);
  }, 30000);
});
```

### CLI Session API

#### Creating a Session

```typescript
const session = await CLISession.create({
  projectPath: '/path/to/project',
  env: { NODE_ENV: 'test' },        // Additional env vars
  args: ['--no-color'],              // CLI arguments
  commandTimeout: 30000,             // Command timeout (ms)
  debug: true                        // Show CLI output
});
```

#### Executing Commands

```typescript
// Execute a single command
const result = await session.execute('await productsGetProducts()');
console.log(result.output);
console.log(result.stderr);
console.log(result.duration);

// Execute multiple commands
const results = await session.executeSequence([
  'await initPostgresTables()',
  'await productsCreateProduct({ name: "Test" })',
  'await productsGetProducts()'
]);
```

#### Testing Autocomplete

```typescript
const completions = await session.testAutocomplete('user.');
expect(completions).toContain('find()');
expect(completions).toContain('create()');
```

#### Getting Context

```typescript
const context = await session.getContext();
console.log(context.models);    // ['User', 'Product', ...]
console.log(context.services);  // ['userService', ...]
```

### Command Result Structure

```typescript
interface CommandResult {
  output: string;      // stdout from CLI
  stderr: string;      // stderr from CLI
  timedOut: boolean;   // whether command timed out
  duration: number;    // execution time in ms
}
```

## Autocomplete Tests

The autocomplete tests are split into two categories:

### 1. Unit Tests (Run in CI)

Tests the `IntelligentCompleter` class directly without requiring Docker:

```typescript
describe('Autocomplete Unit Tests', () => {
  it('should complete object properties', () => {
    const context = { user: { name: 'John', email: 'john@example.com' } };
    const completer = new IntelligentCompleter(context);
    const [completions] = completer.complete('user.n');
    
    expect(completions).toContain('name');
  });
});
```

### 2. Integration Tests (Require Docker)

Tests autocomplete with real loaded projects:

```typescript
DESCRIBE('Autocomplete Integration Tests', () => {
  it('should complete with real project context', async () => {
    session = await CLISession.create({ projectPath });
    const result = await session.execute('userService.f');
    // Verify completions include find(), filter(), etc.
  });
});
```

## Debugging Tests

### Enable Debug Output

```bash
DEBUG_TESTS=true npm run test:integration:nextjs
```

### View Database Logs

```bash
npm run test:docker:logs
```

### Manual CLI Testing

Start the CLI manually against a test project:

```bash
# 1. Start databases
npm run test:docker:up

# 2. Load test env
export $(cat .env.test | xargs)

# 3. Run CLI
cd example-nextjs
../dist/cli.js --no-color
```

## Continuous Integration

Integration tests are skipped by default in CI (controlled by `ENABLE_INTEGRATION_TESTS` env var):

```yaml
# Example GitHub Actions workflow
- name: Run Integration Tests
  env:
    ENABLE_INTEGRATION_TESTS: true
  run: |
    npm run test:docker:up
    npm run test:integration
    npm run test:docker:down
```

## Troubleshooting

### Tests Timing Out

- Check if Docker databases are running: `docker-compose -f docker-compose.test.yml ps`
- Increase command timeout: `commandTimeout: 60000`
- Check database logs: `npm run test:docker:logs`

### Connection Refused Errors

- Wait for databases to be healthy: `npm run test:docker:up && sleep 30`
- Check if ports are already in use: `lsof -i :5432`
- Restart databases: `npm run test:docker:down && npm run test:docker:up`

### Module Not Found Errors

- Ensure project dependencies are installed: `cd example-nextjs && npm install`
- Build the project: `npm run build`
- Re-link the package: `npm run relink`

## Future Improvements

1. **Parallel Test Execution**: Currently tests run sequentially to avoid port conflicts
2. **Test Isolation**: Each test could use a fresh database
3. **Screenshot Testing**: Capture CLI output for visual regression testing
4. **Performance Benchmarks**: Track command execution times
5. **More Frameworks**: Add tests for Fastify, Koa, etc.
