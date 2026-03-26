/**
 * Integration tests for the ExpressConsole class
 */

import * as fs from 'fs';
import * as path from 'path';
import { ExpressConsole } from '../src/console';

// Helper functions
function createTempDir(): string {
  const tempDir = path.join(__dirname, 'temp-console-test-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11));
  fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

function removeTempDir(tempDir: string): void {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

// Mock REPL to avoid starting an actual interactive session
jest.mock('repl', () => ({
  start: jest.fn().mockReturnValue({
    context: {},
    defineCommand: jest.fn(),
    on: jest.fn(),
    displayPrompt: jest.fn(),
    history: []
  })
}));

describe('ExpressConsole', () => {
  let tempDir: string;
  let console: ExpressConsole;

  beforeEach(() => {
    tempDir = createTempDir();
    jest.clearAllMocks();
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const originalCwd = process.cwd;
      process.cwd = jest.fn().mockReturnValue(tempDir);
      
      console = new ExpressConsole();
      
      expect(console.options.rootPath).toBe(tempDir);
      expect(console.options.prompt).toBe('node> ');
      expect(console.options.useColors).toBe(true);
      expect(console.options.useGlobal).toBe(true);
      
      process.cwd = originalCwd;
    });

    it('should accept custom options', () => {
      console = new ExpressConsole({
        rootPath: tempDir,
        prompt: 'custom> ',
        useColors: false,
        useGlobal: false,
        appEntry: 'src/app.js',
        modelsDir: 'src/models',
        servicesDir: 'src/services'
      });

      expect(console.options.rootPath).toBe(tempDir);
      expect(console.options.prompt).toBe('custom> ');
      expect(console.options.useColors).toBe(false);
      expect(console.options.appEntry).toBe('src/app.js');
    });

    it('should create an AppLoader instance', () => {
      console = new ExpressConsole({ rootPath: tempDir });
      
      expect(console.loader).toBeDefined();
      expect(console.loader.rootPath).toBe(tempDir);
    });
  });

  describe('printBanner', () => {
    it('should print the banner without error', () => {
      console = new ExpressConsole({ rootPath: tempDir });
      
      const consoleLog = jest.spyOn(console_util, 'log').mockImplementation();
      
      expect(() => console.printBanner()).not.toThrow();
      
      consoleLog.mockRestore();
    });
  });

  describe('createCompleter', () => {
    it('should return a completer function', () => {
      console = new ExpressConsole({ rootPath: tempDir });
      console.replServer = {
        context: { testService: { method: () => {} } }
      } as any;

      const completer = console.createCompleter.bind(console);
      const result = completer('testService.');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toContain('method()');
    });
  });

  describe('outputWriter', () => {
    it('should format undefined', () => {
      console = new ExpressConsole({ rootPath: tempDir });
      
      const result = console.outputWriter(undefined);
      
      expect(result).toContain('undefined');
    });

    it('should format null', () => {
      console = new ExpressConsole({ rootPath: tempDir });
      
      const result = console.outputWriter(null);
      
      expect(result).toContain('null');
    });

    it('should format strings', () => {
      console = new ExpressConsole({ rootPath: tempDir });
      
      const result = console.outputWriter('hello');
      
      expect(result).toContain('hello');
    });

    it('should format numbers', () => {
      console = new ExpressConsole({ rootPath: tempDir });
      
      const result = console.outputWriter(42);
      
      expect(result).toContain('42');
    });

    it('should format booleans', () => {
      console = new ExpressConsole({ rootPath: tempDir });
      
      const result = console.outputWriter(true);
      
      expect(result).toContain('true');
    });

    it('should format functions', () => {
      console = new ExpressConsole({ rootPath: tempDir });
      
      function testFn() {}
      const result = console.outputWriter(testFn);
      
      expect(result).toContain('Function');
      expect(result).toContain('testFn');
    });

    it('should format Dates', () => {
      console = new ExpressConsole({ rootPath: tempDir });
      
      const date = new Date('2024-01-15');
      const result = console.outputWriter(date);
      
      expect(result).toContain('2024');
    });

    it('should format arrays', () => {
      console = new ExpressConsole({ rootPath: tempDir });
      
      const result = console.outputWriter([1, 2, 3]);
      
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
    });

    it('should format objects', () => {
      console = new ExpressConsole({ rootPath: tempDir });
      
      const result = console.outputWriter({ key: 'value' });
      
      expect(result).toContain('key');
      expect(result).toContain('value');
    });

    it('should truncate long objects', () => {
      console = new ExpressConsole({ rootPath: tempDir });
      
      const longObject = { data: 'x'.repeat(1000) };
      const result = console.outputWriter(longObject);
      
      expect(result).toContain('truncated');
    });

    it('should handle circular references', () => {
      console = new ExpressConsole({ rootPath: tempDir });
      
      const obj: any = { a: 1 };
      obj.self = obj;
      
      const result = console.outputWriter(obj);
      
      expect(result).toContain('Circular');
    });
  });

  describe('setupHistory', () => {
    it('should load existing history file', () => {
      console = new ExpressConsole({ 
        rootPath: tempDir,
        historyFile: path.join(tempDir, 'history')
      });
      
      // Create history file
      fs.writeFileSync(path.join(tempDir, 'history'), 'cmd1\ncmd2\n');
      
      console.replServer = {
        context: {},
        history: []
      } as any;
      
      console.setupHistory();
      
      expect(console.replServer!.history).toContain('cmd1');
      expect(console.replServer!.history).toContain('cmd2');
    });

    it('should handle missing history file gracefully', () => {
      console = new ExpressConsole({ 
        rootPath: tempDir,
        historyFile: path.join(tempDir, 'non-existent')
      });
      
      console.replServer = {
        context: {},
        history: []
      } as any;
      
      expect(() => console.setupHistory()).not.toThrow();
    });

    it('should skip duplicate history entries', () => {
      console = new ExpressConsole({ 
        rootPath: tempDir,
        historyFile: path.join(tempDir, 'history')
      });
      
      fs.writeFileSync(path.join(tempDir, 'history'), 'duplicate\nduplicate\n');
      
      console.replServer = {
        context: {},
        history: []
      } as any;
      
      console.setupHistory();
      
      const duplicates = console.replServer!.history.filter(h => h === 'duplicate');
      expect(duplicates.length).toBe(1);
    });
  });

  describe('saveHistory', () => {
    it('should save history to file', () => {
      const historyFile = path.join(tempDir, 'history');
      console = new ExpressConsole({ 
        rootPath: tempDir,
        historyFile
      });
      
      console.replServer = {
        context: {},
        history: ['cmd1', 'cmd2', 'cmd3']
      } as any;
      
      console.saveHistory(historyFile);
      
      const saved = fs.readFileSync(historyFile, 'utf8');
      expect(saved).toContain('cmd1');
      expect(saved).toContain('cmd2');
      expect(saved).toContain('cmd3');
    });

    it('should limit history to 1000 entries', () => {
      const historyFile = path.join(tempDir, 'history');
      console = new ExpressConsole({ 
        rootPath: tempDir,
        historyFile
      });
      
      console.replServer = {
        context: {},
        history: Array.from({ length: 1500 }, (_, i) => `cmd${i}`)
      } as any;
      
      console.saveHistory(historyFile);
      
      const saved = fs.readFileSync(historyFile, 'utf8');
      const lines = saved.trim().split('\n');
      expect(lines.length).toBeLessThanOrEqual(1000);
    });

    it('should handle write errors gracefully', () => {
      console = new ExpressConsole({ 
        rootPath: tempDir,
        historyFile: null as any
      });
      
      console.replServer = {
        context: {},
        history: ['cmd1']
      } as any;
      
      // Should not throw
      expect(() => console.saveHistory('/non-existent/path')).not.toThrow();
    });
  });

  describe('defineCommands', () => {
    it('should define all REPL commands', () => {
      console = new ExpressConsole({ rootPath: tempDir });
      
      const defineCommand = jest.fn();
      console.replServer = {
        context: {},
        defineCommand,
        on: jest.fn()
      } as any;
      
      console.defineCommands();
      
      expect(defineCommand).toHaveBeenCalledWith('reload', expect.any(Object));
      expect(defineCommand).toHaveBeenCalledWith('routes', expect.any(Object));
      expect(defineCommand).toHaveBeenCalledWith('models', expect.any(Object));
      expect(defineCommand).toHaveBeenCalledWith('services', expect.any(Object));
      expect(defineCommand).toHaveBeenCalledWith('config', expect.any(Object));
      expect(defineCommand).toHaveBeenCalledWith('env', expect.any(Object));
      expect(defineCommand).toHaveBeenCalledWith('clear', expect.any(Object));
      expect(defineCommand).toHaveBeenCalledWith('help', expect.any(Object));
    });
  });

  describe('start', () => {
    it('should start the console', async () => {
      // Create minimal app structure
      fs.mkdirSync(path.join(tempDir, 'models'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, 'models', 'Test.js'),
        'module.exports = class Test {};'
      );
      
      console = new ExpressConsole({ 
        rootPath: tempDir,
        forceExpress: true
      });
      
      const replServer = await console.start();
      
      expect(replServer).toBeDefined();
      expect(console.replServer).toBe(replServer);
    });

    it('should add introspection methods to context', async () => {
      fs.mkdirSync(path.join(tempDir, 'models'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, 'models', 'Test.js'),
        'module.exports = class Test {};'
      );
      
      console = new ExpressConsole({ 
        rootPath: tempDir,
        forceExpress: true
      });
      
      await console.start();
      
      expect(console.replServer!.context.info).toBeDefined();
      expect(console.replServer!.context.methods).toBeDefined();
      expect(console.replServer!.context.props).toBeDefined();
      expect(console.replServer!.context.type).toBeDefined();
    });

    it('should handle load errors gracefully', async () => {
      console = new ExpressConsole({ 
        rootPath: tempDir,
        forceExpress: true
      });
      
      const consoleError = jest.spyOn(console_util, 'error').mockImplementation();
      
      const replServer = await console.start();
      
      expect(replServer).toBeDefined();
      
      consoleError.mockRestore();
    });
  });
});

// Helper to avoid naming conflict with console object
const console_util = console;
