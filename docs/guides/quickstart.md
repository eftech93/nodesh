# Quick Start Guide

This guide will help you get started with NodeSH in minutes.

## 1. Prepare Your Project

Ensure your project has the standard structure. NodeSH auto-detects:

```
my-project/
├── package.json
├── src/
│   ├── app.js or main.ts
│   ├── models/
│   ├── services/
│   └── config/
└── node_modules/
```

## 2. Start Infrastructure (If Needed)

If your project uses databases, start them:

```bash
# Using Docker
docker-compose up -d

# Or start services individually
docker run -d -p 27017:27017 mongo
docker run -d -p 6379:6379 redis
```

## 3. Launch NodeSH

```bash
cd my-project
nodesh --yes
```

The `--yes` flag auto-generates configuration on first run.

## 4. Explore Your Application

Once loaded, you'll see available context:

```
✓ Loaded 12 files

Available context:
  Models: User, Order, Product
  Services: userService, orderService, productService
  Config: database, redis, jwt
```

### Query Database

```javascript
// Find all users
node> await User.find()

// Find with filter
node> await User.find({ isActive: true })

// Find one
node> const user = await User.findOne({ email: 'test@example.com' })

// Count documents
node> await User.countDocuments()
```

### Use Services

```javascript
// Create a user
node> await userService.create({
  email: 'alice@example.com',
  name: 'Alice Smith'
})

// Find by ID
node> await userService.findById('507f1f77bcf86cd799439011')

// Update
node> await userService.update(id, { name: 'Alice Johnson' })
```

### Check Application State

```javascript
// View loaded models
node> .models

// View loaded services  
node> .services

// View routes (Express)
node> .routes

// View configuration
node> .config

// View environment variables
node> .env
```

## 5. Use Autocompletion

Press `TAB` for intelligent autocompletion:

```javascript
// Complete properties
node> userService.<TAB>
// Shows: create, findById, findByEmail, update, delete, ...

// Filter by typing
node> userService.find<TAB>
// Shows: findById, findByEmail, findActive

// Deep completion
node> config.database.<TAB>
// Shows: url, host, port, name
```

## 6. Object Introspection

Use built-in helpers to explore objects:

```javascript
// Get detailed info
node> info(userService)
// Returns: { name, type, constructor, properties, methods }

// List methods
node> methods(userService)
// Returns: ['create', 'findById', 'findByEmail', ...]

// List properties
node> props(config)
// Returns: ['env', 'port', 'database', ...]

// Get type
node> type(userService)
// Returns: 'UserService'
```

## 7. Reload After Changes

After modifying your code:

```javascript
node> .reload
```

This reloads all application files without restarting the shell.

## 8. Exit the Shell

```javascript
node> .exit
// Or press Ctrl+C twice
// Or press Ctrl+D
```

## Next Steps

- Learn about [Configuration](configuration.md)
- Explore [Shell Commands](shell-commands.md)
- Read about [Autocompletion](autocompletion.md)
- Check [Framework-specific guides](express.md)
