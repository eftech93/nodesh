# Core API

The core API provides the main classes and functions for working with NodeSH programmatically.

## ExpressConsole

The main console class for Express applications.

```typescript
import { ExpressConsole } from '@eftech93/nodesh';

const console = new ExpressConsole(options);
await console.start();
```

### Constructor Options

```typescript
interface ExpressConsoleOptions {
  rootPath?: string;      // Project root directory (default: process.cwd())
  appEntry?: string;      // Entry file path
  modelsDir?: string;     // Models directory
  servicesDir?: string;   // Services directory
  helpersDir?: string;    // Helpers directory
  configDir?: string;     // Config directory
  prompt?: string;        // REPL prompt (default: 'node> ')
  useColors?: boolean;    // Enable colors (default: true)
  useGlobal?: boolean;    // Use global context (default: true)
  historyFile?: string;   // History file path
  preload?: string[];     // Modules to preload
  context?: object;       // Additional context
  forceExpress?: boolean; // Force Express mode
}
```

### Methods

#### start()

Starts the REPL console.

```typescript
async start(): Promise<REPLServer>
```

Returns a Promise that resolves to the REPLServer instance.

#### printBanner()

Prints the startup banner.

```typescript
printBanner(): void
```

#### createCompleter()

Creates the tab completion handler.

```typescript
createCompleter(line: string): [string[], string]
```

#### outputWriter()

Formats output with syntax highlighting.

```typescript
outputWriter(output: unknown): string
```

## AppLoader

Loads Express application files and creates context.

```typescript
import { AppLoader } from '@eftech93/nodesh';

const loader = new AppLoader({
  rootPath: __dirname,
  config: { /* options */ }
});

const context = await loader.load();
```

### Constructor Options

```typescript
interface AppLoaderOptions {
  rootPath: string;
  config: ConsoleConfig;
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `loadedFiles` | `string[]` | List of loaded file paths |
| `context` | `LoadedContext` | Loaded application context |

### Methods

#### load()

Loads the application and returns context.

```typescript
async load(): Promise<LoadedContext>
```

#### getHelpText()

Returns help text showing available context.

```typescript
getHelpText(): string
```

## NestJSLoader

Loader for NestJS applications.

```typescript
import { NestJSLoader } from '@eftech93/nodesh';

const loader = new NestJSLoader({
  rootPath: __dirname,
  config: { /* options */ }
});
```

### Static Methods

#### isNestJSProject()

Detects if the project is a NestJS application.

```typescript
static isNestJSProject(rootPath: string): boolean
```

## NextJSLoader

Loader for Next.js applications.

```typescript
import { NextJSLoader } from '@eftech93/nodesh';

const loader = new NextJSLoader({
  rootPath: __dirname,
  config: { /* options */ }
});
```

### Static Methods

#### isNextJSProject()

Detects if the project is a Next.js application.

```typescript
static isNextJSProject(rootPath: string): boolean
```

## Configuration API

### loadConfig()

Loads configuration from various sources.

```typescript
import { loadConfig } from '@eftech93/nodesh';

const config = loadConfig('/path/to/project');
```

Returns a `ConsoleConfig` object with merged configuration.

### generateConfig()

Generates a new configuration file.

```typescript
import { generateConfig } from '@eftech93/nodesh';

const result = generateConfig('/path/to/project');
// Returns: { created: boolean, path: string }
```

### CONFIG_FILES

Array of configuration file names to check.

```typescript
import { CONFIG_FILES } from '@eftech93/nodesh';

console.log(CONFIG_FILES);
// ['.nodesh.js', '.nodesh.json', 'nodesh.config.js']
```

## Types

### ConsoleConfig

```typescript
interface ConsoleConfig {
  rootPath: string;
  appEntry: string | null;
  modelsDir: string;
  servicesDir: string;
  helpersDir: string;
  configDir: string;
  prompt: string;
  useColors: boolean;
  useGlobal: boolean;
  historyFile: string | null;
  preload: string[];
  context: Record<string, unknown>;
  forceExpress?: boolean;
}
```

### LoadedContext

```typescript
interface LoadedContext {
  [key: string]: unknown;
  app?: Application;
  expressApp?: Application;
  models?: Record<string, Model>;
  services?: Record<string, Service>;
  config?: Record<string, unknown>;
  env?: Record<string, string>;
  NODE_ENV?: string;
}
```

## Example: Custom Console

```typescript
import { ExpressConsole } from '@eftech93/nodesh';

async function startCustomConsole() {
  const console = new ExpressConsole({
    rootPath: __dirname,
    appEntry: 'src/app.ts',
    modelsDir: 'src/models',
    servicesDir: 'src/services',
    prompt: 'dev> ',
    useColors: true,
    context: {
      // Add custom objects
      moment: require('moment'),
      _: require('lodash')
    }
  });

  await console.start();
}

startCustomConsole();
```

## Example: Programmatic Loader

```typescript
import { AppLoader } from '@eftech93/nodesh';

async function loadApp() {
  const loader = new AppLoader({
    rootPath: process.cwd(),
    config: {
      rootPath: process.cwd(),
      appEntry: 'src/app.js',
      modelsDir: 'src/models',
      servicesDir: 'src/services',
      helpersDir: 'helpers',
      configDir: 'config',
      prompt: 'node> ',
      useColors: true,
      useGlobal: true,
      historyFile: null,
      preload: [],
      context: {}
    }
  });

  const context = await loader.load();
  console.log('Loaded files:', loader.loadedFiles);
  console.log('Available context:', Object.keys(context));
  
  return context;
}

loadApp();
```
