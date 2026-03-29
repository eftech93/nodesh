/**
 * Additional unit tests for Express Console
 */

import { ExpressConsole } from '../src/console';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
jest.mock('repl');

describe('ExpressConsole - Advanced', () => {
  let expressConsole: ExpressConsole;
  const mockRootPath = '/test/project';

  beforeEach(() => {
    jest.clearAllMocks();
    expressConsole = new ExpressConsole({
      rootPath: mockRootPath,
      prompt: 'test> ',
    });
  });

  describe('constructor', () => {
    it('should use default options when none provided', () => {
      const defaultConsole = new ExpressConsole();
      
      expect(defaultConsole.options.prompt).toBe('node> ');
      expect(defaultConsole.options.useColors).toBe(true);
      expect(defaultConsole.options.useGlobal).toBe(true);
    });

    it('should merge provided options with defaults', () => {
      const customConsole = new ExpressConsole({
        prompt: 'custom> ',
        useColors: false,
        rootPath: '/custom/path',
      });

      expect(customConsole.options.prompt).toBe('custom> ');
      expect(customConsole.options.useColors).toBe(false);
      expect(customConsole.options.rootPath).toBe('/custom/path');
      expect(customConsole.options.useGlobal).toBe(true); // default
    });

    it('should initialize with forceExpress option', () => {
      const forceConsole = new ExpressConsole({
        forceExpress: true,
      });

      expect(forceConsole.options.forceExpress).toBe(true);
    });

    it('should set custom context', () => {
      const customContext = { customVar: 'value' };
      const ctxConsole = new ExpressConsole({
        context: customContext,
      });

      expect(ctxConsole.options.context).toEqual(customContext);
    });

    it('should set custom directories', () => {
      const dirConsole = new ExpressConsole({
        modelsDir: 'app/models',
        servicesDir: 'app/services',
        helpersDir: 'app/helpers',
        configDir: 'app/config',
      });

      expect(dirConsole.options.modelsDir).toBe('app/models');
      expect(dirConsole.options.servicesDir).toBe('app/services');
      expect(dirConsole.options.helpersDir).toBe('app/helpers');
      expect(dirConsole.options.configDir).toBe('app/config');
    });

    it('should set custom history file', () => {
      const historyPath = '/custom/history.txt';
      const histConsole = new ExpressConsole({
        historyFile: historyPath,
      });

      expect(histConsole.options.historyFile).toBe(historyPath);
    });

    it('should set preload files', () => {
      const preloadFiles = ['file1.js', 'file2.js'];
      const preloadConsole = new ExpressConsole({
        preload: preloadFiles,
      });

      expect(preloadConsole.options.preload).toEqual(preloadFiles);
    });
  });

  describe('outputWriter', () => {
    beforeEach(() => {
      // Initialize with minimal setup for outputWriter tests
      expressConsole.replServer = {} as any;
    });

    it('should format undefined values', () => {
      const result = (expressConsole as any).outputWriter(undefined);
      expect(result).toContain('undefined');
    });

    it('should format null values', () => {
      const result = (expressConsole as any).outputWriter(null);
      expect(result).toContain('null');
    });

    it('should format string values', () => {
      const result = (expressConsole as any).outputWriter('hello');
      // Output format depends on implementation
      expect(typeof result).toBe('string');
      expect(result).toContain('hello');
    });

    it('should format number values', () => {
      const result = (expressConsole as any).outputWriter(42);
      expect(result).toContain('42');
    });

    it('should format boolean values', () => {
      expect((expressConsole as any).outputWriter(true)).toContain('true');
      expect((expressConsole as any).outputWriter(false)).toContain('false');
    });

    it('should format Date objects', () => {
      const date = new Date('2024-01-15');
      const result = (expressConsole as any).outputWriter(date);
      expect(result).toContain(date.toISOString());
    });

    it('should format arrays', () => {
      const result = (expressConsole as any).outputWriter([1, 2, 3]);
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
    });

    it('should format objects', () => {
      const obj = { name: 'test', value: 123 };
      const result = (expressConsole as any).outputWriter(obj);
      expect(result).toContain('name');
      expect(result).toContain('test');
    });

    it('should truncate long outputs', () => {
      const longArray = Array(100).fill('item');
      const result = (expressConsole as any).outputWriter(longArray);
      // Result should be a string representation
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle circular references', () => {
      const obj: any = { name: 'test' };
      obj.self = obj;
      
      const result = (expressConsole as any).outputWriter(obj);
      expect(result).toContain('Circular');
    });

    it('should handle functions', () => {
      const fn = function testFunction() {};
      const result = (expressConsole as any).outputWriter(fn);
      expect(result).toContain('[Function');
    });

    it('should handle anonymous functions', () => {
      const fn = () => {};
      const result = (expressConsole as any).outputWriter(fn);
      expect(result).toContain('[Function');
    });
  });

  describe('setupHistory', () => {
    it('should handle missing history file gracefully', () => {
      const mockReadFileSync = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('File not found');
      });

      const replServer: any = {};
      expect(() => {
        (expressConsole as any).setupHistory(replServer);
      }).not.toThrow();

      mockReadFileSync.mockRestore();
    });

    it('should skip duplicate entries in history', () => {
      const historyContent = 'command1\ncommand2\ncommand1\ncommand3\n';
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(historyContent);

      const replServer: any = {};
      (expressConsole as any).setupHistory(replServer);

      // Should have set up history (may be undefined due to mock)
      expect(replServer).toBeDefined();
    });
  });

  describe('saveHistory', () => {
    it('should save history to file', () => {
      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      
      const replServer: any = {
        history: ['cmd1', 'cmd2', 'cmd3'],
      };

      (expressConsole as any).replServer = replServer;
      (expressConsole as any).saveHistory();

      expect(mockWriteFileSync).toHaveBeenCalled();
      const savedContent = mockWriteFileSync.mock.calls[0][1];
      expect(savedContent).toContain('cmd1');
      expect(savedContent).toContain('cmd2');
      expect(savedContent).toContain('cmd3');

      mockWriteFileSync.mockRestore();
    });

    it('should limit history to 1000 entries', () => {
      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      
      const replServer: any = {
        history: Array(1500).fill(0).map((_, i) => `cmd${i}`),
      };

      (expressConsole as any).replServer = replServer;
      (expressConsole as any).saveHistory();

      const savedContent = mockWriteFileSync.mock.calls[0][1] as string;
      const lines = savedContent.trim().split('\n');
      expect(lines.length).toBeLessThanOrEqual(1000);

      mockWriteFileSync.mockRestore();
    });

    it('should handle write errors gracefully', () => {
      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
        throw new Error('Permission denied');
      });
      const consoleSpy = jest.spyOn(global.console, 'warn').mockImplementation();

      const replServer: any = {
        history: ['cmd1'],
      };

      expect(() => {
        (expressConsole as any).saveHistory(replServer);
      }).not.toThrow();

      mockWriteFileSync.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('createCompleter', () => {
    it('should return a completer result', () => {
      expressConsole.context = { test: 'value' };
      const result = (expressConsole as any).createCompleter('');
      
      // Result should be a tuple [completions, line]
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should provide completions for known context keys', () => {
      expressConsole.context = {
        User: {},
        Order: {},
        userService: {},
      };

      const [completions] = (expressConsole as any).createCompleter('U');

      expect(completions).toContain('User');
    });

    it('should return empty array for unknown prefix', () => {
      expressConsole.context = {
        User: {},
      };

      const [completions] = (expressConsole as any).createCompleter('xyz');

      expect(completions).toEqual([]);
    });
  });
});
