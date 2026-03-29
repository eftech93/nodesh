# Contributing

Thank you for your interest in contributing to NodeSH!

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/eftech93/nodesh.git
cd nodesh
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Project

```bash
npm run build
```

### 4. Run Tests

```bash
npm test
```

## Project Structure

```
nodesh/
├── src/                    # Source code
│   ├── autocomplete.ts     # Autocomplete functionality
│   ├── cli.ts              # CLI entry point
│   ├── config.ts           # Configuration handling
│   ├── console.ts          # Main console class
│   ├── loader.ts           # App loader
│   ├── nestjs-loader.ts    # NestJS loader
│   ├── nextjs-loader.ts    # Next.js loader
│   ├── types.ts            # TypeScript types
│   ├── database/           # Database adapters
│   ├── helpers/            # Helper utilities
│   └── utils/              # Utility functions
├── tests/                  # Test files
├── docs/                   # Documentation
├── example/                # Express example
└── example-nestjs/         # NestJS example
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/my-feature
# or
git checkout -b fix/my-bugfix
```

### 2. Make Changes

Edit source files in `src/` and corresponding tests in `tests/`.

### 3. Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- autocomplete.test.ts

# Run with coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

### 4. Build and Verify

```bash
npm run build
npm test
```

### 5. Commit Changes

```bash
git add .
git commit -m "feat: add new feature"
```

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `test:` - Tests
- `refactor:` - Code refactoring
- `chore:` - Maintenance

### 6. Push and Create PR

```bash
git push origin feature/my-feature
```

Create a pull request on GitHub.

## Coding Standards

### TypeScript

- Use strict TypeScript
- Add type annotations for function parameters and return types
- Use interfaces for object shapes

### Code Style

```typescript
// Good
interface UserService {
  findById(id: string): Promise<User | null>;
  create(data: CreateUserDto): Promise<User>;
}

class UserServiceImpl implements UserService {
  async findById(id: string): Promise<User | null> {
    return this.repository.findById(id);
  }
}

// Avoid
class UserService {
  findById(id) {
    return this.repository.findById(id);
  }
}
```

### Naming Conventions

- Classes: `PascalCase` (e.g., `ExpressConsole`)
- Functions/Variables: `camelCase` (e.g., `loadConfig`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `CONFIG_FILES`)
- Files: `kebab-case.ts` (e.g., `autocomplete.ts`)

## Testing Guidelines

### Write Comprehensive Tests

```typescript
describe('MyFeature', () => {
  // Test happy path
  it('should work with valid input', async () => {
    // ...
  });

  // Test edge cases
  it('should handle empty input', async () => {
    // ...
  });

  // Test error cases
  it('should throw on invalid input', async () => {
    // ...
  });
});
```

### Test Organization

```typescript
describe('FeatureName', () => {
  let feature: Feature;

  beforeEach(() => {
    feature = new Feature();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('methodName', () => {
    it('should do something', () => {
      // Test
    });
  });
});
```

## Documentation

### Code Comments

```typescript
/**
 * Loads configuration from various sources
 * @param rootPath - Path to project root
 * @returns Merged configuration object
 */
export function loadConfig(rootPath?: string): ConsoleConfig {
  // Implementation
}
```

### Update Documentation

When adding features, update:

1. JSDoc comments in code
2. API documentation in `docs/api/`
3. Guides in `docs/guides/`
4. README.md if needed

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create a git tag
4. Push to trigger release

```bash
npm version patch  # or minor, major
npm run release
```

## Getting Help

- Open an issue on [GitHub](https://github.com/eftech93/nodesh/issues)
- Join discussions
- Check existing documentation

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Respect differing viewpoints

Thank you for contributing to NodeSH!
