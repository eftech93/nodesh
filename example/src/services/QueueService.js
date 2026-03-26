/**
 * Queue Service - Manage BullMQ jobs and queues
 */
const { queues, getQueueStatus, cleanQueue } = require('../config/queue');

class QueueService {
  /**
   * Get status of all queues
   */
  async getAllStatuses() {
    const statuses = {};
    
    for (const [name, queue] of Object.entries(queues)) {
      statuses[name] = await getQueueStatus(name);
    }
    
    return statuses;
  }

  /**
   * Get specific queue status
   */
  async getStatus(queueName) {
    return getQueueStatus(queueName);
  }

  /**
   * Get recent jobs from a queue
   */
  async getRecentJobs(queueName, status = 'completed', count = 10) {
    const queue = queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    
    let jobs;
    switch (status) {
      case 'completed':
        jobs = await queue.getCompleted(0, count - 1);
        break;
      case 'failed':
        jobs = await queue.getFailed(0, count - 1);
        break;
      case 'waiting':
        jobs = await queue.getWaiting(0, count - 1);
        break;
      case 'active':
        jobs = await queue.getActive(0, count - 1);
        break;
      default:
        throw new Error(`Unknown status: ${status}`);
    }
    
    return jobs.map(job => ({
      id: job.id,
      name: job.name,
      data: job.data,
      attempts: job.attemptsMade,
      createdAt: job.timestamp,
      processedAt: job.processedOn,
      finishedAt: job.finishedOn,
      returnValue: job.returnvalue,
      failedReason: job.failedReason
    }));
  }

  /**
   * Clean completed/failed jobs from a queue
   */
  async clean(queueName, status, maxCount = 100) {
    return cleanQueue(queueName, status, maxCount);
  }

  /**
   * Pause a queue
   */
  async pause(queueName) {
    const queue = queues[queueName];
    if (!queue) throw new Error(`Queue ${queueName} not found`);
    await queue.pause();
    return true;
  }

  /**
   * Resume a queue
   */
  async resume(queueName) {
    const queue = queues[queueName];
    if (!queue) throw new Error(`Queue ${queueName} not found`);
    await queue.resume();
    return true;
  }

  /**
   * Retry a failed job
   */
  async retryJob(queueName, jobId) {
    const queue = queues[queueName];
    if (!queue) throw new Error(`Queue ${queueName} not found`);
    
    const job = await queue.getJob(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    
    await job.retry();
    return true;
  }

  /**
   * Remove a job
   */
  async removeJob(queueName, jobId) {
    const queue = queues[queueName];
    if (!queue) throw new Error(`Queue ${queueName} not found`);
    
    const job = await queue.getJob(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    
    await job.remove();
    return true;
  }

  /**
   * Get job counts for all queues
   */
  async getJobCounts() {
    const counts = {};
    
    for (const [name, queue] of Object.entries(queues)) {
      counts[name] = await queue.getJobCounts(
        'waiting',
        'active',
        'completed',
        'failed',
        'delayed',
        'paused'
      );
    }
    
    return counts;
  }

  /**
   * Add a test job to email queue
   */
  async addTestEmailJob(to, subject, body) {
    const { addEmailJob } = require('../config/queue');
    return addEmailJob({
      type: 'test',
      to,
      subject,
      body
    });
  }

  /**
   * Add a test notification job
   */
  async addTestNotificationJob(userId, message) {
    const { addNotificationJob } = require('../config/queue');
    return addNotificationJob({
      type: 'test',
      userId,
      message
    });
  }
}

module.exports = new QueueService();
