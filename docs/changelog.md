# Changelog

All notable changes to NodeSH are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2024

### Added

- Initial release of NodeSH
- Interactive shell for Node.js applications
- Support for Express, NestJS, and Next.js frameworks
- Intelligent autocompletion with deep property completion
- Object introspection helpers (`info()`, `methods()`, `props()`, `type()`)
- Auto-detection of framework type
- Configuration via `.nodesh.js`, `.nodesh.json`, or `package.json`
- Hot reload with `.reload` command
- Built-in REPL commands: `.routes`, `.models`, `.services`, `.config`, `.env`
- Command history persistence
- Syntax highlighting for output
- Multi-database support:
  - MongoDB (Mongoose)
  - PostgreSQL (pg)
  - MySQL (mysql2)
  - Redis (ioredis)
  - Prisma
  - Neo4j
  - DynamoDB
- Testing helpers:
  - `run()` - Run with timing
  - `measure()` - Measure execution time
  - `batch()` - Run operations in batches
  - `http` - HTTP client for API testing
  - `ApiTester` - Structured API testing
  - `debugApi()` - Debug API calls
  - `seed()` - Data seeding utilities
  - `clear()` - Clear collections
  - `showStats()` - Database statistics
- Format utilities:
  - `formatTable()` - Format data as table
  - `formatBytes()` - Format byte sizes
  - `formatDuration()` - Format durations
- Full TypeScript support with type definitions
- Comprehensive test suite using Jest
- Documentation website using Docsify

### Features

- **Framework Agnostic**: Works with Express, NestJS, and Next.js
- **Auto-Loading**: Automatically loads models, services, and config files
- **Intelligent Autocompletion**: Tab completion for properties, methods, and nested objects
- **Object Introspection**: Built-in helpers to explore objects
- **Hot Reload**: Reload app without restarting shell
- **Multi-Database**: Support for 7+ database types
- **Testing Utilities**: Built-in helpers for testing and debugging
- **TypeScript First**: Written in TypeScript with full type support

### CLI

- `nodesh` command with multiple aliases (`nsh`, `eft`)
- Auto-configuration with `--yes` flag
- Framework detection and configuration
- Customizable prompt and colors

### Documentation

- Comprehensive README
- API documentation
- Framework-specific guides
- Usage examples
- Test reports

## Future Releases

### Planned for 0.1.0

- Plugin system for custom commands
- Enhanced autocomplete with fuzzy matching
- Database migration helpers
- Improved NestJS DI container integration
- Better Next.js App Router support

### Planned for 0.2.0

- Custom REPL themes
- Remote debugging support
- Performance profiling tools
- Integration with popular ORMs

### Planned for 1.0.0

- Stable API
- Full plugin ecosystem
- Advanced debugging features
- Enterprise features

---

[0.0.1]: https://github.com/eftech93/nodesh/releases/tag/v0.0.1
