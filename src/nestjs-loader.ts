/**
 * NestJS-specific loader - works with Nest's DI container
 */
import * as fs from 'fs';
import * as path from 'path';
import { INestApplication } from '@nestjs/common';
import { AppLoaderOptions, LoadedContext } from './types';

interface NestJSModule {
  bootstrap?: () => Promise<INestApplication> | INestApplication;
}

export class NestJSLoader {
  public rootPath: string;
  public config: AppLoaderOptions['config'];
  public context: LoadedContext;
  public loadedFiles: string[];
  public nestApp: INestApplication | null;

  constructor(options: AppLoaderOptions = {}) {
    this.rootPath = options.rootPath || process.cwd();
    this.config = options.config || {};
    this.context = {};
    this.loadedFiles = [];
    this.nestApp = null;
  }

  /**
   * Check if this is a NestJS project
   */
  static isNestJSProject(rootPath: string): boolean {
    // Check for nest-cli.json
    if (fs.existsSync(path.join(rootPath, 'nest-cli.json'))) {
      return true;
    }
    
    // Check package.json for @nestjs/core
    const packageJsonPath = path.join(rootPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps['@nestjs/core']) {
          return true;
        }
      } catch (e) {
        // Ignore
      }
    }

    // Check for src/main.ts or src/main.js (common NestJS pattern)
    const mainFiles = ['src/main.ts', 'src/main.js', 'main.ts', 'main.js'];
    for (const file of mainFiles) {
      const mainPath = path.join(rootPath, file);
      if (fs.existsSync(mainPath)) {
        const content = fs.readFileSync(mainPath, 'utf8');
        if (content.includes('NestFactory') || content.includes('@nestjs')) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Load NestJS application
   */
  async load(): Promise<LoadedContext> {
    console.log('Detected NestJS application');
    
    // Load environment
    this.loadEnvironment();
    
    // Load entities first (so they're available even if bootstrap fails)
    await this.loadEntities();
    
    // Load services from source
    await this.loadAllServices();
    
    // Load queues
    await this.loadQueues();
    
    // Try to bootstrap the NestJS app
    await this.bootstrapNestApp();
    
    return this.context;
  }

  /**
   * Bootstrap the NestJS application
   */
  async bootstrapNestApp(): Promise<void> {
    // Find the main file
    const mainFiles = [
      this.config?.appEntry,
      'src/main.ts',
      'src/main.js',
      'main.ts',
      'main.js'
    ].filter((entry): entry is string => Boolean(entry));

    let mainModule: NestJSModule | null = null;
    let mainPath: string | null = null;

    for (const file of mainFiles) {
      const fullPath = path.isAbsolute(file) 
        ? file 
        : path.join(this.rootPath, file);
      
      if (fs.existsSync(fullPath)) {
        try {
          // For TypeScript, we might need ts-node/register
          if (fullPath.endsWith('.ts') && !require.extensions['.ts']) {
            this.registerTypeScript();
          }
          
          const absolutePath = path.resolve(fullPath);
          delete require.cache[require.resolve(absolutePath)];
          mainModule = require(absolutePath) as NestJSModule;
          mainPath = fullPath;
          this.loadedFiles.push(fullPath);
          break;
        } catch (err) {
          console.warn(`Warning: Could not load main file ${file}: ${(err as Error).message}`);
        }
      }
    }

    if (!mainModule || !mainPath) {
      console.warn('Could not find NestJS main file');
      return;
    }

    // Try to get the AppModule and bootstrap
    try {
      // Look for bootstrap function
      if (mainModule.bootstrap) {
        // Call bootstrap but don't let it fully start
        const appPromise = mainModule.bootstrap();
        
        // Give it a moment to initialize
        this.nestApp = await Promise.race([
          appPromise,
          new Promise<INestApplication>((_, reject) => 
            setTimeout(() => reject(new Error('Bootstrap timeout')), 5000)
          )
        ]).catch(() => null);

        if (this.nestApp) {
          this.context.app = this.nestApp;
          this.context.nestApp = this.nestApp;
          
          // Extract providers from the app
          await this.extractProvidersFromApp();
          
          // Get HTTP adapter (Express instance)
          interface HttpAdapterHost {
            getInstance: () => unknown;
          }
          
          const nestAppWithHttp = this.nestApp as INestApplication & { 
            getHttpAdapter?: () => HttpAdapterHost;
          };
          
          if (nestAppWithHttp.getHttpAdapter) {
            const adapter = nestAppWithHttp.getHttpAdapter();
            if (adapter && typeof adapter.getInstance === 'function') {
              this.context.expressApp = adapter.getInstance();
            }
          }
        }
      }
    } catch (err) {
      console.warn(`Warning: Could not bootstrap NestJS app: ${(err as Error).message}`);
    }
  }

  /**
   * Extract providers/services from the NestJS app
   */
  async extractProvidersFromApp(): Promise<void> {
    if (!this.nestApp) return;

    try {
      // Get the module ref to access providers
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ModuleRef } = require('@nestjs/core');
      const moduleRef = this.nestApp.get(ModuleRef);

      // Get all controllers
      const controllers = this.getControllers();
      controllers.forEach(ctrl => {
        const controller = ctrl as { name?: string; constructor?: { name?: string } };
        const name = controller.name || controller.constructor?.name;
        if (name) {
          (this.context as Record<string, unknown>)[name] = ctrl;
        }
      });

    } catch (err) {
      // ModuleRef might not be available
    }
  }

  /**
   * Get controllers from the NestJS app
   */
  getControllers(): unknown[] {
    const controllers: unknown[] = [];
    
    try {
      // Access internal container
      interface NestJSContainer {
        getModules: () => Map<unknown, {
          controllers?: Map<unknown, { instance?: unknown }>;
        }>;
      }
      
      const nestAppWithContainer = this.nestApp as INestApplication & { 
        container?: NestJSContainer;
      };
      
      const container = nestAppWithContainer.container;
      if (container) {
        const modules = container.getModules();
        for (const [, module] of modules) {
          if (module.controllers) {
            for (const [, wrapper] of module.controllers) {
              if (wrapper.instance) {
                controllers.push(wrapper.instance);
              }
            }
          }
        }
      }
    } catch (err) {
      // Internal API might change
    }

    return controllers;
  }

  /**
   * Load all services from the src directory
   */
  async loadAllServices(): Promise<void> {
    const srcDir = path.join(this.rootPath, 'src');
    if (!fs.existsSync(srcDir)) return;

    await this.loadServicesFromDir(srcDir);
  }

  /**
   * Load services from a directory recursively
   */
  async loadServicesFromDir(dir: string): Promise<void> {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules and test directories
        if (file === 'node_modules' || file === 'test' || file === 'tests' || file === '__tests__') {
          continue;
        }
        // Recurse into subdirectories
        await this.loadServicesFromDir(fullPath);
      } else if (
        (file.endsWith('.service.ts') || file.endsWith('.service.js')) &&
        !file.endsWith('.spec.ts') &&
        !file.endsWith('.spec.js')
      ) {
        try {
          // Register TS if needed
          if (fullPath.endsWith('.ts') && !require.extensions['.ts']) {
            this.registerTypeScript();
          }

          const absolutePath = path.resolve(fullPath);
          delete require.cache[require.resolve(absolutePath)];
          const module = require(absolutePath);
          
          // Get the service class
          const ServiceClass = module.default || 
            Object.values(module).find((v): v is new () => unknown => typeof v === 'function');

          if (ServiceClass) {
            const name = (ServiceClass as { name?: string }).name || path.basename(file, path.extname(file));
            
            // Try to instantiate with the NestJS container
            let instance: unknown = null;
            try {
              if (this.nestApp && typeof this.nestApp.get === 'function') {
                instance = this.nestApp.get(ServiceClass);
              }
            } catch (e) {
              // Service might not be registered
            }

            // If we can't get from container, try manual instantiation
            if (!instance) {
              try {
                instance = new (ServiceClass as new () => unknown)();
              } catch (e) {
                instance = ServiceClass;
              }
            }

            // Add to context with various naming conventions
            (this.context as Record<string, unknown>)[name] = instance;
            (this.context as Record<string, unknown>)[this.toCamelCase(name)] = instance;
            
            // Add without 'Service' suffix
            if (name.endsWith('Service')) {
              const shortName = name.slice(0, -7);
              const camelShortName = this.toCamelCase(shortName);
              (this.context as Record<string, unknown>)[shortName] = instance;
              (this.context as Record<string, unknown>)[camelShortName] = instance;
            }

            this.loadedFiles.push(fullPath);
          }
        } catch (err) {
          // Skip files that can't be loaded
        }
      }
    }
  }

  /**
   * Load entities from the src directory
   */
  async loadEntities(): Promise<void> {
    const srcDir = path.join(this.rootPath, 'src');
    if (!fs.existsSync(srcDir)) return;

    // Look for entity files
    const entityPattern = /\.entity\.(ts|js)$/;
    
    const scanDir = (dir: string): void => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (file === 'node_modules' || file === 'test' || file === 'tests') {
            continue;
          }
          scanDir(fullPath);
        } else if (entityPattern.test(file)) {
          try {
            if (fullPath.endsWith('.ts') && !require.extensions['.ts']) {
              this.registerTypeScript();
            }
            
            const absolutePath = path.resolve(fullPath);
            delete require.cache[require.resolve(absolutePath)];
            const module = require(absolutePath);
            const Entity = module.default || Object.values(module)[0];
            
            if (Entity && typeof Entity === 'function' && 'name' in Entity) {
              (this.context as Record<string, unknown>)[Entity.name] = Entity;
              this.loadedFiles.push(fullPath);
            }
          } catch (err) {
            // Skip
          }
        }
      }
    };

    scanDir(srcDir);
  }

  /**
   * Load queue-related files
   */
  async loadQueues(): Promise<void> {
    // Look for queue service/processor files
    const queueDirs = [
      path.join(this.rootPath, 'src/queues'),
      path.join(this.rootPath, 'src/queue'),
      path.join(this.rootPath, 'src/jobs'),
      path.join(this.rootPath, 'src/bull'),
    ];

    for (const dir of queueDirs) {
      if (!fs.existsSync(dir)) continue;
      
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Recurse into subdirectories (like processors)
          await this.loadQueuesFromDir(fullPath);
        } else if (
          (file.endsWith('.ts') || file.endsWith('.js')) &&
          !file.endsWith('.spec.ts') &&
          !file.endsWith('.spec.js') &&
          !file.endsWith('.d.ts')
        ) {
          try {
            if (fullPath.endsWith('.ts') && !require.extensions['.ts']) {
              this.registerTypeScript();
            }

            const absolutePath = path.resolve(fullPath);
            delete require.cache[require.resolve(absolutePath)];
            const module = require(absolutePath);
            
            // Get the exported class
            const ExportClass = module.default || 
              Object.values(module).find((v): v is new () => unknown => typeof v === 'function');

            if (ExportClass) {
              const name = (ExportClass as { name?: string }).name || path.basename(file, path.extname(file));
              (this.context as Record<string, unknown>)[name] = ExportClass;
              (this.context as Record<string, unknown>)[this.toCamelCase(name)] = ExportClass;
              this.loadedFiles.push(fullPath);
            }
          } catch (err) {
            // Skip
          }
        }
      }
    }
  }

  /**
   * Load queues from a subdirectory
   */
  async loadQueuesFromDir(dir: string): Promise<void> {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        await this.loadQueuesFromDir(fullPath);
      } else if (
        (file.endsWith('.ts') || file.endsWith('.js')) &&
        !file.endsWith('.spec.ts') &&
        !file.endsWith('.spec.js')
      ) {
        try {
          if (fullPath.endsWith('.ts') && !require.extensions['.ts']) {
            this.registerTypeScript();
          }

          const absolutePath = path.resolve(fullPath);
          delete require.cache[require.resolve(absolutePath)];
          const module = require(absolutePath);
          
          const ExportClass = module.default || 
            Object.values(module).find((v): v is new () => unknown => typeof v === 'function');

          if (ExportClass) {
            const name = (ExportClass as { name?: string }).name || path.basename(file, path.extname(file));
            (this.context as Record<string, unknown>)[name] = ExportClass;
            (this.context as Record<string, unknown>)[this.toCamelCase(name)] = ExportClass;
            this.loadedFiles.push(fullPath);
          }
        } catch (err) {
          // Skip
        }
      }
    }
  }

  /**
   * Register TypeScript support
   */
  registerTypeScript(): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('ts-node/register');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('tsconfig-paths/register');
    } catch (err) {
      console.warn('TypeScript support not available. Install ts-node and tsconfig-paths.');
    }
  }

  /**
   * Load environment variables
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
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          require('dotenv').config({ path: envPath });
        } catch (e) {
          // Ignore
        }
      }
    }

    this.context.env = process.env;
    this.context.NODE_ENV = process.env.NODE_ENV || 'development';
  }

  /**
   * Convert string to camelCase
   */
  toCamelCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
        index === 0 ? word.toLowerCase() : word.toUpperCase()
      )
      .replace(/[\s-_]+/g, '');
  }

  /**
   * Get help text
   */
  getHelpText(): string {
    const sections: string[] = [];
    
    sections.push('Available Context (NestJS):');
    sections.push('');

    // Group by type
    const services = Object.keys(this.context).filter(k => 
      k.includes('Service') || k.includes('service')
    );
    
    const entities = Object.keys(this.context).filter(k => 
      this.loadedFiles.some(f => f.includes('.entity.'))
    );
    
    const queues = Object.keys(this.context).filter(k =>
      this.loadedFiles.some(f => f.includes('/queues/') || f.includes('/queue/'))
    );

    if (entities.length > 0) {
      sections.push('  Entities:');
      entities.forEach(key => {
        sections.push(`    ${key}`);
      });
      sections.push('');
    }

    if (services.length > 0) {
      sections.push('  Services:');
      services.slice(0, 20).forEach(key => {
        sections.push(`    ${key}`);
      });
      if (services.length > 20) {
        sections.push(`    ... and ${services.length - 20} more`);
      }
      sections.push('');
    }

    if (queues.length > 0) {
      sections.push('  Queues/Processors:');
      queues.forEach(key => {
        sections.push(`    ${key}`);
      });
      sections.push('');
    }

    if (this.context.app) {
      sections.push('  App:');
      sections.push('    app (NestJS application)');
      sections.push('    nestApp (alias)');
      if (this.context.expressApp) {
        sections.push('    expressApp (Express instance)');
      }
      sections.push('');
    }

    sections.push('  General:');
    sections.push('    env (environment variables)');
    sections.push('    NODE_ENV (current environment)');
    sections.push('');

    sections.push('Type any variable name to inspect it.');
    sections.push('Use .help for REPL commands.');
    
    return sections.join('\n');
  }
}
