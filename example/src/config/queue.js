/**
 * BullMQ Queue Configuration
 */
const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create connection for BullMQ
const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

// Define queues
const emailQueue = new Queue('email', { connection });
const notificationQueue = new Queue('notification', { connection });
const reportQueue = new Queue('report', { connection });

// Queue helper functions
async function addEmailJob(data, options = {}) {
  return emailQueue.add('send-email', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    ...options
  });
}

async function addNotificationJob(data, options = {}) {
  return notificationQueue.add('send-notification', data, {
    attempts: 2,
    ...options
  });
}

async function addReportJob(data, options = {}) {
  return reportQueue.add('generate-report', data, {
    attempts: 1,
    ...options
  });
}

async function getQueueStatus(queueName) {
  const queue = { email: emailQueue, notification: notificationQueue, report: reportQueue }[queueName];
  if (!queue) return null;
  
  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount()
  ]);
  
  return { waiting, active, completed, failed };
}

async function cleanQueue(queueName, status, maxCount = 100) {
  const queue = { email: emailQueue, notification: notificationQueue, report: reportQueue }[queueName];
  if (!queue) return null;
  
  await queue.clean(0, maxCount, status);
  return true;
}

module.exports = {
  queues: {
    email: emailQueue,
    notification: notificationQueue,
    report: reportQueue
  },
  addEmailJob,
  addNotificationJob,
  addReportJob,
  getQueueStatus,
  cleanQueue,
  connection
};
