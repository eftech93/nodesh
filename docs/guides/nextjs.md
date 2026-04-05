# Next.js Guide

NodeSH supports Next.js applications, allowing you to interact with your API routes, database connections, and utilities in a REPL environment.

## Setup

### 1. Project Structure

Standard Next.js project structure:

```
my-nextjs-app/
├── src/
│   ├── app/                    # App Router (Next.js 13+)
│   │   ├── api/
│   │   │   ├── users/
│   │   │   │   └── route.ts
│   │   │   └── orders/
│   │   │       └── route.ts
│   │   └── page.tsx
│   ├── lib/                    # Utilities and helpers
│   │   ├── db.ts
│   │   └── auth.ts
│   ├── models/                 # Database models
│   │   └── user.ts
│   └── services/               # Business logic
│       └── userService.ts
├── pages/                      # Pages Router (optional)
│   └── api/
├── package.json
└── .nodesh.js                  # NodeSH config (auto-generated)
```

### 2. Installation

```bash
npm install -g @eftech93/nodesh

# In your Next.js project
nodesh --yes
```

### 3. Auto-Configuration

NodeSH detects Next.js projects and generates:

```javascript
// .nodesh.js
module.exports = {
  appEntry: null,  // Next.js doesn't have a traditional entry
  modelsDir: 'src/models',
  servicesDir: 'src/services',
  helpersDir: 'src/lib',
  prompt: 'next> ',
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
next> // Your models
next> User
next> Post

// Your services
next> userService
next> postService

// Utilities
next> db
next> auth

// Environment
next> process.env
```

### Common Operations

#### Database Queries

```javascript
// Prisma example
next> await prisma.user.findMany()
next> await prisma.user.findUnique({ where: { id: '123' } })
next> await prisma.user.create({
...   data: {
...     email: 'test@example.com',
...     name: 'Test User'
...   }
... })

// Mongoose example
next> await User.find().limit(10)
next> await User.findById('123')
```

#### Using Services

```javascript
// Call service methods
next> await userService.getAllUsers()
next> await userService.createUser({
...   email: 'test@example.com',
...   name: 'Test User'
... })
next> await userService.updateUser('123', { name: 'Updated' })
```

#### Testing Utilities

```javascript
// Test database connection
next> await db.$connect()
next> await db.$queryRaw`SELECT 1`

// Test auth functions
next> await auth.verifyToken(token)
next> await auth.hashPassword('password123')
```

## Database Integration

### Connection Status Checking

NodeSH provides helpers to check database connection status:

```javascript
// Check all connections
next> await ensureConnected()
// => {
//   connected: true,
//   connections: {
//     mongodb: { connected: true },
//     postgresql: { connected: true },
//     redis: { connected: false, error: 'Connection refused' }
//   }
// }

// Get individual connections safely (returns undefined if not connected)
next> const connections = getConnections()
next> connections.mongo   // MongoDB connection or undefined
next> connections.pg     // PostgreSQL connection or undefined
next> connections.redis  // Redis connection or undefined
next> connections.mysql  // MySQL connection or undefined
next> connections.neo4j  // Neo4j connection or undefined
next> connections.dynamo // DynamoDB connection or undefined
```

### Prisma (Recommended)

```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

In the shell:

```javascript
next> await prisma.user.findMany({
...   where: { isActive: true },
...   include: { posts: true }
... })
```

### Mongoose

```typescript
// lib/db.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;
  
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
```

In the shell:

```javascript
next> await connectDB()
next> await User.find()
```

## API Route Testing

### Test API Handlers

```typescript
// app/api/users/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const users = await prisma.user.findMany();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const data = await request.json();
  const user = await prisma.user.create({ data });
  return NextResponse.json(user, { status: 201 });
}
```

In the shell:

```javascript
// Import and test handler directly
next> const { GET, POST } = require('./src/app/api/users/route')

// Mock request
next> const mockRequest = new Request('http://localhost/api/users', {
...   method: 'POST',
...   body: JSON.stringify({ email: 'test@test.com', name: 'Test' })
... })

// Test handler
next> const response = await POST(mockRequest)
next> await response.json()
```

### Using API Test Helpers

```javascript
next> const { http, ApiTester } = require('@eftech93/nodesh')

// Configure for your app
next> http.defaults.baseURL = 'http://localhost:3000/api'

// Make requests
next> await http.get('/users')
next> await http.post('/users', {
...   email: 'test@example.com',
...   name: 'Test User'
... })
```

## Service Layer

### Example Service

```typescript
// services/userService.ts
import { prisma } from '@/lib/db';

export class UserService {
  async getAllUsers() {
    return prisma.user.findMany({
      include: { posts: true }
    });
  }

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { posts: true }
    });
  }

  async createUser(data: CreateUserInput) {
    return prisma.user.create({ data });
  }

  async updateUser(id: string, data: UpdateUserInput) {
    return prisma.user.update({
      where: { id },
      data
    });
  }

  async deleteUser(id: string) {
    return prisma.user.delete({ where: { id } });
  }
}

export const userService = new UserService();
```

In the shell:

```javascript
next> await userService.getAllUsers()
next> await userService.createUser({
...   email: 'test@example.com',
...   name: 'Test User'
... })
next> await userService.updateUser('123', { name: 'Updated' })
```

## Environment Variables

### Access in Shell

```javascript
next> process.env.DATABASE_URL
next> process.env.NEXT_PUBLIC_API_URL
next> process.env.JWT_SECRET
```

### Test Different Environments

```bash
# Development
NODE_ENV=development nodesh

# Production (be careful!)
NODE_ENV=production nodesh
```

## Configuration

### Custom Configuration

```javascript
// .nodesh.js
module.exports = {
  appEntry: null,
  modelsDir: 'src/models',
  servicesDir: 'src/services',
  helpersDir: 'src/lib',
  configDir: 'src/config',
  prompt: 'next-dev> ',
  useColors: true,
  context: {
    // Prisma client
    prisma: require('./src/lib/db').prisma,
    
    // Utilities
    dayjs: require('dayjs'),
    
    // Custom helpers
    formatDate: (date) => dayjs(date).format('YYYY-MM-DD')
  }
};
```

## App Router vs Pages Router

### App Router (Next.js 13+)

For App Router projects, NodeSH loads:
- Services from `src/services/`
- Models from `src/models/`
- Utilities from `src/lib/`

### Pages Router

For Pages Router projects, NodeSH also loads:
- API routes from `pages/api/`

```javascript
next> // Access API handlers
next> const usersAPI = require('./pages/api/users')
next> usersAPI.default  // Default export
```

## Testing Edge Runtime

### Edge Functions

```typescript
// app/api/edge/route.ts
export const runtime = 'edge';

export async function GET(request: Request) {
  return new Response(JSON.stringify({ message: 'Hello from Edge' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

In the shell:

```javascript
next> const { GET } = require('./src/app/api/edge/route')
next> const response = await GET(new Request('http://localhost'))
next> await response.json()
```

## Best Practices

1. **Keep Services Framework-Agnnostic**
   ```typescript
   // services can be used in both API routes and shell
   export class UserService {
     async create(data) { ... }
   }
   ```

2. **Use Environment Variables**
   ```javascript
   // In shell
   next> process.env.NODE_ENV
   'development'
   ```

3. **Test Database Queries**
   ```javascript
   next> await prisma.$queryRaw`EXPLAIN SELECT * FROM users`
   ```

4. **Check Query Performance**
   ```javascript
   next> const { measure } = require('@eftech93/nodesh')
   next> await measure(() => 
   ...   prisma.user.findMany({ include: { posts: true } })
   ... )
   ```

5. **Seed Data for Testing**
   ```javascript
   next> const { seed } = require('@eftech93/nodesh')
   next> await seed({
   ...   count: 10,
   ...   create: (i) => prisma.user.create({
   ...     data: { email: `user${i}@test.com`, name: `User ${i}` }
   ...   })
   ... })
   ```

## Common Commands

```bash
# Start development server
npm run dev

# In another terminal, start NodeSH
nodesh

# Test with production build
npm run build
NODE_ENV=production nodesh
```
