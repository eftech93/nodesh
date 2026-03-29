/**
 * Unit tests for TypeScript types
 */

import {
  ExpressConsoleOptions,
  AppLoaderOptions,
  LoadedContext,
  ConfigResult,
  RouteInfo,
  ConsoleCommand,
  PropertyInfo,
  ObjectMetadata,
  CompleterResult
} from '../src/types';

describe('Type Exports', () => {
  it('should export ExpressConsoleOptions interface', () => {
    const options: ExpressConsoleOptions = {
      rootPath: '/test',
      appEntry: 'app.js',
      modelsDir: 'models',
      servicesDir: 'services',
      helpersDir: 'helpers',
      configDir: 'config',
      prompt: 'test> ',
      useColors: true,
      useGlobal: true,
      historyFile: null,
      preload: [],
      context: {},
      forceExpress: false
    };

    expect(options.rootPath).toBe('/test');
    expect(options.prompt).toBe('test> ');
  });

  it('should export AppLoaderOptions interface', () => {
    const options: AppLoaderOptions = {
      rootPath: '/test',
      config: { modelsDir: 'src/models' }
    };

    expect(options.rootPath).toBe('/test');
    expect(options.config?.modelsDir).toBe('src/models');
  });

  it('should export LoadedContext interface', () => {
    const context: LoadedContext = {
      env: process.env,
      NODE_ENV: 'test',
      config: { db: { host: 'localhost' } },
      app: undefined,
      expressApp: undefined,
      nestApp: undefined,
      routes: []
    };

    expect(context.NODE_ENV).toBe('test');
    expect(Array.isArray(context.routes)).toBe(true);
  });

  it('should export ConfigResult interface', () => {
    const config: ConfigResult = {
      rootPath: '/test',
      appEntry: 'src/app.js',
      modelsDir: 'src/models',
      servicesDir: 'src/services',
      helpersDir: 'helpers',
      configDir: 'config',
      prompt: 'test> ',
      useColors: true,
      historyFile: null,
      preload: [],
      context: {},
      forceExpress: false
    };

    expect(config.appEntry).toBe('src/app.js');
  });

  it('should export RouteInfo interface', () => {
    const route: RouteInfo = {
      path: '/api/users',
      methods: ['GET', 'POST']
    };

    expect(route.path).toBe('/api/users');
    expect(route.methods).toContain('GET');
  });

  it('should export ConsoleCommand interface', () => {
    const command: ConsoleCommand = {
      help: 'Test command',
      action: function() { return; }
    };

    expect(command.help).toBe('Test command');
    expect(typeof command.action).toBe('function');
  });

  it('should export PropertyInfo interface', () => {
    const prop: PropertyInfo = {
      name: 'testProp',
      type: 'string',
      value: 'test',
      isMethod: false,
      isStatic: false,
      isInherited: false,
      description: 'A test property'
    };

    expect(prop.name).toBe('testProp');
    expect(prop.isMethod).toBe(false);
  });

  it('should export ObjectMetadata interface', () => {
    const metadata: ObjectMetadata = {
      name: 'TestClass',
      type: 'TestClass',
      constructor: 'TestClass',
      properties: [],
      staticProperties: [],
      prototypeChain: ['BaseClass']
    };

    expect(metadata.name).toBe('TestClass');
    expect(metadata.prototypeChain).toContain('BaseClass');
  });

  it('should export CompleterResult type', () => {
    const result: CompleterResult = [['option1', 'option2'], 'option'];

    expect(Array.isArray(result)).toBe(true);
    expect(Array.isArray(result[0])).toBe(true);
    expect(result[0]).toContain('option1');
    expect(typeof result[1]).toBe('string');
  });

  it('should allow partial ExpressConsoleOptions', () => {
    // Test that partial options are valid
    const partialOptions: ExpressConsoleOptions = {
      rootPath: '/test',
      prompt: 'custom> '
    };

    expect(partialOptions.rootPath).toBe('/test');
    expect(partialOptions.prompt).toBe('custom> ');
  });

  it('should allow empty LoadedContext', () => {
    const emptyContext: LoadedContext = {};
    expect(Object.keys(emptyContext)).toHaveLength(0);
  });

  it('should allow extended context properties', () => {
    const extendedContext: LoadedContext = {
      env: process.env,
      NODE_ENV: 'development',
      customService: { find: () => [] },
      customModel: class CustomModel {}
    };

    expect(extendedContext.customService).toBeDefined();
    expect(typeof extendedContext.customModel).toBe('function');
  });
});
