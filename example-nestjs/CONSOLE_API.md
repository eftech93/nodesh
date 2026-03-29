# NodeSH Console API Guide

This document shows how to use the API client and Queue management features from the NodeSH console.

## API Service

The `apiService` is available in the console for making HTTP requests:

```javascript
// Set base URL for external APIs
apiService.setBaseURL('https://api.example.com')

// Make HTTP requests
const users = await apiService.get('/users')
const user = await apiService.get('/users/1')
const newUser = await apiService.post('/users', { name: 'John', email: 'john@example.com' })
const updated = await apiService.put('/users/1', { name: 'Jane' })
const patched = await apiService.patch('/users/1', { active: true })
const deleted = await apiService.delete('/users/1')

// With query params and custom headers
const results = await apiService.get('/search', {
  params: { q: 'nodejs', limit: 10 },
  headers: { 'Authorization': 'Bearer token123' }
})

// Test connectivity
const ping = await apiService.ping('https://api.example.com/health')
// => { success: true, latency: 45, status: 200 }

// Call local API endpoints (auto-uses localhost:3000)
const localUsers = await apiService.local('GET', '/users')
const newOrder = await apiService.local('POST', '/orders', { productId: '123', quantity: 2 })
```

## Queue Dashboard Controller

The `queueDashboardController` provides full queue management:

```javascript
// Get all queue statuses
await queueDashboardController.getAllQueueStatuses()
// => [
//   { name: 'email', counts: { waiting: 5, active: 2, completed: 100, failed: 3, delayed: 0, paused: 0 }, isPaused: false },
//   { name: 'notification', ... },
//   { name: 'report', ... }
// ]

// Pause/Resume queues
await queueDashboardController.pauseQueue('email')
await queueDashboardController.resumeQueue('email')

// Get jobs with status filtering
await queueDashboardController.getJobs('email', 'waiting')     // Waiting jobs
await queueDashboardController.getJobs('email', 'active')      // Currently processing
await queueDashboardController.getJobs('email', 'completed')   // Completed jobs
await queueDashboardController.getJobs('email', 'failed')      // Failed jobs
await queueDashboardController.getJobs('email', 'delayed')     // Delayed/scheduled jobs

// Get specific job details
await queueDashboardController.getJob('email', 'job-id-123')

// Retry failed jobs
await queueDashboardController.retryJob('email', 'job-id-123')

// Remove a job
await queueDashboardController.removeJob('email', 'job-id-123')

// Promote delayed job (run immediately)
await queueDashboardController.promoteJob('email', 'job-id-123')

// Clean old jobs
await queueDashboardController.cleanQueue('email', 'completed', 100)
await queueDashboardController.cleanQueue('email', 'failed')

// Drain queue (remove all waiting jobs)
await queueDashboardController.drainQueue('email')

// Obliterate queue (remove everything!)
await queueDashboardController.obliterateQueue('email')

// Schedule a job for future execution
await queueDashboardController.scheduleJob(
  'email',
  'send-welcome',
  { to: 'user@example.com', name: 'John' },
  new Date(Date.now() + 60000)  // Run in 1 minute
)

// Get queue metrics
await queueDashboardController.getQueueMetrics('email')
// => {
//   name: 'email',
//   counts: { waiting: 5, active: 2, completed: 100, failed: 3, delayed: 1, paused: 0 },
//   throughput: { completedPerMinute: 12 },
//   recentFailed: [...]
// }
```

## Queue Service (Legacy)

The `queuesService` is also available for simpler queue operations:

```javascript
// Add jobs
await queuesService.addEmailJob({ type: 'welcome', to: 'user@example.com', name: 'John' })
await queuesService.addNotificationJob({ userId: '123', message: 'Hello!' })
await queuesService.addReportJob({ type: 'daily', format: 'pdf' })

// Get status
await queuesService.getQueueStatus('email')
await queuesService.getAllStatuses()

// Get recent jobs
await queuesService.getRecentJobs('email', 'completed', 10)

// Clean queue
await queuesService.cleanQueue('email', 'completed')
```

## Quick Examples

```javascript
// Test external API
await apiService.ping('https://jsonplaceholder.typicode.com')
const posts = await apiService.get('https://jsonplaceholder.typicode.com/posts?_limit=5')

// Check queue health
await queueDashboardController.getAllQueueStatuses()

// Retry all failed jobs
const failed = await queueDashboardController.getJobs('email', 'failed')
for (const job of failed) {
  await queueDashboardController.retryJob('email', job.id)
}
```
