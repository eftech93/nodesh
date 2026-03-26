/**
 * Express Console - Rails-like console for Express.js
 * Provides an interactive REPL with autocompletion and app context
 */
import * as repl from 'repl';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { REPLServer } from 'repl';
import chalk from 'chalk';
import { AppLoader } from './loader';
import { NestJSLoader } from './nestjs-loader';
import { 
  ExpressConsoleOptions, 
  LoadedContext, 
  ConsoleCommand,
  CompleterResult
} from './types';
import { IntelligentCompleter, addIntrospectionMethods } from './autocomplete';

// Extend REPLServer interface for our custom properties
interface ExtendedREPLServer extends REPLServer {
  loader?: AppLoader | NestJSLoader;
  replServer?: ExtendedREPLServer;
  outputWriter?: (output: unknown) => string;
  printBanner?: () => void;
}

export class ExpressConsole {
  public options: Required<ExpressConsoleOptions> & { forceExpress?: boolean };
  public loader: AppLoader | NestJSLoader;
  public context: LoadedContext;
  public replServer: ExtendedREPLServer | null;

  constructor(options: ExpressConsoleOptions = {}) {
    this.options = {
      rootPath: options.rootPath || process.cwd(),
      prompt: options.prompt || 'node> ',
      useColors: options.useColors !== false,
      useGlobal: options.useGlobal !== false,
      historyFile: options.historyFile || path.join(os.homedir(), '.node_console_history'),
      preload: options.preload || [],
      context: options.context || {},
      appEntry: options.appEntry,
      modelsDir: options.modelsDir,
      servicesDir: options.servicesDir,
      helpersDir: options.helpersDir,
      configDir: options.configDir,
      forceExpress: options.forceExpress
    } as Required<ExpressConsoleOptions> & { forceExpress?: boolean };
    
    this.loader = new AppLoader({
      rootPath: this.options.rootPath,
      config: this.options
    });
    
    this.context = {};
    this.replServer = null;
  }

  /**
   * Start the console
   */
  async start(): Promise<ExtendedREPLServer> {
    // Show banner
    this.printBanner();
    
    // Detect NestJS and use appropriate loader
    const isNestJS = !this.options.forceExpress && 
      NestJSLoader.isNestJSProject(this.options.rootPath);
    
    if (isNestJS) {
      this.loader = new NestJSLoader({
        rootPath: this.options.rootPath,
        config: this.options
      });
    }
    
    // Load application context
    console.log(chalk.yellow('Loading application...'));
    
    try {
      this.context = await this.loader.load();
      console.log(chalk.green(`✓ Loaded ${this.loader.loadedFiles.length} files\n`));
    } catch (err) {
      console.error(chalk.red('Error loading application:'), (err as Error).message);
      console.log(chalk.yellow('Starting with empty context...\n'));
    }

    // Show available context
    console.log(this.loader.getHelpText());
    console.log('');

    // Create and configure REPL
    this.replServer = repl.start({
      prompt: chalk.cyan(this.options.prompt),
      useColors: this.options.useColors,
      useGlobal: this.options.useGlobal,
      completer: this.createCompleter.bind(this),
      writer: this.outputWriter.bind(this),
      preview: true
    }) as ExtendedREPLServer;

    // Set up REPL context with app objects
    Object.assign(this.replServer.context, this.context);
    
    // Add introspection methods for exploring objects
    addIntrospectionMethods(this.replServer.context);

    // Set up history
    this.setupHistory();

    // Define REPL commands
    this.defineCommands();

    // Handle exit
    this.replServer.on('exit', () => {
      console.log(chalk.yellow('\nGoodbye!'));
      process.exit(0);
    });

    return this.replServer;
  }

  /**
   * Print startup banner
   */
  printBanner(): void {
    const banner = [
      '',
      chalk.bold.cyan('╔════════════════════════════════════════╗'),
      chalk.bold.cyan('║       Node Console (ncon)              ║'),
      chalk.bold.cyan('║   Rails-like REPL for Node.js apps     ║'),
      chalk.bold.cyan('╚════════════════════════════════════════╝'),
      ''
    ].join('\n');
    
    console.log(banner);
  }

  /**
   * Custom completer with intelligent suggestions
   * Provides deep property and method completion
   */
  createCompleter(line: string): CompleterResult {
    const completer = new IntelligentCompleter(this.replServer?.context || this.context);
    return completer.complete(line);
  }

  /**
   * Custom output writer with syntax highlighting
   */
  outputWriter(output: unknown): string {
    if (output === undefined) {
      return chalk.gray('undefined');
    }
    
    if (output === null) {
      return chalk.gray('null');
    }
    
    if (typeof output === 'string') {
      return chalk.green(`'${output}'`);
    }
    
    if (typeof output === 'number') {
      return chalk.yellow(String(output));
    }
    
    if (typeof output === 'boolean') {
      return chalk.magenta(String(output));
    }
    
    if (typeof output === 'function') {
      const name = (output as { name?: string }).name || 'anonymous';
      return chalk.cyan(`[Function: ${name}]`);
    }
    
    if (output instanceof Date) {
      return chalk.blue(output.toISOString());
    }
    
    if (Array.isArray(output)) {
      const items = output.slice(0, 100).map(item => this.outputWriter(item));
      if (output.length > 100) {
        items.push(chalk.gray(`... ${output.length - 100} more items`));
      }
      return `[ ${items.join(', ')} ]`;
    }
    
    if (typeof output === 'object') {
      try {
        const str = JSON.stringify(output, null, 2);
        // Truncate if too long
        if (str.length > 500) {
          return str.substring(0, 500) + chalk.gray('\n... (truncated)');
        }
        return str;
      } catch (e) {
        return chalk.red('[Circular Object]');
      }
    }
    
    return String(output);
  }

  /**
   * Set up command history
   */
  setupHistory(): void {
    if (!this.replServer) return;
    
    const historyFile = this.options.historyFile || path.join(os.homedir(), '.express_console_history');

    try {
      // Load existing history
      if (fs.existsSync(historyFile)) {
        const history = fs.readFileSync(historyFile, 'utf8')
          .split('\n')
          .filter(Boolean);
        
        // Add to REPL history (newest at end)
        history.forEach(line => {
          if (!this.replServer!.history.includes(line)) {
            this.replServer!.history.push(line);
          }
        });
      }

      // Save history on exit
      this.replServer.on('exit', () => {
        this.saveHistory(historyFile);
      });
    } catch (err) {
      // History is optional, ignore errors
    }
  }

  /**
   * Save command history to file
   */
  saveHistory(historyFile: string): void {
    if (!this.replServer) return;
    
    try {
      // Get unique history entries, keep most recent 1000
      const seen = new Set<string>();
      const uniqueHistory: string[] = [];
      
      // Iterate from newest to oldest
      for (let i = this.replServer.history.length - 1; i >= 0; i--) {
        const line = this.replServer.history[i];
        if (line && !seen.has(line)) {
          seen.add(line);
          uniqueHistory.unshift(line);
          if (uniqueHistory.length >= 1000) break;
        }
      }
      
      fs.writeFileSync(historyFile, uniqueHistory.join('\n') + '\n');
    } catch (err) {
      // Ignore save errors
    }
  }

  /**
   * Define custom REPL commands
   */
  defineCommands(): void {
    if (!this.replServer) return;

    const self = this;

    // .reload - Reload all application files
    const reloadCommand: ConsoleCommand = {
      help: 'Reload all application files',
      action: async function(this: REPLServer) {
        console.log(chalk.yellow('Reloading...'));
        
        try {
          const newContext = await self.loader.load();
          Object.assign(self.replServer!.context, newContext);
          console.log(chalk.green('✓ Reloaded successfully'));
        } catch (err) {
          console.error(chalk.red('Error reloading:'), (err as Error).message);
        }
        
        this.displayPrompt();
      }
    };
    this.replServer.defineCommand('reload', reloadCommand);

    // .routes - Show all routes
    const routesCommand: ConsoleCommand = {
      help: 'List all Express routes',
      action: function(this: REPLServer) {
        const app = (self.context.expressApp || self.context.app) as { _router?: { stack?: unknown[] } } | undefined;
        
        if (!app || !app._router) {
          console.log(chalk.yellow('No routes found'));
          this.displayPrompt();
          return;
        }

        console.log(chalk.bold('\nRoutes:'));
        console.log(chalk.gray('─'.repeat(50)));
        
        interface ExpressLayer {
          route?: {
            path: string;
            methods: Record<string, boolean>;
          };
          name?: string;
          handle?: { stack?: ExpressLayer[] };
          regexp?: RegExp;
        }
        
        const router = app._router as { stack?: ExpressLayer[] };
        const routes: { methods: string; path: string }[] = [];
        
        router.stack?.forEach((layer: ExpressLayer) => {
          if (layer.route) {
            const methods = Object.keys(layer.route.methods)
              .map(m => m.toUpperCase())
              .join(', ');
            routes.push({
              methods: chalk.cyan(methods.padEnd(10)),
              path: chalk.green(layer.route.path)
            });
          } else if (layer.name === 'router' && layer.handle?.stack) {
            // Nested routers
            layer.handle.stack.forEach((nestedLayer: ExpressLayer) => {
              if (nestedLayer.route) {
                const methods = Object.keys(nestedLayer.route.methods)
                  .map(m => m.toUpperCase())
                  .join(', ');
                const basePath = layer.regexp?.toString()
                  .replace('\\/', '/')
                  .replace('/?(?=\\/|$)', '')
                  .replace('^\\?\\/\\(\\?=\\/\\|\\$\\)\\/i$', '') || '';
                routes.push({
                  methods: chalk.cyan(methods.padEnd(10)),
                  path: chalk.green('/' + basePath + nestedLayer.route.path)
                });
              }
            });
          }
        });

        routes.forEach(r => {
          console.log(`${r.methods} ${r.path}`);
        });
        
        console.log('');
        this.displayPrompt();
      }
    };
    this.replServer.defineCommand('routes', routesCommand);

    // .models - Show all loaded models
    const modelsCommand: ConsoleCommand = {
      help: 'List all loaded models',
      action: function(this: REPLServer) {
        console.log(chalk.bold('\nModels:'));
        
        const modelFiles = self.loader.loadedFiles.filter((f: string) => 
          f.includes('/models/')
        );
        
        if (modelFiles.length === 0) {
          console.log(chalk.yellow('No models loaded'));
        } else {
          modelFiles.forEach((f: string) => {
            const name = path.basename(f, path.extname(f));
            console.log(`  ${chalk.green(name)} ${chalk.gray(f)}`);
          });
        }
        
        console.log('');
        this.displayPrompt();
      }
    };
    this.replServer.defineCommand('models', modelsCommand);

    // .services - Show all loaded services
    const servicesCommand: ConsoleCommand = {
      help: 'List all loaded services',
      action: function(this: REPLServer) {
        console.log(chalk.bold('\nServices:'));
        
        const serviceFiles = self.loader.loadedFiles.filter((f: string) => 
          f.includes('/services/')
        );
        
        if (serviceFiles.length === 0) {
          console.log(chalk.yellow('No services loaded'));
        } else {
          serviceFiles.forEach((f: string) => {
            const name = path.basename(f, path.extname(f));
            console.log(`  ${chalk.green(name)} ${chalk.gray(f)}`);
          });
        }
        
        console.log('');
        this.displayPrompt();
      }
    };
    this.replServer.defineCommand('services', servicesCommand);

    // .config - Show configuration
    const configCommand: ConsoleCommand = {
      help: 'Show application configuration',
      action: function(this: REPLServer) {
        console.log(chalk.bold('\nConfiguration:'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log('NODE_ENV:', chalk.green(self.context.NODE_ENV));
        console.log('');
        
        if (self.context.config) {
          Object.keys(self.context.config).forEach(key => {
            console.log(chalk.cyan(key + ':'));
            console.log(self.outputWriter((self.context.config as Record<string, unknown>)[key]));
            console.log('');
          });
        }
        
        this.displayPrompt();
      }
    };
    this.replServer.defineCommand('config', configCommand);

    // .env - Show environment variables
    const envCommand: ConsoleCommand = {
      help: 'Show environment variables',
      action: function(this: REPLServer) {
        console.log(chalk.bold('\nEnvironment Variables:'));
        console.log(chalk.gray('─'.repeat(50)));
        
        const envVars = Object.keys(self.context.env || process.env)
          .sort()
          .filter(key => !key.startsWith('npm_'));
        
        envVars.forEach(key => {
          const env = self.context.env || process.env;
          const value = env[key];
          // Mask sensitive values
          const isSensitive = /(password|secret|key|token|auth)/i.test(key);
          const displayValue = isSensitive 
            ? chalk.gray('***')
            : chalk.green(value);
          console.log(`${chalk.cyan(key)}=${displayValue}`);
        });
        
        console.log('');
        this.displayPrompt();
      }
    };
    this.replServer.defineCommand('env', envCommand);

    // .clear - Clear screen
    const clearCommand: ConsoleCommand = {
      help: 'Clear the screen',
      action: function(this: REPLServer) {
        console.clear();
        self.printBanner();
        self.replServer!.displayPrompt();
      }
    };
    this.replServer.defineCommand('clear', clearCommand);

    // .help - Custom help
    const helpCommand: ConsoleCommand = {
      help: 'Show this help message',
      action: function(this: REPLServer) {
        console.log(chalk.bold('\nExpress Console Commands:'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(`${chalk.cyan('.reload')}    - Reload all application files`);
        console.log(`${chalk.cyan('.routes')}    - List all Express routes`);
        console.log(`${chalk.cyan('.models')}    - List all loaded models`);
        console.log(`${chalk.cyan('.services')}  - List all loaded services`);
        console.log(`${chalk.cyan('.config')}    - Show application configuration`);
        console.log(`${chalk.cyan('.env')}       - Show environment variables`);
        console.log(`${chalk.cyan('.clear')}     - Clear the screen`);
        console.log(`${chalk.cyan('.exit')}      - Exit the console`);
        console.log(`${chalk.cyan('.help')}      - Show this help message`);
        console.log('');
        
        console.log(self.loader.getHelpText());
        console.log('');
        
        this.displayPrompt();
      }
    };
    this.replServer.defineCommand('help', helpCommand);
  }
}
