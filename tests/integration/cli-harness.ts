/**
 * CLI Test Harness
 * 
 * Provides utilities to spawn the CLI and interact with it programmatically.
 * Used for integration testing the nodesh console with real projects.
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface CLISessionOptions {
  /** Project root path */
  projectPath: string;
  /** Environment variables to set */
  env?: Record<string, string>;
  /** CLI arguments */
  args?: string[];
  /** Timeout for commands (ms) */
  commandTimeout?: number;
  /** Whether to show CLI output for debugging */
  debug?: boolean;
}

export interface CommandResult {
  /** Output from the command (stdout) */
  output: string;
  /** Any error output */
  stderr: string;
  /** Whether the command timed out */
  timedOut: boolean;
  /** Execution time in ms */
  duration: number;
}

/**
 * CLI Session for integration testing
 */
export class CLISession extends EventEmitter {
  private process: ChildProcess;
  private options: CLISessionOptions;
  private outputBuffer: string = '';
  private stderrBuffer: string = '';
  private ready: boolean = false;
  private commandResolve: ((result: CommandResult) => void) | null = null;
  private commandReject: ((error: Error) => void) | null = null;
  private commandStartTime: number = 0;
  private commandTimeout: NodeJS.Timeout | null = null;
  private promptPattern: RegExp;
  private startupResolve: (() => void) | null = null;
  private startupReject: ((error: Error) => void) | null = null;

  constructor(process: ChildProcess, options: CLISessionOptions) {
    super();
    this.process = process;
    this.options = {
      commandTimeout: 30000,
      debug: false,
      ...options
    };
    // Match common prompt patterns: "node>", "next>", "nest>", etc.
    // Also handle cases where the prompt might have ANSI codes or be formatted differently
    this.promptPattern = /[a-z]+>\s*$/i;
    
    this.setupEventHandlers();
  }

  /**
   * Create a new CLI session
   */
  static async create(options: CLISessionOptions): Promise<CLISession> {
    const nodeshPath = require.resolve('../../dist/cli.js');
    const args = [
      nodeshPath,
      options.projectPath,
      '--no-color',
      '--yes',  // Auto-generate config if needed
      ...(options.args || [])
    ];

    // Set test environment with correct database ports
    const testEnv = {
      MONGODB_URI: 'mongodb://admin:password@localhost:9000/nodesh_test?authSource=admin',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '9001',
      PGHOST: 'localhost',
      PGPORT: '9002',
      PGDATABASE: 'nodesh_test',
      PGUSER: 'nodesh',
      PGPASSWORD: 'nodesh_password',
      POSTGRES_HOST: 'localhost',
      POSTGRES_PORT: '9002',
      POSTGRES_USER: 'nodesh',
      POSTGRES_PASSWORD: 'nodesh_password',
      POSTGRES_DB: 'nodesh_test',
      DATABASE_URL: 'postgresql://nodesh:nodesh_password@localhost:9002/nodesh_test',
      MYSQL_HOST: 'localhost',
      MYSQL_PORT: '9003',
      MYSQL_DATABASE: 'nodesh_test',
      MYSQL_DB: 'nodesh_test',
      MYSQL_USER: 'nodesh',
      MYSQL_PASSWORD: 'nodesh_password',
      NEO4J_URI: 'bolt://localhost:9005',
      NEO4J_USER: 'neo4j',
      NEO4J_PASSWORD: 'nodesh_password',
      DYNAMODB_ENDPOINT: 'http://localhost:9006',
      AWS_REGION: 'us-east-1',
      AWS_ACCESS_KEY_ID: 'test',
      AWS_SECRET_ACCESS_KEY: 'test',
    };
    
    const env = {
      ...process.env,
      ...testEnv,
      ...options.env,
      NODE_ENV: options.env?.NODE_ENV || 'test',
      // Disable history file to avoid conflicts
      NODE_NO_HISTORY: '1'
    };

    if (options.debug) {
      console.log('Starting CLI with:', { nodeshPath, args, cwd: options.projectPath });
    }

    const childProcess = spawn('node', args, {
      cwd: options.projectPath,
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const session = new CLISession(childProcess, options);
    
    // Wait for the process to be ready
    await session.waitForStartup();
    
    return session;
  }

  private setupEventHandlers(): void {
    if (!this.process.stdout || !this.process.stdin || !this.process.stderr) {
      throw new Error('Process stdio not available');
    }

    this.process.stdout.on('data', (data: Buffer) => {
      const chunk = data.toString();
      this.outputBuffer += chunk;
      
      if (this.options.debug) {
        process.stdout.write(`[CLI stdout] ${chunk}`);
      }

      this.emit('output', chunk);
      
      // Check for startup completion
      if (this.startupResolve) {
        this.checkForStartupComplete();
      }
      
      this.checkForPrompt();
    });

    this.process.stderr.on('data', (data: Buffer) => {
      const chunk = data.toString();
      this.stderrBuffer += chunk;
      
      if (this.options.debug) {
        process.stderr.write(`[CLI stderr] ${chunk}`);
      }

      this.emit('stderr', chunk);
      
      // Also check stderr for startup messages
      if (this.startupResolve) {
        this.checkForStartupComplete();
      }
    });

    this.process.on('error', (error) => {
      if (this.options.debug) {
        console.error('[CLI error]', error);
      }
      
      this.emit('error', error);
      if (this.startupReject) {
        this.startupReject(error);
        this.startupResolve = null;
        this.startupReject = null;
      }
      if (this.commandReject) {
        this.commandReject(error);
        this.resetCommandState();
      }
    });

    this.process.on('exit', (code) => {
      if (this.options.debug) {
        console.log(`[CLI exit] code: ${code}`);
      }
      
      this.emit('exit', code);
      if (this.startupReject && !this.ready) {
        this.startupReject(new Error(`CLI exited with code ${code}`));
        this.startupResolve = null;
        this.startupReject = null;
      }
      if (this.commandReject && !this.ready) {
        this.commandReject(new Error(`CLI exited with code ${code}`));
        this.resetCommandState();
      }
    });
  }

  private checkForStartupComplete(): void {
    if (!this.startupResolve) return;
    
    // Only check stdout for prompt - stderr has warnings that can confuse the check
    const lines = this.outputBuffer.split('\n');
    
    // Debug: show recent stdout lines
    if (this.options.debug && lines.length > 0) {
      const recentLines = lines.slice(-5);
      console.log(`[CLI] Checking stdout ${lines.length} lines, recent: ${JSON.stringify(recentLines)}`);
    }
    
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 10); i--) {
      const line = lines[i];
      // Check for prompt pattern - handle ANSI codes by stripping them first
      const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, ''); // Strip ANSI codes
      
      // Match prompt at beginning of line (may have whitespace before)
      if (/^\s*[a-z]+>\s*$/i.test(cleanLine)) {
        if (this.options.debug) {
          console.log(`[CLI] Startup complete detected - prompt found: "${cleanLine}"`);
        }
        
        this.ready = true;
        this.startupResolve();
        this.startupResolve = null;
        this.startupReject = null;
        return;
      }
    }
  }

  private checkForPrompt(): void {
    if (!this.commandResolve) return;

    // Check if we have a prompt at the end of output
    const lines = this.outputBuffer.split('\n');
    const lastLine = lines[lines.length - 1];
    
    if (this.options.debug) {
      console.log(`[CLI] checkForPrompt - lastLine: "${lastLine.substring(0, 50)}"`);
    }
    
    // Strip ANSI codes before matching, just like checkForStartupComplete
    const cleanLastLine = lastLine.replace(/\x1b\[[0-9;]*m/g, '');
    
    if (this.promptPattern.test(cleanLastLine)) {
      // We found a prompt, command is complete
      const duration = Date.now() - this.commandStartTime;
      
      // Extract output between commands (remove the prompt at the end)
      let output = this.outputBuffer;
      const promptMatch = output.match(/>\s*$/);
      if (promptMatch) {
        output = output.slice(0, promptMatch.index).trim();
      }

      if (this.commandTimeout) {
        clearTimeout(this.commandTimeout);
        this.commandTimeout = null;
      }

      const result: CommandResult = {
        output,
        stderr: this.stderrBuffer,
        timedOut: false,
        duration
      };

      if (this.options.debug) {
        console.log('[CLI] Command complete:', { duration, outputLength: output.length });
      }

      this.commandResolve(result);
      this.resetCommandState();
    }
  }

  private resetCommandState(): void {
    this.commandResolve = null;
    this.commandReject = null;
    this.outputBuffer = '';
    this.stderrBuffer = '';
    if (this.commandTimeout) {
      clearTimeout(this.commandTimeout);
      this.commandTimeout = null;
    }
  }

  /**
   * Wait for CLI to start up
   */
  private async waitForStartup(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.startupResolve = resolve;
      this.startupReject = reject;
      
      const timeout = setTimeout(() => {
        if (this.startupReject) {
          const buffer = this.outputBuffer + this.stderrBuffer;
          this.startupReject(new Error(
            `CLI startup timeout (30s). Output buffer: ${buffer.substring(0, 500)}...`
          ));
          this.startupResolve = null;
          this.startupReject = null;
        }
      }, 30000);

      // Check immediately in case we already have output
      this.checkForStartupComplete();
    });
  }

  /**
   * Wait for the prompt to appear
   */
  async waitForPrompt(timeoutMs: number = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for prompt'));
      }, timeoutMs);

      const checkPrompt = () => {
        if (this.outputBuffer.match(/>\s*$/)) {
          clearTimeout(timeout);
          resolve();
        }
      };

      if (this.outputBuffer.match(/>\s*$/)) {
        clearTimeout(timeout);
        resolve();
        return;
      }

      this.once('output', checkPrompt);
    });
  }

  /**
   * Execute a command in the CLI
   */
  async execute(command: string): Promise<CommandResult> {
    if (!this.process.stdin) {
      throw new Error('CLI stdin not available');
    }

    if (this.commandResolve) {
      throw new Error('Another command is already running');
    }

    if (this.options.debug) {
      console.log(`[CLI] Executing: ${command}`);
    }

    // Wait a bit to ensure previous output is flushed
    await new Promise(resolve => setTimeout(resolve, 100));

    return new Promise((resolve, reject) => {
      this.commandResolve = resolve;
      this.commandReject = reject;
      this.commandStartTime = Date.now();
      // Don't clear buffer immediately - wait for prompt to settle
      const previousBuffer = this.outputBuffer;
      this.outputBuffer = '';
      this.stderrBuffer = '';

      // Set up timeout
      this.commandTimeout = setTimeout(() => {
        const duration = Date.now() - this.commandStartTime;
        
        if (this.options.debug) {
          console.log(`[CLI] Command timed out after ${duration}ms`);
          console.log(`[CLI] Output buffer: ${this.outputBuffer.substring(0, 500)}...`);
        }
        
        resolve({
          output: this.outputBuffer,
          stderr: this.stderrBuffer,
          timedOut: true,
          duration
        });
        this.resetCommandState();
      }, this.options.commandTimeout);

      // Send the command
      this.process.stdin!.write(command + '\n');
      
      if (this.options.debug) {
        console.log(`[CLI] Command sent: ${command}`);
      }
    });
  }

  /**
   * Execute multiple commands in sequence
   */
  async executeSequence(commands: string[]): Promise<CommandResult[]> {
    const results: CommandResult[] = [];
    for (const command of commands) {
      results.push(await this.execute(command));
    }
    return results;
  }

  /**
   * Get the current REPL context
   */
  async getContext(): Promise<Record<string, string[]>> {
    const result = await this.execute('.help');
    
    const context: Record<string, string[]> = {
      models: [],
      services: [],
      helpers: [],
      general: []
    };

    const lines = result.output.split('\n');
    let currentSection: keyof typeof context | null = null;

    for (const line of lines) {
      if (line.includes('Models:')) {
        currentSection = 'models';
      } else if (line.includes('Services:')) {
        currentSection = 'services';
      } else if (line.includes('Helpers:')) {
        currentSection = 'helpers';
      } else if (line.includes('General:')) {
        currentSection = 'general';
      } else if (currentSection && line.trim().startsWith('-')) {
        const item = line.trim().replace(/^-\s*/, '');
        context[currentSection].push(item);
      }
    }

    return context;
  }

  /**
   * Test autocomplete for a given input
   */
  async testAutocomplete(input: string): Promise<string[]> {
    this.process.stdin?.write(input + '\t');
    await new Promise(resolve => setTimeout(resolve, 100));
    const output = this.outputBuffer;
    this.outputBuffer = '';
    
    const completions: string[] = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.trim() && !line.includes(input) && !line.match(/^>/)) {
        completions.push(line.trim());
      }
    }
    
    return completions;
  }

  /**
   * Close the CLI session
   */
  async close(): Promise<void> {
    if (this.commandResolve) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.process.stdin?.write('.exit\n');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!this.process.killed) {
      this.process.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!this.process.killed) {
        this.process.kill('SIGKILL');
      }
    }

    this.removeAllListeners();
  }

  /**
   * Get the raw output buffer
   */
  getOutputBuffer(): string {
    return this.outputBuffer;
  }

  /**
   * Clear the output buffer
   */
  clearOutputBuffer(): void {
    this.outputBuffer = '';
    this.stderrBuffer = '';
  }
}

/**
 * Helper to wait for databases to be ready
 */
export async function waitForDatabases(timeoutMs: number = 60000): Promise<void> {
  const net = require('net');
  
  const databases = [
    { name: 'MongoDB', port: 9000 },
    { name: 'Redis', port: 9001 },
    { name: 'PostgreSQL', port: 9002 },
    { name: 'MySQL', port: 9003 },
    { name: 'Neo4j', port: 9005 },  // Bolt protocol port
    { name: 'DynamoDB', port: 9006 }
  ];

  const startTime = Date.now();
  
  for (const db of databases) {
    await new Promise<void>((resolve, reject) => {
      const checkConnection = () => {
        const socket = new net.Socket();
        socket.setTimeout(1000);
        
        socket.on('connect', () => {
          socket.destroy();
          resolve();
        });
        
        socket.on('error', () => {
          socket.destroy();
          if (Date.now() - startTime > timeoutMs) {
            reject(new Error(`Timeout waiting for ${db.name}`));
          } else {
            setTimeout(checkConnection, 1000);
          }
        });
        
        socket.on('timeout', () => {
          socket.destroy();
          if (Date.now() - startTime > timeoutMs) {
            reject(new Error(`Timeout waiting for ${db.name}`));
          } else {
            setTimeout(checkConnection, 1000);
          }
        });
        
        socket.connect(db.port, 'localhost');
      };
      
      checkConnection();
    });
    
    console.log(`✓ ${db.name} is ready`);
  }
}

/**
 * Setup test environment variables
 */
export function setupTestEnv(): void {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const dotenv = require('dotenv');
    const envPath = path.join(__dirname, '../../.env.test');
    dotenv.config({ path: envPath });
  } catch {
    // Fallback: manually parse .env.test file
    const envPath = path.join(__dirname, '../../.env.test');
    
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        const equalsIndex = trimmed.indexOf('=');
        if (equalsIndex > 0) {
          const key = trimmed.substring(0, equalsIndex).trim();
          let value = trimmed.substring(equalsIndex + 1).trim();
          
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          if (key && !process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  }
}
