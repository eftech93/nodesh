# NestJS Guide

NodeSH provides first-class support for NestJS applications with automatic module detection and dependency injection support.

## Setup

### 1. Project Structure

Standard NestJS project structure:

```
my-nestjs-app/
├── src/
│   ├── main.ts                 # Application entry
│   ├── app.module.ts           # Root module
│   ├── modules/
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── schemas/
│   │   │       └── user.schema.ts
│   │   └── orders/
│   │       ├── orders.module.ts
│   │       ├── orders.service.ts
│   │       └── schemas/
│   │           └── order.schema.ts
│   └── common/
│       └── services/
│           ├── cache.service.ts
│           └── queue.service.ts
├── package.json
└── .nodesh.js                  # NodeSH config (auto-generated)
```

### 2. Installation

```bash
npm install -g @eftech93/nodesh

# In your NestJS project
nodesh --yes
```

### 3. Auto-Configuration

NodeSH detects NestJS projects and generates:

```javascript
// .nodesh.js
module.exports = {
  appEntry: 'src/main.ts',
  modelsDir: 'src',
  servicesDir: 'src',
  prompt: 'nest> ',
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
nest> // Services (auto-injected)
nest> usersService
nest> ordersService
nest> cacheService

// Models/Schemas
nest> User
nest> Order

// The NestJS application
nest> app
```

### Common Operations

#### Using Services

```javascript
// Create user
nest> await usersService.create({
  email: 'bob@example.com',
  password: 'password123',
  name: { first: 'Bob', last: 'Jones' }
})

// Find by ID
nest> await usersService.findById('507f1f77bcf86cd799439011')

// Find all
nest> await usersService.findAll()

// Update
nest> await usersService.update(id, { name: { first: 'Robert' } })

// Delete
nest> await usersService.remove(id)
```

#### Working with Models

```javascript
// Mongoose model operations
nest> await User.find({ isActive: true })
nest> await User.findById(id)
nest> await User.countDocuments()
```

#### Cache Operations

```javascript
// Get cache stats
nest> await cacheService.getStats()

// Set value
nest> await cacheService.set('key', 'value', 3600)

// Get value
nest> await cacheService.get('key')

// Clear cache
nest> await cacheService.clear()
```

## Service Injection

### How It Works

NodeSH automatically:
1. Bootstraps the NestJS application using `NestFactory.create()`
2. Initializes the full NestJS DI container
3. Resolves all providers from modules
4. Injects them into the shell context

This means you get fully initialized services with all their dependencies properly injected, just like in your running application.

### Accessing Injected Services

All services marked with `@Injectable()` are available:

```typescript
// users/users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private cacheService: CacheService,
    private eventEmitter: EventEmitter2
  ) {}
  
  async create(data: CreateUserDto) {
    // ...
  }
}
```

In the shell:

```javascript
nest> usersService  // Direct access to injected instance
nest> await usersService.create({ ... })
```

## Module Support

### Feature Modules

All feature module services are available:

```javascript
// From UsersModule
nest> usersService
nest> usersRepository

// From OrdersModule
nest> ordersService
nest> ordersRepository

// From CommonModule
nest> cacheService
nest> queueService
nest> emailService
```

### Global Modules

Services from global modules are also accessible:

```typescript
@Global()
@Module({
  providers: [DatabaseService, LoggerService],
  exports: [DatabaseService, LoggerService]
})
export class CommonModule {}
```

In the shell:

```javascript
nest> databaseService
nest> loggerService
```

## Database Integration

### TypeORM

```typescript
// users/user.entity.ts
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ default: true })
  isActive: boolean;
}
```

In the shell:

```javascript
nest> await usersRepository.find()
nest> await usersRepository.findOne({ where: { email: 'test@example.com' } })
nest> await usersRepository.save({ email: 'new@example.com', name: 'New User' })
```

### Mongoose

```typescript
// users/schemas/user.schema.ts
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  name: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
```

In the shell:

```javascript
nest> await User.find()
nest> await User.create({ email: 'test@example.com' })
nest> await User.findByIdAndUpdate(id, { name: 'Updated' })
```

### Prisma

```javascript
nest> await prisma.user.findMany()
nest> await prisma.user.create({ data: { email: 'test@example.com' } })
nest> await prisma.user.update({ where: { id }, data: { name: 'Updated' } })
```

## Testing Services

### Unit Test in Console

```javascript
// Test a service method
nest> const user = await usersService.create({
...   email: 'test@example.com',
...   password: 'password123',
...   name: { first: 'Test', last: 'User' }
... })

// Verify result
nest> user.email
'test@example.com'

// Test error handling
nest> try {
...   await usersService.create({ email: 'invalid' })
... } catch (err) {
...   console.error('Validation error:', err.message)
... }
```

### Test with Dependencies

```javascript
// Service with dependencies is fully functional
nest> const user = await usersService.create({ ... })
nest> await cacheService.set(`user:${user._id}`, user)
nest> await cacheService.get(`user:${user._id}`)
```

## Queue/Job Processing

### Bull/BullMQ

NodeSH provides comprehensive queue management for BullMQ:

```javascript
// Add job to queue
nest> await queuesService.addEmailJob({
...   type: 'welcome',
...   to: 'user@example.com',
...   name: 'John'
... })

// Check queue status (simple)
nest> await queuesService.getAllStatuses()
```

### Advanced Queue Management

The `queueDashboardController` provides full queue control:

```javascript
// Get all queue statuses
nest> await queueDashboardController.getAllQueueStatuses()
// => [
//   { name: 'email', counts: { waiting: 5, active: 2, completed: 100, failed: 3 }, isPaused: false },
//   { name: 'notification', ... },
//   { name: 'report', ... }
// ]

// Pause/Resume queues
nest> await queueDashboardController.pauseQueue('email')
nest> await queueDashboardController.resumeQueue('email')

// Get jobs with status filtering
nest> await queueDashboardController.getJobs('email', 'waiting')     // Waiting jobs
nest> await queueDashboardController.getJobs('email', 'active')      // Currently processing
nest> await queueDashboardController.getJobs('email', 'completed')   // Completed jobs
nest> await queueDashboardController.getJobs('email', 'failed')      // Failed jobs
nest> await queueDashboardController.getJobs('email', 'delayed')     // Scheduled jobs

// Get specific job details
nest> await queueDashboardController.getJob('email', 'job-id-123')

// Retry failed jobs
nest> await queueDashboardController.retryJob('email', 'job-id-123')

// Retry all failed jobs
nest> const failed = await queueDashboardController.getJobs('email', 'failed')
nest> for (const job of failed) {
...   await queueDashboardController.retryJob('email', job.id)
... }

// Remove a job
nest> await queueDashboardController.removeJob('email', 'job-id-123')

// Promote delayed job (run immediately)
nest> await queueDashboardController.promoteJob('email', 'job-id-123')

// Clean old jobs
nest> await queueDashboardController.cleanQueue('email', 'completed', 100)
nest> await queueDashboardController.cleanQueue('email', 'failed')

// Drain queue (remove all waiting jobs)
nest> await queueDashboardController.drainQueue('email')

// Schedule job for future execution
nest> await queueDashboardController.scheduleJob(
...   'email',
...   'send-reminder',
...   { to: 'user@example.com', message: 'Don\'t forget!' },
...   new Date(Date.now() + 3600000)  // 1 hour from now
... )

// Get queue metrics
nest> await queueDashboardController.getQueueMetrics('email')
// => {
//   name: 'email',
//   counts: { waiting: 5, active: 2, completed: 100, failed: 3, delayed: 1, paused: 0 },
//   throughput: { completedPerMinute: 12 },
//   recentFailed: [...]
// }
```

## API Testing

Test your API endpoints directly from the console:

```javascript
// Configure API client
nest> apiService.setBaseURL('https://api.example.com')

// Make HTTP requests
nest> const users = await apiService.get('/users')
nest> const user = await apiService.get('/users/1')
nest> const newUser = await apiService.post('/users', { name: 'John', email: 'john@example.com' })
nest> const updated = await apiService.put('/users/1', { name: 'Jane' })
nest> const patched = await apiService.patch('/users/1', { active: true })
nest> const deleted = await apiService.delete('/users/1')

// With query params and custom headers
nest> const results = await apiService.get('/search', {
...   params: { q: 'nodejs', limit: 10 },
...   headers: { 'Authorization': 'Bearer token123' }
... })

// Test connectivity
nest> await apiService.ping('https://api.example.com/health')
// => { success: true, latency: 45, status: 200 }
```

### Testing Local API Endpoints

Test your own NestJS endpoints without starting a separate server:

```javascript
// Call local API (auto-uses http://localhost:3000)
nest> const users = await apiService.local('GET', '/users')
nest> const user = await apiService.local('GET', '/users/123')
nest> const newUser = await apiService.local('POST', '/users', { name: 'John' })
nest> const updated = await apiService.local('PUT', '/users/123', { name: 'Jane' })
nest> const deleted = await apiService.local('DELETE', '/users/123')

// With query params
nest> const orders = await apiService.local('GET', '/orders', { params: { status: 'pending' } })
```

## Configuration

### Custom Configuration

```javascript
// .nodesh.js
module.exports = {
  appEntry: 'src/main.ts',
  modelsDir: 'src',
  servicesDir: 'src',
  prompt: 'nest-dev> ',
  useColors: true,
  context: {
    // Additional context
    dayjs: require('dayjs'),
    faker: require('@faker-js/faker')
  }
};
```

## Hot Reload

After code changes:

```javascript
nest> .reload
Reloading...
✓ Reloaded successfully
```

## Best Practices

1. **Use DTOs for Input Validation**
   ```typescript
   // Console respects validation pipes
   nest> await usersService.create({
   ...   email: 'invalid-email'  // Will throw validation error
   ... })
   ```

2. **Event Testing**
   ```javascript
   // Emit and test events
   nest> eventEmitter.emit('user.created', { userId: '123' })
   ```

3. **Transaction Testing**
   ```javascript
   nest> await dataSource.transaction(async manager => {
   ...   await manager.save(User, { email: 'test@test.com' })
   ...   await manager.save(Order, { userId: '...' })
   ... })
   ```

4. **Error Investigation**
   ```javascript
   nest> try {
   ...   await problematicService.method()
   ... } catch (err) {
   ...   console.log(err.stack)
   ... }
   ```

## Complete Example

See the `example-nestjs/` directory for a complete NestJS + MongoDB + Redis + BullMQ application with NodeSH integration.

```bash
cd example-nestjs
npm install
npm run docker:up
npm run build
npm run console
```
