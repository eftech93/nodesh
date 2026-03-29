# Express.js Guide

NodeSH works seamlessly with Express.js applications, providing an interactive console experience.

## Setup

### 1. Project Structure

Standard Express project structure:

```
my-express-app/
├── src/
│   ├── app.js              # Express app setup
│   ├── server.js           # Server entry point
│   ├── models/             # Database models
│   │   ├── User.js
│   │   └── Order.js
│   ├── services/           # Business logic
│   │   ├── userService.js
│   │   └── orderService.js
│   ├── routes/             # Route definitions
│   └── config/             # Configuration
│       └── database.js
├── package.json
└── .nodesh.js              # NodeSH config (auto-generated)
```

### 2. Installation

```bash
npm install -g @eftech93/nodesh

# In your project
nodesh --yes
```

### 3. Auto-Configuration

NodeSH automatically detects Express projects and generates:

```javascript
// .nodesh.js
module.exports = {
  appEntry: 'src/app.js',
  modelsDir: 'src/models',
  servicesDir: 'src/services',
  prompt: 'express> ',
  useColors: true
};
```

## Using the Shell

### Start the Console

```bash
nodesh

# Or
nsh
```

### Available Context

Once loaded, you have access to:

```javascript
express> // Your loaded models
express> User
express> Order

// Your services
express> userService
express> orderService

// Express app instance
express> app

// Configuration
express> config
```

### Common Operations

#### Database Queries

```javascript
// Find all users
express> await User.find()

// Find with filter
express> await User.find({ isActive: true })

// Find one
express> await User.findOne({ email: 'test@example.com' })

// Count
express> await User.countDocuments()
```

#### Using Services

```javascript
// Create user
express> await userService.create({
  email: 'alice@example.com',
  password: 'password123',
  name: 'Alice Smith'
})

// Find by ID
express> await userService.findById('507f1f77bcf86cd799439011')

// Update
express> await userService.update(id, { name: 'Alice Johnson' })

// Delete
express> await userService.delete(id)
```

#### View Routes

```javascript
express> .routes

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

## Working with Middleware

### Access App Instance

```javascript
express> app
// Express app instance with all middleware loaded

// Check middleware stack
express> app._middleware
```

### Test Middleware

```javascript
// Create mock request/response
express> const req = { body: { email: 'test@test.com' } }
express> const res = { json: (data) => console.log(data) }
express> await someMiddleware(req, res, () => {})
```

## Database Integration

### MongoDB with Mongoose

```javascript
// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
```

In the shell:

```javascript
express> await User.find().limit(5)
express> await User.create({ email: 'test@test.com', name: 'Test' })
express> await User.updateOne({ _id: id }, { $set: { name: 'Updated' } })
```

### Sequelize (PostgreSQL/MySQL)

```javascript
// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, unique: true },
  name: DataTypes.STRING,
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
});

module.exports = User;
```

In the shell:

```javascript
express> await User.findAll({ limit: 5 })
express> await User.create({ email: 'test@test.com', name: 'Test' })
express> await User.update({ name: 'Updated' }, { where: { id } })
```

## Service Layer Pattern

### Example Service

```javascript
// services/userService.js
const User = require('../models/User');
const bcrypt = require('bcrypt');

class UserService {
  async create(data) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return User.create({
      ...data,
      password: hashedPassword
    });
  }

  async findById(id) {
    return User.findById(id);
  }

  async findByEmail(email) {
    return User.findOne({ email });
  }

  async findActive() {
    return User.find({ isActive: true });
  }

  async update(id, updates) {
    return User.findByIdAndUpdate(id, updates, { new: true });
  }

  async delete(id) {
    return User.findByIdAndDelete(id);
  }

  async authenticate(email, password) {
    const user = await this.findByEmail(email);
    if (!user) return null;
    
    const valid = await bcrypt.compare(password, user.password);
    return valid ? user : null;
  }
}

module.exports = new UserService();
```

## Configuration

### Environment-Based Config

```javascript
// .nodesh.js
module.exports = {
  appEntry: process.env.NODE_ENV === 'production' 
    ? 'dist/app.js' 
    : 'src/app.js',
  modelsDir: process.env.NODE_ENV === 'production'
    ? 'dist/models'
    : 'src/models',
  prompt: process.env.NODE_ENV === 'production' ? 'prod> ' : 'dev> ',
  context: {
    moment: require('moment'),
    _: require('lodash')
  }
};
```

## Hot Reload

After making code changes:

```javascript
express> .reload
Reloading...
✓ Reloaded successfully
```

## Best Practices

1. **Organize by Feature**
   ```
   src/
   ├── users/
   │   ├── user.model.js
   │   ├── user.service.js
   │   └── user.routes.js
   └── orders/
       ├── order.model.js
       ├── order.service.js
       └── order.routes.js
   ```

2. **Use Services for Business Logic**
   - Keep controllers thin
   - Testable business logic
   - Reusable in console

3. **Export Service Instances**
   ```javascript
   // services/userService.js
   class UserService { ... }
   module.exports = new UserService(); // Export instance
   ```

4. **Async/Await**
   - All shell operations are async
   - Use `await` for all database calls

5. **Error Handling**
   ```javascript
   express> try {
   ...   await userService.create({ email: 'invalid' })
   ... } catch (err) {
   ...   console.error('Error:', err.message)
   ... }
   ```

## Complete Example

See the `example/` directory for a complete Express + MongoDB + Redis application with NodeSH integration.

```bash
cd example
npm install
npm run docker:up
npm run console
```
