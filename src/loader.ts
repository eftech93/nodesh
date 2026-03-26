/**
 * Application loader - loads models, services, configs like Rails
 */
import * as fs from 'fs';
import * as path from 'path';
import { Application as ExpressApplication } from 'express';
import { 
  AppLoaderOptions, 
  LoadedContext, 
  RouteInfo,
  ModuleCallback 
} from './types';

export class AppLoader {
  public rootPath: string;
  public config: AppLoaderOptions['config'];
  public context: LoadedContext;
  public loadedFiles: string[];

  constructor(options: AppLoaderOptions = {}) {
    this.rootPath = options.rootPath || process.cwd();
    this.config = options.config || {};
    this.context = {};
    this.loadedFiles = [];
  }

  /**
   * Load all application components
   */
  async load(): Promise<LoadedContext> {
    // Load environment configuration
    this.loadEnvironment();
    
    // Load config files
    this.loadConfigs();
    
    // Load models (active-record style)
    await this.loadModels();
    
    // Load services
    await this.loadServices();
    
    // Load helpers/utilities
    await this.loadHelpers();
    
    // Load the Express app if available
    await this.loadExpressApp();
    
    return this.context;
  }

  /**
   * Load environment variables from .env files
   */
  loadEnvironment(): void {
    const envFiles = [
      '.env',
      `.env.${process.env.NODE_ENV || 'development'}`,
      '.env.local'
    ];

    for (const envFile of envFiles) {
      const envPath = path.join(this.rootPath, envFile);
      if (fs.existsSync(envPath)) {
        try {
          // Try to load dotenv if available
          const dotenv = require('dotenv');
          dotenv.config({ path: envPath });
        } catch (e) {
          // dotenv not available, skip
        }
      }
    }

    this.context.env = process.env;
    this.context.NODE_ENV = process.env.NODE_ENV || 'development';
  }

  /**
   * Load configuration files from config/ directory
   */
  loadConfigs(): void {
    const configDir = path.join(this.rootPath, this.config?.configDir || 'config');
    
    if (!fs.existsSync(configDir)) {
      return;
    }

    this.context.config = {};
    
    const configFiles = fs.readdirSync(configDir)
      .filter(f => f.endsWith('.js') || f.endsWith('.json') || f.endsWith('.ts'));

    for (const file of configFiles) {
      const name = path.basename(file, path.extname(file));
      const configPath = path.join(configDir, file);
      
      try {
        // Clear require cache for hot reloading
        const absolutePath = path.resolve(configPath);
        delete require.cache[require.resolve(absolutePath)];
        const config = require(absolutePath);
        (this.context.config as Record<string, unknown>)[name] = config.default || config;
        this.loadedFiles.push(configPath);
      } catch (err) {
        console.warn(`Warning: Could not load config ${file}: ${(err as Error).message}`);
      }
    }
  }

  /**
   * Load models from models/ directory
   * Supports both CommonJS and ES6 module exports
   */
  async loadModels(): Promise<void> {
    const modelsDir = path.join(this.rootPath, this.config?.modelsDir || 'models');
    
    // Also look for model files in app/models (Rails-like structure)
    const altModelsDir = path.join(this.rootPath, 'app', 'models');
    const dirsToLoad: string[] = [];
    
    if (fs.existsSync(modelsDir)) {
      dirsToLoad.push(modelsDir);
    }
    
    if (fs.existsSync(altModelsDir)) {
      dirsToLoad.push(altModelsDir);
    }
    
    if (dirsToLoad.length === 0) {
      return;
    }

    for (const dir of dirsToLoad) {
      await this.loadFilesFromDir(dir, (name: string, module: unknown) => {
        // Handle various export styles
        const Model = (module as { default?: unknown }).default || module;
        
        // Add to context with camelCase and PascalCase variations
        (this.context as Record<string, unknown>)[name] = Model;
        
        // If it's a function/class, add pluralized version for collections
        if (Model && typeof Model === 'function') {
          // Add pluralized version
          const pluralName = this.pluralize(name);
          if (pluralName !== name) {
            (this.context as Record<string, unknown>)[pluralName] = Model;
          }
        }
      });
    }
  }

  /**
   * Load services from services/ directory
   */
  async loadServices(): Promise<void> {
    const servicesDir = path.join(this.rootPath, this.config?.servicesDir || 'services');
    const altServicesDir = path.join(this.rootPath, 'app', 'services');
    
    const dirsToLoad: string[] = [];
    if (fs.existsSync(servicesDir)) dirsToLoad.push(servicesDir);
    if (fs.existsSync(altServicesDir)) dirsToLoad.push(altServicesDir);

    for (const dir of dirsToLoad) {
      await this.loadFilesFromDir(dir, (name: string, module: unknown) => {
        // Convert service names to camelCase
        const serviceName = this.toCamelCase(name.replace(/Service$/, ''));
        const ServiceClass = (module as { default?: unknown }).default || module;
        
        (this.context as Record<string, unknown>)[serviceName + 'Service'] = ServiceClass;
        (this.context as Record<string, unknown>)[name] = ServiceClass;
      });
    }
  }

  /**
   * Load helpers/utilities
   */
  async loadHelpers(): Promise<void> {
    const helpersDir = path.join(this.rootPath, this.config?.helpersDir || 'helpers');
    const utilsDir = path.join(this.rootPath, 'utils');
    
    const dirsToLoad: string[] = [];
    if (fs.existsSync(helpersDir)) dirsToLoad.push(helpersDir);
    if (fs.existsSync(utilsDir)) dirsToLoad.push(utilsDir);

    for (const dir of dirsToLoad) {
      await this.loadFilesFromDir(dir, (name: string, module: unknown) => {
        const Helper = (module as { default?: unknown }).default || module;
        const helperName = this.toCamelCase(name);
        (this.context as Record<string, unknown>)[helperName] = Helper;
      });
    }
  }

  /**
   * Load the main Express application
   */
  async loadExpressApp(): Promise<void> {
    // Try common app entry points
    const possibleEntries = [
      this.config?.appEntry,
      'app.js',
      'server.js',
      'index.js',
      'src/app.js',
      'src/server.js',
      'src/index.js',
      'dist/app.js',
      'dist/server.js'
    ].filter((entry): entry is string => Boolean(entry));

    for (const entry of possibleEntries) {
      const appPath = path.isAbsolute(entry) 
        ? entry 
        : path.join(this.rootPath, entry);

      if (fs.existsSync(appPath)) {
        try {
          const absolutePath = path.resolve(appPath);
          delete require.cache[require.resolve(absolutePath)];
          const appModule = require(absolutePath);
          const app: ExpressApplication = appModule.default || appModule;
          
          this.context.app = app;
          this.context.expressApp = app;
          this.loadedFiles.push(appPath);
          
          // Try to extract additional context from the app
          this.extractAppContext(app);
          
          break;
        } catch (err) {
          console.warn(`Warning: Could not load app from ${entry}: ${(err as Error).message}`);
        }
      }
    }
  }

  /**
   * Extract additional context from Express app instance
   */
  extractAppContext(app: ExpressApplication): void {
    // Extract routes if available
    interface ExpressLayer {
      route?: {
        path: string;
        methods: Record<string, boolean>;
      };
      name?: string;
      handle?: { stack?: ExpressLayer[] };
      regexp?: RegExp;
    }

    const router = (app as unknown as { _router?: { stack?: ExpressLayer[] } })._router;
    if (router?.stack) {
      this.context.routes = router.stack
        .filter((layer: ExpressLayer) => layer.route)
        .map((layer: ExpressLayer) => ({
          path: layer.route!.path,
          methods: Object.keys(layer.route!.methods)
        }));
    }
  }

  /**
   * Helper to load all JS files from a directory
   */
  async loadFilesFromDir(dirPath: string, callback: ModuleCallback): Promise<void> {
    if (!fs.existsSync(dirPath)) return;

    const files = fs.readdirSync(dirPath)
      .filter(f => f.endsWith('.js') || f.endsWith('.ts'))
      .filter(f => !f.endsWith('.test.js') && !f.endsWith('.spec.js') && !f.endsWith('.test.ts') && !f.endsWith('.spec.ts'));

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        await this.loadFilesFromDir(filePath, callback);
      } else {
        try {
          const absolutePath = path.resolve(filePath);
          delete require.cache[require.resolve(absolutePath)];
          const module = require(absolutePath);
          const name = path.basename(file, path.extname(file));
          
          callback(name, module);
          this.loadedFiles.push(filePath);
        } catch (err) {
          console.warn(`Warning: Could not load ${file}: ${(err as Error).message}`);
        }
      }
    }
  }

  /**
   * Simple pluralization helper
   */
  pluralize(name: string): string {
    if (name.endsWith('y')) {
      return name.slice(0, -1) + 'ies';
    }
    if (name.endsWith('s') || name.endsWith('x') || name.endsWith('ch')) {
      return name + 'es';
    }
    return name + 's';
  }

  /**
   * Convert string to camelCase
   */
  toCamelCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^[A-Z]/, char => char.toLowerCase());
  }

  /**
   * Get help text for available commands/context
   */
  getHelpText(): string {
    const sections: string[] = [];
    
    sections.push('Available Context:');
    sections.push('');
    
    // Group by type
    const modelFiles = this.loadedFiles.filter(f => f.includes('/models/'));
    const serviceFiles = this.loadedFiles.filter(f => f.includes('/services/'));
    
    const groups: Record<string, string[]> = {
      'Models': Object.keys(this.context).filter(k => 
        modelFiles.some(f => f.toLowerCase().includes(k.toLowerCase()))
      ),
      'Services': Object.keys(this.context).filter(k => 
        serviceFiles.some(f => f.toLowerCase().includes(k.toLowerCase()))
      ),
      'Config': ['config', 'env', 'NODE_ENV'],
      'App': ['app', 'expressApp', 'routes']
    };

    for (const [groupName, keys] of Object.entries(groups)) {
      const validKeys = keys.filter(k => this.context[k] !== undefined);
      if (validKeys.length > 0) {
        sections.push(`  ${groupName}:`);
        validKeys.forEach(key => {
          const value = this.context[key];
          const type = typeof value;
          sections.push(`    ${key} (${type})`);
        });
        sections.push('');
      }
    }

    sections.push('Type any variable name to inspect it.');
    sections.push('Use .help for REPL commands.');
    
    return sections.join('\n');
  }
}
