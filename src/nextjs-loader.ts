/**
 * Next.js-specific loader - works with Next.js API routes and server components
 */
import * as fs from 'fs';
import * as path from 'path';
import { AppLoaderOptions, LoadedContext } from './types';
import { initDatabases, getConnectionManager } from './database';
import * as helpers from './helpers';
import * as utils from './utils';

interface NextJSConfig {
  serverRuntimeConfig?: Record<string, unknown>;
  publicRuntimeConfig?: Record<string, unknown>;
}

export class NextJSLoader {
  public rootPath: string;
  public config: AppLoaderOptions['config'];
  public context: LoadedContext;
  public loadedFiles: string[];
  public nextConfig: NextJSConfig | null;

  constructor(options: AppLoaderOptions = {}) {
    this.rootPath = options.rootPath || process.cwd();
    this.config = options.config || {};
    this.context = {};
    this.loadedFiles = [];
    this.nextConfig = null;
  }

  /**
   * Check if this is a Next.js project
   */
  static isNextJSProject(rootPath: string): boolean {
    const nextConfigFiles = [
      'next.config.js', 'next.config.ts', 'next.config.mjs', 'next.config.cjs',
    ];

    for (const file of nextConfigFiles) {
      if (fs.existsSync(path.join(rootPath, file))) return true;
    }

    const packageJsonPath = path.join(rootPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (pkg.dependencies?.next || pkg.devDependencies?.next) return true;
      } catch (e) { /* ignore */ }
    }

    const nextDirs = ['pages', 'src/pages', 'app', 'src/app'];
    for (const dir of nextDirs) {
      if (fs.existsSync(path.join(rootPath, dir))) return true;
    }

    return false;
  }

  /**
   * Load Next.js application
   */
  async load(): Promise<LoadedContext> {
    console.log('Detected Next.js application');

    this.registerTypeScript();
    this.loadEnvironment();
    await this.autoConnectDB();
    await this.loadNextConfig();
    await this.loadLibFiles();
    await this.loadModels();
    await this.loadServices();
    await this.loadServerActions();
    await this.loadAPIRoutes();
    await this.loadNextApp();

    return this.context;
  }

  /**
   * Register TypeScript support
   */
  registerTypeScript(): void {
    if (require.extensions['.ts']) return;

    try {
      const nodeshConfigPath = path.join(this.rootPath, 'tsconfig.nodesh.json');
      if (fs.existsSync(nodeshConfigPath)) {
        require('ts-node').register({ project: nodeshConfigPath, transpileOnly: true });
      } else {
        require('ts-node/register');
      }
      require('tsconfig-paths/register');
    } catch (err) {
      // Silent fail - will show warning later if TS files are found
    }
  }

  /**
   * Auto-connect to database
   * Uses the new database module with multi-database support
   */
  async autoConnectDB(): Promise<void> {
    // First, try to use project's db file if it exists
    const dbFiles = ['lib/db.ts', 'lib/db.js', 'src/lib/db.ts', 'src/lib/db.js'];

    for (const file of dbFiles) {
      const dbPath = path.join(this.rootPath, file);
      if (fs.existsSync(dbPath)) {
        try {
          if (file.endsWith('.ts')) this.registerTypeScript();

          const absolutePath = path.resolve(dbPath);
          delete require.cache[require.resolve(absolutePath)];
          const dbModule = require(absolutePath);

          // Try connectAll first (connects all configured databases), then fall back to connectDB
          const connectAll = dbModule.connectAll || dbModule.default?.connectAll;
          const connectDB = dbModule.connectDB || dbModule.default?.connectDB || dbModule.default;
          
          if (typeof connectAll === 'function') {
            console.log('Connecting to all configured databases...');
            await connectAll();
            console.log('✅ Databases connected');
            
            Object.keys(dbModule).forEach(key => this.context[key] = dbModule[key]);
            this.context.connect = connectAll;
            this.loadedFiles.push(dbPath);
            
            // Also add database helpers
            this.addDatabaseHelpers();
            return;
          } else if (typeof connectDB === 'function') {
            console.log('Connecting to database...');
            await connectDB();
            console.log('✅ Database connected');
            
            Object.keys(dbModule).forEach(key => this.context[key] = dbModule[key]);
            this.context.connect = connectDB;
            this.loadedFiles.push(dbPath);
            
            // Also add database helpers
            this.addDatabaseHelpers();
            return;
          }
        } catch (err) {
          console.warn(`⚠️  DB connection from project file failed: ${(err as Error).message}`);
        }
      }
    }

    // Fall back to auto-detection from environment variables
    try {
      const { manager, helpers: dbHelpers } = await initDatabases();
      
      // Add helpers to context
      Object.assign(this.context, dbHelpers);
      this.addDatabaseHelpers();
      
    } catch (err) {
      // Silent fail - database is optional
    }
  }

  /**
   * Add database helper functions to context
   */
  addDatabaseHelpers(): void {
    const manager = getConnectionManager();
    const dbHelpers = manager.createHelpers();
    Object.assign(this.context, dbHelpers);
    
    // Also add individual connection getters for convenience
    this.context.getConnections = () => ({
      mongo: manager.get('mongodb'),
      redis: manager.get('redis'),
      pg: manager.get('postgresql'),
      mysql: manager.get('mysql'),
      neo4j: manager.get('neo4j'),
      dynamo: manager.get('dynamodb'),
    });
  }

  /**
   * Load Next.js configuration
   */
  async loadNextConfig(): Promise<void> {
    const configFiles = ['next.config.ts', 'next.config.js', 'next.config.mjs', 'next.config.cjs'];

    for (const file of configFiles) {
      const configPath = path.join(this.rootPath, file);
      if (fs.existsSync(configPath)) {
        try {
          if (file.endsWith('.ts')) this.registerTypeScript();
          const absolutePath = path.resolve(configPath);
          delete require.cache[require.resolve(absolutePath)];
          const config = require(absolutePath);
          this.nextConfig = config.default || config;
          this.context.nextConfig = this.nextConfig;
          this.loadedFiles.push(configPath);
          break;
        } catch (err) { /* ignore */ }
      }
    }
  }

  /**
   * Load API routes and create helper functions
   */
  async loadAPIRoutes(): Promise<void> {
    const apiDirs = [
      path.join(this.rootPath, 'app/api'),
      path.join(this.rootPath, 'src/app/api'),
      path.join(this.rootPath, 'pages/api'),
      path.join(this.rootPath, 'src/pages/api'),
    ];

    for (const apiDir of apiDirs) {
      if (fs.existsSync(apiDir)) {
        await this.loadRoutesFromDir(apiDir, 'api');
      }
    }
  }

  /**
   * Load route handlers and create helper functions
   */
  async loadRoutesFromDir(dir: string, prefix: string): Promise<void> {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        await this.loadRoutesFromDir(fullPath, `${prefix}/${file}`);
      } else if (/\.(ts|js|tsx|jsx)$/.test(file) && !/\.(test|spec)\./.test(file)) {
        try {
          if (/\.tsx?$/.test(file)) this.registerTypeScript();

          const absolutePath = path.resolve(fullPath);
          delete require.cache[require.resolve(absolutePath)];
          const routeModule = require(absolutePath);

          const baseName = path.basename(file, path.extname(file));
          const routeName = baseName === 'index' ? prefix : `${prefix}/${baseName}`;
          const routeVarName = this.toCamelCase(routeName.replace(/\//g, '_'));

          this.context[routeVarName] = routeModule;
          this.loadedFiles.push(fullPath);

          // Create API helper functions
          this.createRouteHelpers(routeName, routeModule);
        } catch (err) {
          console.warn(`Failed to load route ${fullPath}: ${(err as Error).message}`);
        }
      }
    }
  }

  /**
   * Create helper functions for API routes
   */
  createRouteHelpers(routePath: string, routeModule: Record<string, unknown>): void {
    const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    
    // Build function name: /api/users/[id]/route -> apiUsersId
    const cleanPath = routePath.replace(/\/route$/, '').replace(/\[|\]/g, '');
    const baseName = this.toCamelCase(cleanPath.replace(/\//g, '_'));

    for (const method of httpMethods) {
      const handler = routeModule[method];
      if (typeof handler !== 'function') continue;

      const helperName = `${baseName}${method}`;
      
      // Create the wrapper function
      this.context[helperName] = async (...args: unknown[]) => {
        try {
          // Parse arguments
          let id: string | undefined;
          let query: Record<string, string> | undefined;
          let body: Record<string, unknown> | undefined;

          // First arg could be ID (string) or params object
          if (args.length > 0) {
            if (typeof args[0] === 'string') {
              id = args[0];
              if (args[1] && typeof args[1] === 'object') {
                if (method === 'GET' || method === 'DELETE') {
                  query = args[1] as Record<string, string>;
                } else {
                  body = args[1] as Record<string, unknown>;
                }
              }
            } else if (args[0] && typeof args[0] === 'object') {
              if (method === 'GET' || method === 'DELETE') {
                query = args[0] as Record<string, string>;
              } else {
                body = args[0] as Record<string, unknown>;
              }
            }
          }

          // Build URL
          let urlStr = `http://localhost:3000/${routePath}`;
          if (id) {
            urlStr = urlStr.replace(/\[id\]/, id).replace(/\[.+?\]/, id);
          }

          // Add query params
          if (query && Object.keys(query).length > 0) {
            const url = new URL(urlStr);
            Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
            urlStr = url.toString();
          }

          // Create mock Request
          const request = {
            url: urlStr,
            method,
            headers: {
              get: (name: string) => {
                if (name.toLowerCase() === 'content-type') return 'application/json';
                return null;
              },
            },
            json: async () => body || {},
            text: async () => JSON.stringify(body || {}),
          };

          // Call handler
          const context = id ? { params: { id } } : undefined;
          const response = await handler(request, context);

          // Parse NextResponse
          if (response && typeof response === 'object') {
            // If it has json() method, use it
            if (typeof (response as { json?: () => unknown }).json === 'function') {
              return await (response as { json: () => Promise<unknown> }).json();
            }
            // Otherwise return as-is
            return response;
          }
          return response;

        } catch (error) {
          const err = error as Error;
          console.error(`❌ ${helperName} failed:`, err.message);
          throw error;
        }
      };
    }
  }

  /**
   * Load lib/utility files
   */
  async loadLibFiles(): Promise<void> {
    const libDirs = [
      path.join(this.rootPath, 'lib'),
      path.join(this.rootPath, 'src/lib'),
      path.join(this.rootPath, 'utils'),
      path.join(this.rootPath, 'src/utils'),
    ];

    for (const libDir of libDirs) {
      if (fs.existsSync(libDir)) {
        await this.loadFilesFromDir(libDir, (name, mod) => {
          const Export = (mod as { default?: unknown }).default || mod;
          this.context[this.toCamelCase(name)] = Export;
          this.context[name] = Export;
          
          // Also add individual named exports to context for convenience
          // This allows calling seed(), clear(), etc. directly
          if (mod && typeof mod === 'object') {
            for (const [key, value] of Object.entries(mod)) {
              if (key !== 'default' && !key.startsWith('_')) {
                this.context[key] = value;
              }
            }
          }
        });
      }
    }
  }

  /**
   * Load models
   */
  async loadModels(): Promise<void> {
    const modelDirs = [
      path.join(this.rootPath, 'models'),
      path.join(this.rootPath, 'src/models'),
    ];

    for (const modelDir of modelDirs) {
      if (fs.existsSync(modelDir)) {
        await this.loadFilesFromDir(modelDir, (name, mod) => {
          const Model = (mod as { default?: unknown }).default || 
                        (mod as Record<string, unknown>)[name] || 
                        mod;
          if (Model) {
            this.context[name] = Model;
            if (typeof Model === 'function') {
              const plural = this.pluralize(name);
              if (plural !== name) this.context[plural] = Model;
            }
          }
        });
      }
    }
  }

  /**
   * Load services
   */
  async loadServices(): Promise<void> {
    const serviceDirs = [
      path.join(this.rootPath, 'services'),
      path.join(this.rootPath, 'src/services'),
    ];

    for (const serviceDir of serviceDirs) {
      if (fs.existsSync(serviceDir)) {
        await this.loadFilesFromDir(serviceDir, (name, mod) => {
          const Service = (mod as { default?: unknown }).default || 
                         (mod as Record<string, unknown>)[name] || 
                         mod;
          if (Service) {
            const serviceName = this.toCamelCase(name.replace(/Service$/, ''));
            this.context[serviceName + 'Service'] = Service;
            this.context[name] = Service;
          }
        });
      }
    }
  }

  /**
   * Load Next.js Server Actions
   * Server Actions are functions marked with 'use server' directive
   * They can be in app/actions/, lib/actions/, or co-located with components
   */
  async loadServerActions(): Promise<void> {
    const actionDirs = [
      path.join(this.rootPath, 'app/actions'),
      path.join(this.rootPath, 'src/app/actions'),
      path.join(this.rootPath, 'lib/actions'),
      path.join(this.rootPath, 'src/lib/actions'),
      path.join(this.rootPath, 'actions'),
      path.join(this.rootPath, 'src/actions'),
    ];

    for (const actionDir of actionDirs) {
      if (fs.existsSync(actionDir)) {
        await this.loadServerActionsFromDir(actionDir);
      }
    }

    // Also scan for action files in app directory (co-located with components)
    const appDirs = [
      path.join(this.rootPath, 'app'),
      path.join(this.rootPath, 'src/app'),
    ];

    for (const appDir of appDirs) {
      if (fs.existsSync(appDir)) {
        await this.scanForServerActions(appDir);
      }
    }
  }

  /**
   * Load server actions from a directory
   */
  async loadServerActionsFromDir(dir: string, prefix = ''): Promise<void> {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Recurse into subdirectories
        const subPrefix = prefix ? `${prefix}_${file}` : file;
        await this.loadServerActionsFromDir(fullPath, subPrefix);
      } else if (/\.actions\.(ts|js|tsx|jsx)$/.test(file)) {
        // Files with .actions.ts suffix
        await this.loadActionFile(fullPath, prefix);
      } else if (
        /\.(ts|js|tsx|jsx)$/.test(file) && 
        !/\.(test|spec)\./.test(file) && 
        !file.endsWith('.d.ts')
      ) {
        // Check if file contains 'use server' directive
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('"use server"') || content.includes("'use server'")) {
          await this.loadActionFile(fullPath, prefix);
        }
      }
    }
  }

  /**
   * Scan app directory for server actions in page/layout files
   */
  async scanForServerActions(dir: string): Promise<void> {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        await this.scanForServerActions(fullPath);
      } else if (
        /(page|layout)\.(tsx|jsx|ts|js)$/.test(file) ||
        /\.action(s)?\.(ts|js|tsx|jsx)$/.test(file)
      ) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('"use server"') || content.includes("'use server'")) {
          await this.loadActionFile(fullPath);
        }
      }
    }
  }

  /**
   * Load a single action file and extract exported functions
   */
  async loadActionFile(filePath: string, prefix = ''): Promise<void> {
    try {
      if (/\.tsx?$/.test(filePath)) this.registerTypeScript();

      const absolutePath = path.resolve(filePath);
      delete require.cache[require.resolve(absolutePath)];
      const mod = require(absolutePath);

      // Get file name without extension
      const fileName = path.basename(filePath, path.extname(filePath));
      const baseName = prefix ? `${prefix}_${fileName}` : fileName;

      // Extract all exported functions
      const exports = mod.default ? { default: mod.default, ...mod } : mod;

      for (const [key, value] of Object.entries(exports)) {
        if (typeof value === 'function') {
          // Create action wrapper
          const actionName = key === 'default' ? baseName : `${baseName}_${key}`;
          const camelName = this.toCamelCase(actionName.replace(/\.action(s)?/, ''));
          
          // Wrap the action with logging and error handling
          const actionFn = value as (...args: unknown[]) => unknown;
          this.context[camelName] = this.createActionWrapper(camelName, actionFn);
          
          // Also add with action suffix for clarity
          this.context[camelName + 'Action'] = this.context[camelName];
        }
      }

      this.loadedFiles.push(filePath);
    } catch (err) {
      console.warn(`Failed to load server actions from ${filePath}: ${(err as Error).message}`);
    }
  }

  /**
   * Create a wrapper for server actions with logging and error handling
   */
  createActionWrapper(name: string, actionFn: (...args: unknown[]) => unknown): (...args: unknown[]) => Promise<unknown> {
    return async (...args: unknown[]) => {
      const startTime = Date.now();
      console.log(`🚀 Executing server action: ${name}()`);
      
      try {
        // Validate arguments for common patterns
        const validatedArgs = args.map(arg => {
          // Handle FormData-like objects
          if (arg && typeof arg === 'object' && !(arg instanceof FormData)) {
            // Convert plain objects to ensure they're serializable
            return JSON.parse(JSON.stringify(arg));
          }
          return arg;
        });

        const result = await actionFn(...validatedArgs);
        const duration = Date.now() - startTime;
        
        console.log(`✅ ${name}() completed in ${duration}ms`);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        const err = error as Error;
        console.error(`❌ ${name}() failed after ${duration}ms:`, err.message);
        throw error;
      }
    };
  }

  /**
   * Load Next.js app if available
   */
  async loadNextApp(): Promise<void> {
    // Try to load Prisma client
    try {
      const { PrismaClient } = require('@prisma/client');
      this.context.prisma = new PrismaClient();
    } catch (e) { /* no prisma */ }

    // Add helper functions to context
    this.addHelpers();
  }

  /**
   * Add helper functions to context
   */
  addHelpers(): void {
    // Add timing helpers
    this.context.run = helpers.run;
    this.context.measure = helpers.measure;
    this.context.batch = helpers.batch;
    this.context.retry = helpers.retry;
    this.context.sleep = helpers.sleep;

    // Add API helpers
    this.context.http = helpers.http;
    this.context.ApiTester = helpers.ApiTester;
    this.context.debugApi = helpers.debugApi;
    this.context.createMockRequest = helpers.createMockRequest;
    this.context.createNextRequest = helpers.createNextRequest;

    // Add seeding helpers
    this.context.seed = helpers.seed;
    this.context.seedUsers = helpers.seedUsers;
    this.context.clear = helpers.clear;
    this.context.showStats = helpers.showStats;

    // Add utils
    this.context.formatTable = utils.formatTable;
    this.context.formatBytes = utils.formatBytes;
    this.context.formatDuration = utils.formatDuration;
  }

  /**
   * Helper to load files from directory
   */
  async loadFilesFromDir(dirPath: string, callback: (name: string, module: unknown) => void): Promise<void> {
    if (!fs.existsSync(dirPath)) return;

    const files = fs.readdirSync(dirPath)
      .filter(f => /\.(js|ts|jsx|tsx)$/.test(f) && !/\.(test|spec)\./.test(f) && !f.endsWith('.d.ts'));

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        await this.loadFilesFromDir(filePath, callback);
      } else {
        try {
          if (/\.tsx?$/.test(file)) this.registerTypeScript();
          const absolutePath = path.resolve(filePath);
          delete require.cache[require.resolve(absolutePath)];
          const mod = require(absolutePath);
          const name = path.basename(file, path.extname(file));
          callback(name, mod);
          this.loadedFiles.push(filePath);
        } catch (err) { 
          console.warn(`Failed to load ${filePath}: ${(err as Error).message}`);
        }
      }
    }
  }

  /**
   * Load environment variables
   */
  loadEnvironment(): void {
    // Try to load dotenv from project's node_modules first
    let dotenv: { config: (options: { path: string }) => void } | null = null;
    try {
      const dotenvPath = require.resolve('dotenv', { paths: [this.rootPath] });
      dotenv = require(dotenvPath);
    } catch {
      try {
        dotenv = require('dotenv');
      } catch {
        // dotenv not installed, skip
      }
    }
    
    if (dotenv) {
      ['.env', `.env.${process.env.NODE_ENV || 'development'}`, '.env.local'].forEach(envFile => {
        const envPath = path.join(this.rootPath, envFile);
        if (fs.existsSync(envPath)) {
          try { 
            dotenv.config({ path: envPath });
            console.log(`Loaded env from: ${envPath}`);
          } catch (e) { 
            console.warn(`Failed to load ${envPath}:`, (e as Error).message);
          }
        }
      });
    } else {
      console.warn('dotenv not found, skipping .env file loading');
    }
    
    // Always set env and NODE_ENV from process.env
    this.context.env = process.env;
    this.context.NODE_ENV = process.env.NODE_ENV || 'development';
  }

  /**
   * Pluralize a name
   */
  pluralize(name: string): string {
    if (name.endsWith('y')) return name.slice(0, -1) + 'ies';
    if (/[sxch]$/.test(name)) return name + 'es';
    return name + 's';
  }

  /**
   * Convert to camelCase
   */
  toCamelCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
      .replace(/^[A-Z]/, c => c.toLowerCase());
  }

  /**
   * Get help text
   */
  getHelpText(): string {
    const sections: string[] = ['Available Context (Next.js):', ''];
    
    const apiHelpers = Object.keys(this.context).filter(k => 
      /^api[A-Z].*(GET|POST|PUT|PATCH|DELETE)$/.test(k)
    );

    if (apiHelpers.length > 0) {
      sections.push('  📡 API Helpers:');
      apiHelpers.forEach(k => sections.push(`    ${k}()`));
      sections.push('');
    }

    // Detect server actions by checking loaded files
    const actionFiles = this.loadedFiles.filter(f => 
      f.includes('/actions/') || 
      /\.actions\.(ts|js|tsx|jsx)$/.test(f)
    );
    
    if (actionFiles.length > 0) {
      const actionNames = Object.keys(this.context).filter(k => 
        k.endsWith('Action') && !k.includes('_')
      );
      
      if (actionNames.length > 0) {
        sections.push('  ⚡ Server Actions:');
        actionNames.slice(0, 20).forEach(k => sections.push(`    ${k}()`));
        if (actionNames.length > 20) {
          sections.push(`    ... and ${actionNames.length - 20} more`);
        }
        sections.push('');
      }
    }

    const models = Object.keys(this.context).filter(k => 
      this.loadedFiles.some(f => f.includes('/models/'))
    );
    if (models.length > 0) {
      sections.push('  📦 Models:');
      models.forEach(k => sections.push(`    ${k}`));
      sections.push('');
    }

    const services = Object.keys(this.context).filter(k => 
      this.loadedFiles.some(f => f.includes('/services/'))
    );
    if (services.length > 0) {
      sections.push('  ⚙️  Services:');
      services.forEach(k => sections.push(`    ${k}`));
      sections.push('');
    }

    sections.push('  🌍 General:');
    sections.push('    env, NODE_ENV, nextConfig');
    sections.push('');
    sections.push('Type any variable name to inspect it.');

    return sections.join('\n');
  }
}
