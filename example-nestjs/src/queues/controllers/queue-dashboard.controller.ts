import { Controller } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Controller()
export class QueueDashboardController {
  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('notification') private readonly notificationQueue: Queue,
    @InjectQueue('report') private readonly reportQueue: Queue,
  ) {}

  /**
   * Get all queues with their status
   */
  async getAllQueueStatuses() {
    const queues = [
      { name: 'email', queue: this.emailQueue },
      { name: 'notification', queue: this.notificationQueue },
      { name: 'report', queue: this.reportQueue },
    ];

    const results = await Promise.all(
      queues.map(async ({ name, queue }) => {
        const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'paused');

        return {
          name,
          counts,
          isPaused: counts.paused > 0,
        };
      })
    );

    return results;
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: 'email' | 'notification' | 'report') {
    const queue = this.getQueue(queueName);
    await queue.pause();
    return { success: true, message: `Queue '${queueName}' paused` };
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: 'email' | 'notification' | 'report') {
    const queue = this.getQueue(queueName);
    await queue.resume();
    return { success: true, message: `Queue '${queueName}' resumed` };
  }

  /**
   * Get jobs from a queue with filtering
   */
  async getJobs(
    queueName: 'email' | 'notification' | 'report',
    status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused' = 'waiting',
    start = 0,
    end = 19
  ) {
    const queue = this.getQueue(queueName);
    let jobs;

    switch (status) {
      case 'waiting':
        jobs = await queue.getWaiting(start, end);
        break;
      case 'active':
        jobs = await queue.getActive(start, end);
        break;
      case 'completed':
        jobs = await queue.getCompleted(start, end);
        break;
      case 'failed':
        jobs = await queue.getFailed(start, end);
        break;
      case 'delayed':
        jobs = await queue.getDelayed(start, end);
        break;
      case 'paused':
        // Paused jobs are part of waiting jobs in BullMQ
        jobs = await queue.getWaiting(start, end);
        break;
      default:
        jobs = [];
    }

    return jobs.map(job => ({
      id: job.id,
      name: job.name,
      data: job.data,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts,
      createdAt: job.timestamp,
      processedAt: job.processedOn,
      finishedAt: job.finishedOn,
      returnValue: job.returnvalue,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      progress: job.progress,
      delay: job.opts.delay,
    }));
  }

  /**
   * Get a specific job by ID
   */
  async getJob(queueName: 'email' | 'notification' | 'report', jobId: string) {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    
    if (!job) return null;

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      opts: job.opts,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts,
      createdAt: job.timestamp,
      processedAt: job.processedOn,
      finishedAt: job.finishedOn,
      returnValue: job.returnvalue,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      progress: job.progress,
    };
  }

  /**
   * Retry a failed job
   */
  async retryJob(queueName: 'email' | 'notification' | 'report', jobId: string) {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    
    if (!job) {
      return { success: false, message: `Job ${jobId} not found` };
    }

    await job.retry();
    return { success: true, message: `Job ${jobId} queued for retry` };
  }

  /**
   * Remove a job
   */
  async removeJob(queueName: 'email' | 'notification' | 'report', jobId: string) {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    
    if (!job) {
      return { success: false, message: `Job ${jobId} not found` };
    }

    await job.remove();
    return { success: true, message: `Job ${jobId} removed` };
  }

  /**
   * Promote a delayed job to be processed immediately
   */
  async promoteJob(queueName: 'email' | 'notification' | 'report', jobId: string) {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    
    if (!job) {
      return { success: false, message: `Job ${jobId} not found` };
    }

    await job.promote();
    return { success: true, message: `Job ${jobId} promoted` };
  }

  /**
   * Clean completed/failed jobs from queue
   */
  async cleanQueue(
    queueName: 'email' | 'notification' | 'report',
    status: 'completed' | 'failed' | 'wait' | 'paused' | 'prioritized',
    maxCount = 100
  ) {
    const queue = this.getQueue(queueName);
    const cleaned = await queue.clean(0, maxCount, status);
    return { 
      success: true, 
      message: `Cleaned ${cleaned.length} ${status} jobs from ${queueName}`,
      count: cleaned.length 
    };
  }

  /**
   * Drain all jobs from a queue (removes waiting jobs)
   */
  async drainQueue(queueName: 'email' | 'notification' | 'report') {
    const queue = this.getQueue(queueName);
    await queue.drain();
    return { success: true, message: `Queue '${queueName}' drained` };
  }

  /**
   * Obliterate queue (remove everything including repeatable jobs)
   */
  async obliterateQueue(queueName: 'email' | 'notification' | 'report') {
    const queue = this.getQueue(queueName);
    await queue.obliterate();
    return { success: true, message: `Queue '${queueName}' obliterated` };
  }

  /**
   * Add a job to run at a specific time
   */
  async scheduleJob(
    queueName: 'email' | 'notification' | 'report',
    jobName: string,
    data: any,
    when: Date | number,
    options: any = {}
  ) {
    const queue = this.getQueue(queueName);
    
    let delay: number;
    if (when instanceof Date) {
      delay = when.getTime() - Date.now();
    } else {
      delay = when - Date.now();
    }

    const job = await queue.add(jobName, data, {
      delay: Math.max(0, delay),
      ...options,
    });

    return {
      success: true,
      jobId: job.id,
      scheduledFor: new Date(Date.now() + delay).toISOString(),
    };
  }

  /**
   * Get queue metrics/stats
   */
  async getQueueMetrics(queueName: 'email' | 'notification' | 'report') {
    const queue = this.getQueue(queueName);
    
    const [
      jobCounts,
      completed,
      failed,
    ] = await Promise.all([
      queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'paused'),
      queue.getCompleted(0, 99),
      queue.getFailed(0, 4),
    ]);

    // Calculate throughput (jobs per minute from completed)
    const recentCompleted = completed.filter(job => 
      job.finishedOn && (Date.now() - job.finishedOn) < 60000
    );

    return {
      name: queueName,
      counts: jobCounts,
      throughput: {
        completedPerMinute: recentCompleted.length,
      },
      recentFailed: failed.map(j => ({
        id: j.id,
        failedReason: j.failedReason,
        failedAt: j.finishedOn,
      })),
    };
  }

  private getQueue(name: string): Queue {
    switch (name) {
      case 'email':
        return this.emailQueue;
      case 'notification':
        return this.notificationQueue;
      case 'report':
        return this.reportQueue;
      default:
        throw new Error(`Unknown queue: ${name}`);
    }
  }
}
