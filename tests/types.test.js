"use strict";
/**
 * Unit tests for Type definitions and interfaces
 */
Object.defineProperty(exports, "__esModule", { value: true });
describe('Type Definitions', () => {
    describe('ExpressConsoleOptions', () => {
        it('should allow creating options with all fields', () => {
            const options = {
                rootPath: '/app',
                appEntry: 'src/app.js',
                modelsDir: 'src/models',
                servicesDir: 'src/services',
                helpersDir: 'src/helpers',
                configDir: 'config',
                prompt: 'app> ',
                useColors: true,
                useGlobal: true,
                historyFile: '/tmp/history',
                preload: ['./preload.js'],
                context: { customKey: 'value' },
                forceExpress: false
            };
            expect(options.rootPath).toBe('/app');
            expect(options.prompt).toBe('app> ');
        });
        it('should allow empty options object', () => {
            const options = {};
            expect(options).toBeDefined();
        });
        it('should allow partial options', () => {
            const options = {
                rootPath: '/app',
                prompt: 'dev> '
            };
            expect(options.rootPath).toBe('/app');
            expect(options.prompt).toBe('dev> ');
        });
    });
    describe('AppLoaderOptions', () => {
        it('should allow creating loader options', () => {
            const options = {
                rootPath: '/app',
                config: {
                    modelsDir: 'models',
                    servicesDir: 'services'
                }
            };
            expect(options.rootPath).toBe('/app');
        });
    });
    describe('RouteInfo', () => {
        it('should define route information structure', () => {
            const route = {
                path: '/users',
                methods: ['GET', 'POST']
            };
            expect(route.path).toBe('/users');
            expect(route.methods).toContain('GET');
            expect(route.methods).toContain('POST');
        });
    });
    describe('LoadedContext', () => {
        it('should allow arbitrary properties', () => {
            const context = {
                customModel: {},
                customService: {},
                NODE_ENV: 'test',
                env: process.env,
                config: { test: true }
            };
            expect(context.customModel).toBeDefined();
            expect(context.NODE_ENV).toBe('test');
        });
        it('should have optional standard properties', () => {
            const minimalContext = {};
            expect(minimalContext).toBeDefined();
            const fullContext = {
                app: {},
                expressApp: {},
                nestApp: {},
                config: {},
                env: {},
                NODE_ENV: 'development',
                routes: []
            };
            expect(fullContext.app).toBeDefined();
        });
    });
    describe('ConfigResult', () => {
        it('should define complete configuration result', () => {
            const config = {
                rootPath: '/app',
                appEntry: 'src/app.js',
                modelsDir: 'models',
                servicesDir: 'services',
                helpersDir: 'helpers',
                configDir: 'config',
                prompt: 'app> ',
                useColors: true,
                historyFile: null,
                preload: [],
                context: {},
                forceExpress: false
            };
            expect(config.rootPath).toBe('/app');
            expect(config.useColors).toBe(true);
        });
    });
    describe('PropertyInfo', () => {
        it('should define property information structure', () => {
            const prop = {
                name: 'findById',
                type: 'Function',
                isMethod: true,
                isStatic: false,
                isInherited: false,
                description: 'Find by ID method'
            };
            expect(prop.name).toBe('findById');
            expect(prop.isMethod).toBe(true);
        });
        it('should allow optional value field', () => {
            const prop = {
                name: 'config',
                type: 'Object',
                value: { port: 3000 },
                isMethod: false,
                isStatic: false,
                isInherited: false
            };
            expect(prop.value).toEqual({ port: 3000 });
        });
    });
    describe('ObjectMetadata', () => {
        it('should define complete object metadata', () => {
            const metadata = {
                name: 'UserService',
                type: 'UserService',
                constructor: 'UserService',
                properties: [
                    {
                        name: 'create',
                        type: 'Function',
                        isMethod: true,
                        isStatic: false,
                        isInherited: false
                    }
                ],
                staticProperties: [
                    {
                        name: 'getName',
                        type: 'Function',
                        isMethod: true,
                        isStatic: true,
                        isInherited: false
                    }
                ],
                prototypeChain: ['UserService', 'BaseService']
            };
            expect(metadata.name).toBe('UserService');
            expect(metadata.properties).toHaveLength(1);
            expect(metadata.prototypeChain).toContain('BaseService');
        });
        it('should allow optional constructor field', () => {
            const metadata = {
                name: 'plainObject',
                type: 'Object',
                constructor: undefined,
                properties: [],
                staticProperties: [],
                prototypeChain: []
            };
            expect(metadata.constructor).toBeUndefined();
        });
    });
});
describe('Module augmentation', () => {
    it('should extend REPLServer interface', () => {
        // This test verifies that the module augmentation compiles correctly
        // The actual augmentation is in types.ts
        const mockServer = {
            history: ['cmd1', 'cmd2']
        };
        expect(mockServer.history).toHaveLength(2);
    });
});
//# sourceMappingURL=types.test.js.map