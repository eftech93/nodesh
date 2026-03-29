# Console API

Detailed API documentation for the console functionality.

## ExpressConsole Class

The main class for creating and managing the interactive shell.

### Properties

```typescript
class ExpressConsole {
  options: Required<ExpressConsoleOptions> & { forceExpress?: boolean };
  loader: AppLoader | NestJSLoader | NextJSLoader;
  context: LoadedContext;
  replServer: ExtendedREPLServer | null;
}
```

### Constructor

```typescript
constructor(options?: ExpressConsoleOptions)
```

Creates a new ExpressConsole instance.

**Example:**

```typescript
const console = new ExpressConsole({
  rootPath: __dirname,
  prompt: 'myapp> '
});
```

### Methods

#### start()

```typescript
async start(): Promise<ExtendedREPLServer>
```

Starts the REPL console. This method:
1. Prints the banner
2. Detects the framework
3. Loads the application context
4. Sets up the REPL server
5. Configures history and commands

**Example:**

```typescript
const replServer = await console.start();
```

#### printBanner()

```typescript
printBanner(): void
```

Prints the NodeSH startup banner.

**Example:**

```typescript
console.printBanner();
```

Output:
```
╔════════════════════════════════════════╗
║           NodeSH (nodesh)              ║
║    Interactive shell for Node.js apps  ║
╚════════════════════════════════════════╝
```

#### createCompleter()

```typescript
createCompleter(line: string): CompleterResult
```

Creates the tab completion handler for the REPL.

**Parameters:**
- `line` - Current input line

**Returns:** `[string[], string]` - Completions and matched text

**Example:**

```typescript
const [completions, match] = console.createCompleter('userService.');
```

#### outputWriter()

```typescript
outputWriter(output: unknown): string
```

Formats output with syntax highlighting.

**Supported types:**
- `undefined` - Gray color
- `null` - Gray color
- `string` - Green color
- `number` - Yellow color
- `boolean` - Magenta color
- `function` - Cyan color
- `Date` - Blue color (ISO format)
- `Array` - Formatted with items
- `Object` - JSON formatted

**Example:**

```typescript
console.log(console.outputWriter({ name: 'test' }));
// Output: {\n  "name": "test"\n}
```

#### setupHistory()

```typescript
setupHistory(): void
```

Sets up command history loading and saving.

#### saveHistory()

```typescript
saveHistory(historyFile: string): void
```

Saves command history to file.

#### defineCommands()

```typescript
defineCommands(): void
```

Defines all built-in REPL commands (`.reload`, `.routes`, `.models`, etc.).

## ExtendedREPLServer Interface

Extended REPLServer with custom properties.

```typescript
interface ExtendedREPLServer extends REPLServer {
  loader?: AppLoader | NestJSLoader | NextJSLoader;
  replServer?: ExtendedREPLServer;
  outputWriter?: (output: unknown) => string;
  printBanner?: () => void;
}
```

## ConsoleCommand Interface

Interface for custom REPL commands.

```typescript
interface ConsoleCommand {
  help: string;
  action: (this: REPLServer) => void;
}
```

**Example:**

```typescript
const customCommand: ConsoleCommand = {
  help: 'Custom command description',
  action: function(this: REPLServer) {
    console.log('Custom command executed!');
    this.displayPrompt();
  }
};

replServer.defineCommand('custom', customCommand);
```

## CompleterResult Type

```typescript
type CompleterResult = [string[], string];
```

- First element: Array of completions
- Second element: The matched portion of the input

## Usage Examples

### Custom Output Formatting

```typescript
import { ExpressConsole } from '@eftech93/nodesh';

class CustomConsole extends ExpressConsole {
  outputWriter(output: unknown): string {
    // Custom formatting for specific types
    if (output instanceof Date) {
      return `📅 ${output.toLocaleDateString()}`;
    }
    
    // Fall back to default
    return super.outputWriter(output);
  }
}

const console = new CustomConsole();
await console.start();
```

### Custom Command

```typescript
import { ExpressConsole } from '@eftech93/nodesh';

const console = new ExpressConsole();
await console.start();

// Add custom command after start
if (console.replServer) {
  console.replServer.defineCommand('status', {
    help: 'Show application status',
    action: function(this: REPLServer) {
      console.log('Application Status:');
      console.log('  Loaded files:', console.loader.loadedFiles.length);
      console.log('  Context keys:', Object.keys(console.context).length);
      this.displayPrompt();
    }
  });
}
```

### Event Handling

```typescript
const console = new ExpressConsole();
const repl = await console.start();

// Handle custom events
repl.on('exit', () => {
  console.log('Performing cleanup...');
  // Cleanup code here
});
```

## Error Handling

The console handles errors gracefully:

```typescript
try {
  await console.start();
} catch (error) {
  console.error('Failed to start console:', error);
  process.exit(1);
}
```

Common errors:
- Missing entry file
- Syntax errors in loaded files
- Database connection failures
