# Quick Wins - Immediate Fixes

These are minimal, safe changes that can be applied immediately to improve the codebase.

---

## 1. Fix TypeScript Error in DynamoDB Adapter

**File:** `src/database/adapters/dynamodb.ts`

**Change:** Move the `DynamoConfig` type alias before the class definition

```typescript
// Before (lines 93-102)
export class DynamoDBConnection implements DatabaseConnection {
  id = 'dynamodb';
  type = 'dynamodb';
  isConnected = false;

  private config: DynamoDBConfig;
  private client: DynamoDBClient | null = null;
  private docClient: DocClient | null = null;

  constructor(config: DynamoConfig) {  // ERROR: DynamoConfig not defined yet
    this.config = config;
  }

// ... (lots of code) ...

// Line 458
type DynamoConfig = DynamoDBConfig;
```

```typescript
// After - Add this after line 91 (after imports and interfaces, before class)
// Type alias for config (must be defined before use)
type DynamoConfig = DynamoDBConfig;

export class DynamoDBConnection implements DatabaseConnection {
  // ... rest of class
  constructor(config: DynamoConfig) {  // Now valid
    this.config = config;
  }
```

---

## 2. Add Missing .gitattributes

**File:** `.gitattributes` (new file)

```gitattributes
# Auto detect text files and perform LF normalization
* text=auto

# Ensure shell scripts use LF
*.sh text eol=lf

# Ensure batch scripts use CRLF
*.bat text eol=crlf

# Mark lock files as generated
package-lock.json linguist-generated=true
yarn.lock linguist-generated=true
```

---

## 3. Improve .npmignore

**File:** `.npmignore`

```
# Tests
tests/
*.test.ts
*.test.js
*.spec.ts
*.spec.js
coverage/

# Development files
.github/
.vscode/
.idea/

# Documentation (keep README.md)
docs/
*.md
!README.md
!LICENSE

# Configuration files
.env
.env.*
.eslintrc*
.prettierrc*
jest.config.js
jest.integration.config.js
tsconfig.test.json
docker-compose.test.yml

# Build outputs
dist/*.map

# Scripts
scripts/
publish.sh

# Examples (not needed in npm package)
example/
example-nestjs/
example-nextjs/

# Misc
.DS_Store
*.log
test-results.json
errors.log
node_modules/
```

---

## 4. Update package.json Metadata

**File:** `package.json`

```json
{
  "name": "@eftech93/nodesh",
  "version": "0.0.2",
  "description": "Interactive shell for Node.js applications (Express, NestJS, etc.) with autocompletion",
  
  // Add these fields
  "bugs": {
    "url": "https://github.com/eftech93/nodesh/issues"
  },
  "homepage": "https://github.com/eftech93/nodesh#readme",
  "funding": {
    "type": "github",
    "url": "https://github.com/sponsors/eftech93"
  },
  "engines": {
    "node": ">=16.0.0"
  },
  "os": [
    "darwin",
    "linux",
    "win32"
  ],
  "cpu": [
    "x64",
    "arm64"
  ],
  
  // Add keywords
  "keywords": [
    "nodejs",
    "express",
    "nestjs",
    "nextjs",
    "console",
    "repl",
    "shell",
    "terminal",
    "cli",
    "interactive",
    "autocomplete",
    "active-record",
    "typescript",
    "mongodb",
    "redis",
    "bullmq",
    "prisma",
    "postgresql",
    "mysql",
    "neo4j",
    "dynamodb",
    "development-tools",
    "debugging"
  ]
}
```

---

## 5. Add CHANGELOG.md Template

**File:** `CHANGELOG.md` (new file)

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- TBD

### Changed
- TBD

### Deprecated
- TBD

### Removed
- TBD

### Fixed
- TBD

### Security
- TBD

## [0.0.2] - 2026-04-05

### Added
- Multi-database support (MongoDB, Redis, PostgreSQL, MySQL, Neo4j, DynamoDB, Prisma)
- NestJS loader with DI container integration
- Next.js loader with Server Actions support
- Intelligent autocomplete system
- Object introspection helpers (info, methods, props, type)
- API testing helpers
- Database seeding utilities
- Timing and performance helpers

### Features
- Framework auto-detection (Express, NestJS, Next.js)
- Hot reload functionality
- Persistent command history
- Syntax highlighting in REPL output
- Customizable REPL prompt and colors

## [0.0.1] - 2026-01-XX

### Added
- Initial release
- Basic Express console with REPL
- Model and service auto-loading
- Configuration via .nodesh.js
```

---

## 6. Add CONTRIBUTING.md Template

**File:** `CONTRIBUTING.md` (new file)

```markdown
# Contributing to NodeSH

Thank you for your interest in contributing to NodeSH! We welcome contributions from the community.

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/nodesh.git
   cd nodesh
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the project:
   ```bash
   npm run build
   ```
5. Run tests:
   ```bash
   npm test
   ```

## Development Workflow

### Building
```bash
npm run build      # Build TypeScript
npm run dev        # Watch mode
npm run clean      # Clean build artifacts
```

### Testing
```bash
npm test                    # Run unit tests
npm run test:coverage       # Run with coverage
npm run test:integration    # Run integration tests (requires Docker)
```

### Linting
```bash
npm run lint       # Run ESLint
```

## Pull Request Process

1. Create a new branch for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and add tests if applicable

3. Ensure all tests pass:
   ```bash
   npm test
   ```

4. Update documentation if needed

5. Commit your changes with a descriptive message:
   ```bash
   git commit -m "feat: add new feature description"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/) format:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting)
   - `refactor:` - Code refactoring
   - `test:` - Test changes
   - `chore:` - Build/tooling changes

6. Push to your fork and submit a Pull Request

## Code Style

- Use TypeScript for all new code
- Follow existing code formatting (2 spaces indentation)
- Add JSDoc comments for public APIs
- Write descriptive variable names
- Keep functions focused and small

## Reporting Issues

When reporting issues, please include:

- Node.js version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages and stack traces

## Questions?

Feel free to open an issue for questions or join our discussions.
```

---

## 7. Fix Security: Improve Environment Variable Masking

**File:** `src/console.ts` (around line 470)

```typescript
// Before
const isSensitive = /(password|secret|key|token|auth)/i.test(key);

// After
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /api[-_]?key/i,
  /auth/i,
  /token/i,
  /credential/i,
  /private/i,
  /database[-_]?url/i,
  /connection[-_]?string/i,
  /cert/i,
  /signature/i,
];

const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
```

---

## 8. Add FUNDING.yml

**File:** `.github/FUNDING.yml` (new file)

```yaml
# These are supported funding model platforms

github: [eftech93]
patreon: # Replace with a single Patreon username
open_collective: # Replace with a single Open Collective username
ko_fi: # Replace with a single Ko-fi username
tidelift: # Replace with a single Tidelift platform-name/package-name e.g., npm/@eftech93/nodesh
community_bridge: # Replace with a single Community Bridge project-name e.g., cloud-foundry
liberapay: # Replace with a single Liberapay username
issuehunt: # Replace with a single IssueHunt username
otechie: # Replace with a single Otechie username
lfx_crowdfunding: # Replace with a single LFX Crowdfunding project-name e.g., cloud-foundry
custom: ['https://www.buymeacoffee.com/eftech93']
```

---

## 9. Improve Error Messages in Loaders

**File:** `src/loader.ts` (and similar in other loaders)

```typescript
// Before
} catch (err) {
  console.warn(`Warning: Could not load ${file}: ${(err as Error).message}`);
}

// After
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : String(err);
  console.warn(chalk.yellow(`⚠️  Could not load ${file}:`), errorMessage);
  
  // In debug mode, show stack trace
  if (process.env.NODESH_DEBUG) {
    console.error(chalk.gray((err as Error).stack));
  }
}
```

---

## 10. Add Prettier Configuration

**File:** `.prettierrc` (new file)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

**Add to package.json scripts:**
```json
{
  "scripts": {
    "format": "prettier --write 'src/**/*.ts' 'tests/**/*.ts'",
    "format:check": "prettier --check 'src/**/*.ts' 'tests/**/*.ts'"
  }
}
```

---

## Summary

These quick wins can be applied in ~30 minutes and immediately improve:
- Code quality (TypeScript fix, error handling)
- Package hygiene (.npmignore, .gitattributes)
- Developer experience (CHANGELOG, CONTRIBUTING, prettier)
- Community (FUNDING.yml, package metadata)
