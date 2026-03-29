# Getting Started

Welcome to NodeSH! This guide will help you get up and running quickly.

## What is NodeSH?

NodeSH is an interactive shell for Node.js applications. It provides:

- An interactive REPL environment
- Intelligent autocompletion
- Automatic loading of your application context
- Deep object introspection
- Hot reload capabilities
- Built-in testing helpers

## Installation

### Global Installation (Recommended)

```bash
npm install -g @eftech93/nodesh
```

This makes `nodesh`, `nsh`, and `eft` commands available everywhere.

### Local Installation

```bash
npm install --save-dev @eftech93/nodesh
```

Add to your `package.json`:

```json
{
  "scripts": {
    "console": "nodesh --yes"
  }
}
```

## Quick Start

### 1. Navigate to Your Project

```bash
cd my-nodejs-project
```

### 2. Start NodeSH

```bash
nodesh --yes
```

The `--yes` flag auto-generates configuration on first run.

### 3. Start Coding

Once loaded, you'll see available context:

```
✓ Loaded 12 files

Available context:
  Models: User, Order, Product
  Services: userService, orderService, productService
```

Now you can interact with your application:

```javascript
// Query database
node> await User.find({ isActive: true })

// Use services
node> await userService.create({ email: 'test@example.com' })

// Check state
node> await cacheService.getStats()

// Test your API endpoints
node> await apiService.local('GET', '/users')
node> await apiService.get('https://api.example.com/data')

// Manage queues
node> await queueDashboardController.getAllQueueStatuses()
node> await queueDashboardController.retryJob('email', 'job-id-123')

// Reload after code changes
node> .reload
```

## Framework Detection

NodeSH automatically detects your framework:

| Framework | Detection Method | Prompt |
|-----------|-----------------|--------|
| Express | `express` in dependencies | `express>` |
| NestJS | `@nestjs/core` in dependencies | `nest>` |
| Next.js | `next` in dependencies | `next>` |

## Configuration

NodeSH creates a `.nodesh.js` file on first run:

```javascript
module.exports = {
  appEntry: 'src/app.js',
  modelsDir: 'src/models',
  servicesDir: 'src/services',
  prompt: 'node> ',
  useColors: true
};
```

See the [Configuration Guide](configuration.md) for all options.

## Next Steps

- Learn about [Shell Commands](shell-commands.md)
- Explore [Autocompletion](autocompletion.md)
- Use [Object Introspection](introspection.md)
- Read framework-specific guides: [Express](express.md), [NestJS](nestjs.md), [Next.js](nextjs.md)
- Try [Testing Helpers](testing-helpers.md)
