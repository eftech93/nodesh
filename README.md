# NodeSH

A Rails-like interactive shell for Node.js applications. Works with **Express**, **NestJS**, and any Node.js framework. Load your entire app context—models, services, configs, databases—and interact with them in a REPL with autocompletion.

Built with TypeScript for full type safety.

![Node Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## Features

- 🚀 **Framework Agnostic** - Works with Express, NestJS, or vanilla Node.js
- 🔄 **Auto-Detection** - Automatically detects Express vs NestJS projects
- 📦 **Auto-Loading** - Automatically loads models, services, config files
- 🎯 **Intelligent Autocompletion** - Deep tab completion for object properties, methods, and prototype chains
  - Completes instance methods: `userService.findById`, `orderService.create`
  - Completes static methods: `User.find`, `User.create`
  - Completes nested properties: `config.database.url`
  - Discovers inherited methods from prototype chains
- 🔍 **Object Introspection** - Built-in helper methods to explore objects
  - `info(obj)` - Get detailed metadata about any object
  - `methods(obj)` - List all methods of an object
  - `props(obj)` - List all properties of an object
  - `type(obj)` - Get the type of an object
- 🔄 **Hot Reload** - Reload your app without restarting the shell
- 🎨 **Syntax Highlighting** - Colorized output for better readability
- 📜 **Command History** - Persistent history across sessions
- 🔷 **Full TypeScript Support** - Written in TypeScript, includes type definitions
- 🔧 **Customizable** - Configure via `.nodesh.js` or `package.json`

## Installation

### Global Install (Recommended)

```bash
npm install -g @eftech93/nodesh
```

Then use it with any project:

```bash
cd my-project
nodesh --yes

# Or use the shorter aliases:
nsh --yes     # 3 characters
eft --yes     # EFTECH93 brand
```

### Local Install (Per Project)

```bash
npm install --save-dev @eftech93/nodesh
```

## Quick Start

### 1. Start Your Infrastructure

If using MongoDB/Redis (see examples):

```bash
docker-compose -f docker-compose.yml up -d
```

### 2. Launch the Shell

```bash
# Auto-detects Express or NestJS
cd my-project
nodesh

# Auto-generate config on first run
nodesh --yes

# Shorter aliases (all do the same thing):
nsh --yes     # 3 characters - shortest!
eft --yes     # EFTECH93 brand
```

### 3. Start Coding

```javascript
// Query database
node> await User.find({ isActive: true })

// Use services
node> await userService.create({ email: 'test@example.com' })

// Check cache
node> await cacheService.getStats()

// View queues
node> await queueService.getAllStatuses()

// Reload after code changes
node> .reload
```

## Auto-Configuration

On first run, `nodesh` automatically:

1. **Detects your framework** (Express or NestJS)
2. **Detects TypeScript** (checks for `tsconfig.json`)
3. **Generates appropriate config** (`.nodesh.js`)

| Detected | Prompt | Entry Point |
|----------|--------|-------------|
| Express | `express>` | `src/app.js` |
| NestJS | `nest>` | `src/main.ts` |
| TypeScript | Same | `.ts` extensions |

## Configuration

### Via `.nodesh.js`

```javascript
module.exports = {
  // Path to your app entry file
  appEntry: 'src/app.js',
  
  // Directories to auto-load
  modelsDir: 'src/models',
  servicesDir: 'src/services',
  helpersDir: 'helpers',
  configDir: 'config',
  
  // REPL settings
  prompt: 'myapp> ',
  useColors: true,
  historyFile: '~/.myapp_history',
  
  // Custom context
  context: {
    db: require('./src/database'),
    redis: require('./src/redis'),
  }
};
```

### Via `package.json`

```json
{
  "nodesh": {
    "appEntry": "src/server.js",
    "prompt": "api> ",
    "useColors": true
  }
}
```

## Shell Commands

Type these in the shell (with the `.` prefix):

| Command | Description |
|---------|-------------|
| `.reload` | Reload all application files |
| `.routes` | List all Express routes |
| `.models` | Show loaded models |
| `.services` | List loaded services |
| `.config` | Display configuration |
| `.env` | Show environment variables |
| `.clear` | Clear screen |
| `.help` | Show help |
| `.exit` | Exit shell |

## CLI Options

```bash
nodesh [path] [options]

Options:
  -e, --entry <file>      Path to app entry file
  -r, --root <path>       Project root directory
  --no-color              Disable colored output
  -p, --prompt <string>   REPL prompt string
  --env <environment>     Set NODE_ENV (default: development)
  --nestjs                Force NestJS mode detection
  --express               Force Express mode (skip NestJS detection)
  --init                  Create config file (auto-detects type)
  -y, --yes               Auto-generate config if not found
  -h, --help              Display help
  -V, --version           Display version
```

## Examples

### Express + MongoDB + Redis + BullMQ

See `example/` directory for a complete Express application with:
- MongoDB (Mongoose)
- Redis (caching)
- BullMQ (job queues)
- Full CRUD services

```bash
cd example
npm install
npm run docker:up
npm run console
```

### NestJS + MongoDB + Redis + BullMQ

See `example-nestjs/` directory for a complete NestJS application with:
- MongoDB (Mongoose)
- Redis (caching)
- BullMQ (queues with processors)
- Full feature modules

```bash
cd example-nestjs
npm install
npm run docker:up
npm run build
npm run console
```

## Intelligent Autocomplete

The shell provides intelligent autocompletion for exploring your application's objects:

```javascript
// Press TAB after the dot to see available methods
node> userService.<TAB>
// Shows: create, findById, findByEmail, findActive, update, delete, authenticate, getStats, clearCache

// Partial completion - type a few letters and press TAB
node> userService.find<TAB>
// Shows: findById, findByEmail, findActive

// Static/class methods on models
node> User.<TAB>
// Shows: find, findOne, findById, create, updateOne, deleteOne, countDocuments

// Deep nested property access
node> config.database.<TAB>
// Shows: url, host, port, name

// Array/Collection methods
node> users.map<TAB>
// Shows: map, filter, reduce, forEach, find, etc.
```

### Object Introspection Helpers

Special helper functions are available in the shell to explore objects:

```javascript
// Get detailed information about any object
node> info(userService)
// Returns:
// {
//   name: 'userService',
//   type: 'UserService',
//   constructor: 'UserService',
//   properties: [...],
//   methods: [...]
// }

// List all methods of an object
node> methods(userService)
// Returns: ['create', 'findById', 'findByEmail', 'findActive', 'update', 'delete', ...]

// List all properties (non-methods) of an object
node> props(config)
// Returns: ['env', 'port', 'database', 'redis', 'jwt']

// Get the type of any value
node> type(userService)
// Returns: 'UserService'

node> type(User)
// Returns: 'Object' or the class name
```

## Shell Session Examples

### Express Example

```javascript
express> await UserService.create({
  email: 'alice@example.com',
  password: 'password123',
  name: { first: 'Alice', last: 'Smith' }
})

express> const user = await UserService.findByEmail('alice@example.com')
express> await OrderService.create(user._id, items, shippingAddress)
express> await QueueService.getAllStatuses()
express> await CacheService.getStats()
```

### NestJS Example

```javascript
nest> const user = await usersService.create({
  email: 'bob@example.com',
  password: 'password123',
  name: { first: 'Bob', last: 'Jones' }
})

nest> await usersService.findById(user._id.toString())
nest> await ordersService.create(user._id.toString(), items, address)
nest> await queuesService.getAllStatuses()
nest> await cacheService.getStats()
```

## Global Installation Guide

When installed globally (`npm install -g @eftech93/nodesh`), you can use it with any project:

```bash
# Navigate to any project
cd ~/projects/my-api

# Run shell (auto-detects project type)
nodesh

# Auto-generate config on first run
nodesh --yes
```

## TypeScript Usage

The library is written in TypeScript and includes full type definitions.

```typescript
import { ExpressConsole, AppLoader } from '@eftech93/nodesh';

async function startConsole(): Promise<void> {
  const console = new ExpressConsole({
    rootPath: __dirname,
    appEntry: 'app.ts',
    prompt: 'dev> '
  });

  await console.start();
}
```

## Programmatic API

### Using the Intelligent Completer

You can use the autocomplete functionality in your own code:

```typescript
import { IntelligentCompleter } from '@eftech93/nodesh';

const context = {
  userService: new UserService(),
  orderService: new OrderService()
};

const completer = new IntelligentCompleter(context);

// Get completions for a partial input
const [completions] = completer.complete('userService.find');
console.log(completions); // ['findById', 'findByEmail', 'findActive']

// Introspect an object
const metadata = completer.introspect('userService');
console.log(metadata.properties);
console.log(metadata.type);
console.log(metadata.constructor);

// Get type information
const type = completer.getTypeName(context.userService);
console.log(type); // 'UserService'
```

### Creating Custom REPL with Autocomplete

```typescript
import { createCompleter, addIntrospectionMethods } from '@eftech93/nodesh';
import repl from 'repl';

const context = {
  myService: new MyService()
};

const replServer = repl.start({
  prompt: 'myapp> ',
  completer: createCompleter(context)
});

// Add introspection helpers
addIntrospectionMethods(replServer.context);
Object.assign(replServer.context, context);
```

## Development

### Running Tests

The library includes comprehensive unit tests using Jest:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Test Structure

Tests are organized in the `tests/` directory:

- `autocomplete.test.ts` - Tests for intelligent autocomplete functionality
- `config.test.ts` - Tests for configuration loading
- `loader.test.ts` - Tests for application loading
- `console.test.ts` - Tests for the main console class
- `types.test.ts` - Tests for TypeScript type definitions

### Building

```bash
# Build TypeScript to JavaScript
npm run build

# Build in watch mode
npm run dev

# Clean build artifacts
npm run clean
```

## Troubleshooting

### MongoDB/Redis Connection Issues

Make sure your infrastructure is running:

```bash
docker-compose up -d
```

### Module Not Found

The shell will show warnings but continue. Fix paths in `.nodesh.js`:

```javascript
module.exports = {
  modelsDir: 'dist/models',  // For compiled TS
  servicesDir: 'dist/services'
};
```

### App Not Found

Specify the entry file explicitly:

```bash
nodesh --entry dist/main.js
```

## Docker Compose (For Examples)

Included `docker-compose.yml` provides:

| Service | Port | Description |
|---------|------|-------------|
| MongoDB | 27017 | Database |
| Redis | 6379 | Cache & Queue |
| Redis Commander | 8081 | Redis UI |

```bash
docker-compose up -d
docker-compose down
```

## Inspired By

- [Rails Console](https://guides.rubyonrails.org/command_line.html#bin-rails-console)
- [Django Shell](https://docs.djangoproject.com/en/stable/ref/django-admin/#shell)
- [Laravel Tinker](https://github.com/laravel/tinker)

## License

MIT
