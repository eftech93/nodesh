/**
 * Unit tests for main module exports
 */

import {
  ExpressConsole,
  AppLoader,
  NestJSLoader,
  NextJSLoader,
  loadConfig,
  generateConfig,
  CONFIG_FILES,
  IntelligentCompleter,
  createCompleter,
  addIntrospectionMethods
} from '../src/index';

describe('Module Exports', () => {
  describe('Classes', () => {
    it('should export ExpressConsole class', () => {
      expect(ExpressConsole).toBeDefined();
      expect(typeof ExpressConsole).toBe('function');
      
      const instance = new ExpressConsole({ rootPath: process.cwd() });
      expect(instance).toBeInstanceOf(ExpressConsole);
      expect(instance.options).toBeDefined();
    });

    it('should export AppLoader class', () => {
      expect(AppLoader).toBeDefined();
      expect(typeof AppLoader).toBe('function');
      
      const instance = new AppLoader({ rootPath: process.cwd() });
      expect(instance).toBeInstanceOf(AppLoader);
      expect(instance.context).toBeDefined();
      expect(instance.loadedFiles).toEqual([]);
    });

    it('should export NestJSLoader class', () => {
      expect(NestJSLoader).toBeDefined();
      expect(typeof NestJSLoader).toBe('function');
      
      const instance = new NestJSLoader({ rootPath: process.cwd() });
      expect(instance).toBeInstanceOf(NestJSLoader);
      expect(typeof NestJSLoader.isNestJSProject).toBe('function');
    });

    it('should export NextJSLoader class', () => {
      expect(NextJSLoader).toBeDefined();
      expect(typeof NextJSLoader).toBe('function');
      
      const instance = new NextJSLoader({ rootPath: process.cwd() });
      expect(instance).toBeInstanceOf(NextJSLoader);
      expect(typeof NextJSLoader.isNextJSProject).toBe('function');
    });
  });

  describe('Config Functions', () => {
    it('should export loadConfig function', () => {
      expect(loadConfig).toBeDefined();
      expect(typeof loadConfig).toBe('function');
      
      const config = loadConfig(process.cwd());
      expect(config).toBeDefined();
      expect(config.rootPath).toBe(process.cwd());
    });

    it('should export generateConfig function', () => {
      expect(generateConfig).toBeDefined();
      expect(typeof generateConfig).toBe('function');
    });

    it('should export CONFIG_FILES array', () => {
      expect(CONFIG_FILES).toBeDefined();
      expect(Array.isArray(CONFIG_FILES)).toBe(true);
      expect(CONFIG_FILES.length).toBeGreaterThan(0);
    });
  });

  describe('Autocomplete Functions', () => {
    it('should export IntelligentCompleter class', () => {
      expect(IntelligentCompleter).toBeDefined();
      expect(typeof IntelligentCompleter).toBe('function');
    });

    it('should export createCompleter function', () => {
      expect(createCompleter).toBeDefined();
      expect(typeof createCompleter).toBe('function');
    });

    it('should export addIntrospectionMethods function', () => {
      expect(addIntrospectionMethods).toBeDefined();
      expect(typeof addIntrospectionMethods).toBe('function');
    });
  });
});

describe('Integration: Exported components work together', () => {
  it('should be able to create a console with all loaders', () => {
    const console = new ExpressConsole({
      rootPath: process.cwd(),
      prompt: 'test> '
    });

    expect(console).toBeDefined();
    expect(console.loader).toBeDefined();
  });

  it('should be able to use config with console', () => {
    const config = loadConfig(process.cwd());
    const console = new ExpressConsole({
      rootPath: config.rootPath,
      appEntry: config.appEntry || undefined,
      prompt: config.prompt
    });

    expect(console.options.prompt).toBe(config.prompt);
  });

  it('should be able to check project types with loaders', () => {
    const isNestJS = NestJSLoader.isNestJSProject(process.cwd());
    const isNextJS = NextJSLoader.isNextJSProject(process.cwd());

    expect(typeof isNestJS).toBe('boolean');
    expect(typeof isNextJS).toBe('boolean');
  });
});
