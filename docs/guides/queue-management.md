# Queue Management Guide

NodeSH provides comprehensive queue management for BullMQ/Bull queues. This guide covers all available operations for monitoring, controlling, and debugging your job queues.

## Overview

When working with NestJS + BullMQ, NodeSH automatically loads the `queueDashboardController` and `queuesService` into the console context, giving you full control over your queues.

## Basic Operations

### Check Queue Status

```javascript
// Get all queue statuses at once
node> await queueDashboardController.getAllQueueStatuses()
// => [
//   {
//     name: 'email',
//     counts: { waiting: 5, active: 2, completed: 100, failed: 3, delayed: 0, paused: 0 },
//     isPaused: false
//   },
//   { name: 'notification', ... },
//   { name: 'report', ... }
// ]
```

### Pause and Resume Queues

```javascript
// Pause a queue (stops processing new jobs)
node> await queueDashboardController.pauseQueue('email')
// => { success: true, message: "Queue 'email' paused" }

// Resume a queue
node> await queueDashboardController.resumeQueue('email')
// => { success: true, message: "Queue 'email' resumed" }
```

## Job Management

### List Jobs

```javascript
// Get waiting jobs
node> const waiting = await queueDashboardController.getJobs('email', 'waiting')

// Get currently active jobs
node> const active = await queueDashboardController.getJobs('email', 'active')

// Get completed jobs (last 20)
node> const completed = await queueDashboardController.getJobs('email', 'completed', 0, 19)

// Get failed jobs
node> const failed = await queueDashboardController.getJobs('email', 'failed')

// Get delayed/scheduled jobs
node> const delayed = await queueDashboardController.getJobs('email', 'delayed')
```

### Get Specific Job

```javascript
node> const job = await queueDashboardController.getJob('email', 'job-id-123')
// => {
//   id: 'job-id-123',
//   name: 'send-email',
//   data: { to: 'user@example.com', subject: 'Welcome' },
//   attempts: 0,
//   maxAttempts: 3,
//   createdAt: 1711531200000,
//   processedAt: null,
//   finishedAt: null,
//   failedReason: null,
//   ...
// }
```

### Retry Failed Jobs

```javascript
// Retry a specific failed job
node> await queueDashboardController.retryJob('email', 'job-id-123')
// => { success: true, message: "Job job-id-123 queued for retry" }

// Retry all failed jobs
node> const failed = await queueDashboardController.getJobs('email', 'failed')
node> for (const job of failed) {
...   await queueDashboardController.retryJob('email', job.id)
...   console.log(`Retried job ${job.id}`)
... }
```

### Remove Jobs

```javascript
// Remove a specific job
node> await queueDashboardController.removeJob('email', 'job-id-123')
// => { success: true, message: "Job job-id-123 removed" }

// Remove all completed jobs
node> await queueDashboardController.cleanQueue('email', 'completed')
```

### Promote Delayed Jobs

```javascript
// Move a delayed job to waiting (run immediately)
node> await queueDashboardController.promoteJob('email', 'job-id-123')
// => { success: true, message: "Job job-id-123 promoted" }
```

## Queue Maintenance

### Clean Old Jobs

```javascript
// Clean completed jobs (keep last 100)
node> await queueDashboardController.cleanQueue('email', 'completed', 100)
// => { success: true, message: "Cleaned 50 completed jobs from email", count: 50 }

// Clean failed jobs
node> await queueDashboardController.cleanQueue('email', 'failed')

// Clean waiting jobs
node> await queueDashboardController.cleanQueue('email', 'wait')
```

### Drain Queue

Remove all waiting jobs without processing them:

```javascript
node> await queueDashboardController.drainQueue('email')
// => { success: true, message: "Queue 'email' drained" }
```

### Obliterate Queue

**⚠️ Danger Zone**: Removes everything including repeatable jobs:

```javascript
node> await queueDashboardController.obliterateQueue('email')
// => { success: true, message: "Queue 'email' obliterated" }
```

## Scheduling Jobs

### Schedule for Future

```javascript
// Schedule job to run 1 hour from now
node> await queueDashboardController.scheduleJob(
...   'email',
...   'send-reminder',
...   { to: 'user@example.com', message: 'Don\'t forget!' },
...   new Date(Date.now() + 3600000)
... )
// => { success: true, jobId: 'abc123', scheduledFor: '2024-03-28T15:30:00.000Z' }

// Schedule job for specific date/time
node> await queueDashboardController.scheduleJob(
...   'email',
...   'send-birthday-email',
...   { to: 'user@example.com' },
...   new Date('2024-12-25T09:00:00')
... )
```

## Metrics and Monitoring

### Get Queue Metrics

```javascript
node> await queueDashboardController.getQueueMetrics('email')
// => {
//   name: 'email',
//   counts: {
//     waiting: 5,
//     active: 2,
//     completed: 1000,
//     failed: 10,
//     delayed: 3,
//     paused: 0
//   },
//   throughput: {
//     completedPerMinute: 12
//   },
//   recentFailed: [
//     { id: 'job1', failedReason: 'Connection timeout', failedAt: 1711531200000 },
//     ...
//   ]
// }
```

## Common Workflows

### Debug Failed Jobs

```javascript
// 1. Get all failed jobs
node> const failed = await queueDashboardController.getJobs('email', 'failed')

// 2. Inspect a specific job
node> const job = await queueDashboardController.getJob('email', failed[0].id)
node> console.log('Failed reason:', job.failedReason)
node> console.log('Stack trace:', job.stacktrace)
node> console.log('Job data:', job.data)

// 3. Retry after fixing the issue
node> await queueDashboardController.retryJob('email', job.id)
```

### Process Queue Backlog

```javascript
// 1. Check queue status
node> await queueDashboardController.getQueueMetrics('email')

// 2. If too many waiting jobs, you might want to:
//    - Scale up workers
//    - Or temporarily pause the queue
node> await queueDashboardController.pauseQueue('email')

// 3. After scaling/cleanup, resume
node> await queueDashboardController.resumeQueue('email')
```

### Retry All Failed Jobs

```javascript
node> const queues = ['email', 'notification', 'report']

node> for (const queueName of queues) {
...   const failed = await queueDashboardController.getJobs(queueName, 'failed')
...   console.log(`Found ${failed.length} failed jobs in ${queueName}`)
...   
...   for (const job of failed) {
...     try {
...       await queueDashboardController.retryJob(queueName, job.id)
...       console.log(`  ✓ Retried job ${job.id}`)
...     } catch (err) {
...       console.error(`  ✗ Failed to retry job ${job.id}:`, err.message)
...     }
...   }
... }
```

### Clean Up Old Data

```javascript
// Clean up old completed jobs from all queues
node> const queues = ['email', 'notification', 'report']

node> for (const queueName of queues) {
...   const result = await queueDashboardController.cleanQueue(queueName, 'completed', 1000)
...   console.log(`${queueName}: ${result.message}`)
... }
```

## Using queuesService (Simple Operations)

For simpler use cases, use `queuesService`:

```javascript
// Add jobs
node> await queuesService.addEmailJob({
...   type: 'welcome',
...   to: 'user@example.com',
...   name: 'John'
... })

node> await queuesService.addNotificationJob({
...   userId: '123',
...   message: 'Hello!'
... })

// Check status
node> await queuesService.getQueueStatus('email')

// Get all statuses
node> await queuesService.getAllStatuses()

// Get recent jobs
node> await queuesService.getRecentJobs('email', 'completed', 10)

// Clean queue
node> await queuesService.cleanQueue('email', 'completed')
```

## API Reference

### queueDashboardController Methods

| Method | Description |
|--------|-------------|
| `getAllQueueStatuses()` | Get status of all queues |
| `pauseQueue(queueName)` | Pause processing for a queue |
| `resumeQueue(queueName)` | Resume processing for a queue |
| `getJobs(queueName, status, start?, end?)` | Get jobs with status filter |
| `getJob(queueName, jobId)` | Get specific job details |
| `retryJob(queueName, jobId)` | Retry a failed job |
| `removeJob(queueName, jobId)` | Remove a job from queue |
| `promoteJob(queueName, jobId)` | Move delayed job to waiting |
| `cleanQueue(queueName, status, maxCount?)` | Clean old jobs |
| `drainQueue(queueName)` | Remove all waiting jobs |
| `obliterateQueue(queueName)` | Remove everything from queue |
| `scheduleJob(queueName, jobName, data, when, options?)` | Schedule job for future |
| `getQueueMetrics(queueName)` | Get throughput and statistics |

### queuesService Methods

| Method | Description |
|--------|-------------|
| `addEmailJob(data, options?)` | Add job to email queue |
| `addNotificationJob(data, options?)` | Add job to notification queue |
| `addReportJob(data, options?)` | Add job to report queue |
| `getQueueStatus(queueName)` | Get status of specific queue |
| `getAllStatuses()` | Get status of all queues |
| `getRecentJobs(queueName, status?, count?)` | Get recent jobs |
| `cleanQueue(queueName, status?, maxCount?)` | Clean old jobs |
| `getJobCounts(queueName)` | Get detailed job counts |

## Tips

1. **Use `getAllQueueStatuses()` for quick health checks** - See all queues at once
2. **Always check `failedReason` before retrying** - Understand why jobs failed
3. **Clean old jobs regularly** - Prevent queue from growing too large
4. **Use `scheduleJob()` for delayed execution** - Schedule emails, reports, etc.
5. **Pause queues during maintenance** - Prevent new jobs from processing
6. **Monitor `throughput.completedPerMinute`** - Track queue performance
