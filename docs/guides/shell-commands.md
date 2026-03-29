# Shell Commands

NodeSH provides built-in commands accessible with the `.` prefix.

## Available Commands

| Command | Description |
|---------|-------------|
| `.reload` | Reload all application files |
| `.routes` | List all Express routes |
| `.models` | Show loaded models |
| `.services` | List loaded services |
| `.config` | Display configuration |
| `.env` | Show environment variables |
| `.clear` | Clear the screen |
| `.help` | Show help message |
| `.exit` | Exit the shell |

## Command Details

### .reload

Reloads all application files without restarting the shell. Useful after making code changes.

```javascript
node> .reload
Reloading...
✓ Reloaded successfully
```

### .routes

Displays all registered Express routes.

```javascript
node> .routes

Routes:
──────────────────────────────────────────────────
GET        /api/users
POST       /api/users
GET        /api/users/:id
PUT        /api/users/:id
DELETE     /api/users/:id
GET        /api/orders
POST       /api/orders
```

### .models

Lists all loaded model files.

```javascript
node> .models

Models:
  User          src/models/User.js
  Order         src/models/Order.js
  Product       src/models/Product.js
```

### .services

Lists all loaded service files.

```javascript
node> .services

Services:
  userService       src/services/userService.js
  orderService      src/services/orderService.js
  productService    src/services/productService.js
```

### .config

Displays the current configuration.

```javascript
node> .config

Configuration:
──────────────────────────────────────────────────
NODE_ENV: development

App Configuration:
{
  "port": 3000,
  "database": {
    "url": "mongodb://localhost:27017/myapp",
    "options": { ... }
  }
}
```

### .env

Shows environment variables (sensitive values are masked).

```javascript
node> .env

Environment Variables:
──────────────────────────────────────────────────
NODE_ENV=development
PORT=3000
DATABASE_URL=mongodb://localhost:27017/myapp
JWT_SECRET=***
API_KEY=***
```

### .clear

Clears the terminal screen.

```javascript
node> .clear
```

### .help

Shows all available commands and context information.

```javascript
node> .help

NodeSH Commands:
──────────────────────────────────────────────────
.reload    - Reload all application files
.routes    - List all Express routes
.models    - List all loaded models
.services  - List all loaded services
.config    - Show application configuration
.env       - Show environment variables
.clear     - Clear the screen
.exit      - Exit the console
.help      - Show this help message

Available context:
  Models: User, Order, Product
  Services: userService, orderService, productService
```

### .exit

Exits the shell. Equivalent to pressing `Ctrl+C` twice or `Ctrl+D`.

```javascript
node> .exit

Goodbye!
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+C` | Interrupt current command |
| `Ctrl+C` (twice) | Exit shell |
| `Ctrl+D` | Exit shell |
| `Ctrl+L` | Clear screen |
| `Tab` | Autocomplete |
| `Tab` (twice) | Show all completions |
| `Up/Down` | Navigate command history |
| `Ctrl+R` | Reverse search history |

## Command History

NodeSH maintains command history across sessions:

```javascript
// Press Up arrow to see previous commands
// Press Down arrow to go forward

// Search history with Ctrl+R
(reverse-i-search): find
```

History is saved to `~/.nodesh_history` by default.

## Creating Custom Commands

You can add custom methods to the context in your config:

```javascript
// .nodesh.js
module.exports = {
  context: {
    // Custom helper
    async stats() {
      return {
        users: await User.countDocuments(),
        orders: await Order.countDocuments(),
        uptime: process.uptime()
      };
    },
    
    // Clear all caches
    async clearAllCaches() {
      await cacheService.clear();
      await redisService.flushAll();
      return 'All caches cleared';
    }
  }
};
```

Then use in the shell:

```javascript
node> await stats()
{ users: 150, orders: 423, uptime: 3600 }

node> await clearAllCaches()
'All caches cleared'
```
