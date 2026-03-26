"use strict";
/**
 * Unit tests for the Intelligent Autocomplete module
 */
Object.defineProperty(exports, "__esModule", { value: true });
const autocomplete_1 = require("../src/autocomplete");
// Test classes for mocking services and models
class UserService {
    constructor() {
        this.name = 'UserService';
    }
    async create(data) { return { id: 1, ...data }; }
    async findById(id) { return { id }; }
    async findByEmail(email) { return { email }; }
    async findActive(options = {}) { return []; }
    async update(id, updates) { return { id, ...updates }; }
    async delete(id) { return { id, deleted: true }; }
    async authenticate(email, password) { return null; }
    async getStats() { return {}; }
    async clearCache(userId) { }
    static getServiceName() { return 'UserService'; }
    static getVersion() { return '1.0.0'; }
}
class OrderService {
    constructor() {
        this.name = 'OrderService';
    }
    async create(userId, items) { return { id: 1, userId, items }; }
    async findById(id) { return { id }; }
    async findByUserId(userId) { return []; }
    async updateStatus(id, status) { return { id, status }; }
    async cancel(id) { return { id, cancelled: true }; }
}
// Mock Mongoose-like model
const MockUserModel = {
    find: async () => [],
    findOne: async () => null,
    findById: async () => null,
    create: async (data) => data,
    updateOne: async () => ({ modifiedCount: 1 }),
    deleteOne: async () => ({ deletedCount: 1 }),
    countDocuments: async () => 0,
    exists: async () => false,
    aggregate: async () => [],
    prototype: {
        save: async function () { return this; },
        remove: async function () { return this; },
        validate: async function () { return true; }
    }
};
describe('IntelligentCompleter', () => {
    let completer;
    let context;
    beforeEach(() => {
        context = {
            userService: new UserService(),
            orderService: new OrderService(),
            User: MockUserModel,
            config: {
                env: 'development',
                port: 3000,
                database: { url: 'mongodb://localhost/test', host: 'localhost', port: 27017 }
            },
            db: {
                connect: async () => { },
                disconnect: async () => { },
                isConnected: () => true
            }
        };
        completer = new autocomplete_1.IntelligentCompleter(context);
    });
    describe('complete()', () => {
        it('should return all top-level keys for empty input', () => {
            const [completions] = completer.complete('');
            expect(completions).toContain('userService');
            expect(completions).toContain('orderService');
            expect(completions).toContain('User');
            expect(completions).toContain('config');
            expect(completions).toContain('db');
        });
        it('should filter completions by prefix', () => {
            const [completions] = completer.complete('user');
            expect(completions).toContain('userService');
            expect(completions).not.toContain('orderService');
        });
        it('should complete instance properties on service objects', () => {
            const [completions] = completer.complete('userService.');
            expect(completions).toContain('create');
            expect(completions).toContain('findById');
            expect(completions).toContain('findByEmail');
            expect(completions).toContain('findActive');
            expect(completions).toContain('update');
            expect(completions).toContain('delete');
            expect(completions).toContain('authenticate');
            expect(completions).toContain('getStats');
            expect(completions).toContain('clearCache');
            expect(completions).toContain('name');
        });
        it('should filter methods by partial match', () => {
            const [completions] = completer.complete('userService.find');
            expect(completions).toContain('findById');
            expect(completions).toContain('findByEmail');
            expect(completions).toContain('findActive');
            expect(completions).not.toContain('create');
        });
        it('should complete properties on config object', () => {
            const [completions] = completer.complete('config.');
            expect(completions).toContain('env');
            expect(completions).toContain('port');
            expect(completions).toContain('database');
        });
        it('should complete nested properties', () => {
            const [completions] = completer.complete('config.database.');
            expect(completions).toContain('url');
            expect(completions).toContain('host');
            expect(completions).toContain('port');
        });
        it('should complete static methods on model objects', () => {
            const [completions] = completer.complete('User.');
            expect(completions).toContain('find');
            expect(completions).toContain('findOne');
            expect(completions).toContain('findById');
            expect(completions).toContain('create');
            expect(completions).toContain('updateOne');
            expect(completions).toContain('deleteOne');
            expect(completions).toContain('countDocuments');
            expect(completions).toContain('exists');
            expect(completions).toContain('aggregate');
        });
        it('should return empty array for non-existent object', () => {
            const [completions] = completer.complete('nonExistent.');
            expect(completions).toEqual([]);
        });
        it('should return empty array for null/undefined values', () => {
            context.nullValue = null;
            context.undefinedValue = undefined;
            completer.updateContext(context);
            const [nullCompletions] = completer.complete('nullValue.');
            const [undefinedCompletions] = completer.complete('undefinedValue.');
            expect(nullCompletions).toEqual([]);
            expect(undefinedCompletions).toEqual([]);
        });
    });
    describe('introspect()', () => {
        it('should return metadata for a service', () => {
            const metadata = completer.introspect('userService');
            expect(metadata).not.toBeNull();
            expect(metadata?.name).toBe('userService');
            expect(metadata?.type).toBe('UserService');
            expect(metadata?.constructor).toBe('UserService');
        });
        it('should return metadata for a model', () => {
            const metadata = completer.introspect('User');
            expect(metadata).not.toBeNull();
            expect(metadata?.name).toBe('User');
            expect(metadata?.type).toBe('Object');
        });
        it('should return null for non-existent key', () => {
            const metadata = completer.introspect('nonExistent');
            expect(metadata).toBeNull();
        });
        it('should list all properties including methods', () => {
            const metadata = completer.introspect('userService');
            const methodNames = metadata?.properties
                .filter(p => p.isMethod)
                .map(p => p.name);
            expect(methodNames).toContain('create');
            expect(methodNames).toContain('findById');
            expect(methodNames).toContain('update');
        });
        it('should identify static methods', () => {
            const metadata = completer.getObjectMetadata(UserService, 'UserService');
            const staticMethods = metadata?.properties
                .filter(p => p.isStatic && p.isMethod)
                .map(p => p.name);
            expect(staticMethods).toContain('getServiceName');
            expect(staticMethods).toContain('getVersion');
        });
    });
    describe('getTypeName()', () => {
        it('should return correct type for null', () => {
            expect(completer.getTypeName(null)).toBe('null');
        });
        it('should return correct type for undefined', () => {
            expect(completer.getTypeName(undefined)).toBe('undefined');
        });
        it('should return correct type for primitives', () => {
            expect(completer.getTypeName('string')).toBe('string');
            expect(completer.getTypeName(123)).toBe('number');
            expect(completer.getTypeName(true)).toBe('boolean');
        });
        it('should return class name for objects', () => {
            expect(completer.getTypeName(new UserService())).toBe('UserService');
        });
        it('should return correct type for arrays', () => {
            expect(completer.getTypeName([])).toBe('Array');
            expect(completer.getTypeName([1, 2, 3])).toBe('Array');
        });
        it('should return correct type for dates', () => {
            expect(completer.getTypeName(new Date())).toBe('Date');
        });
        it('should return correct type for regex', () => {
            expect(completer.getTypeName(/test/)).toBe('RegExp');
        });
        it('should return correct type for functions', () => {
            const namedFn = function testFn() { };
            expect(completer.getTypeName(namedFn)).toBe('testFn()');
            expect(completer.getTypeName(() => { })).toBe('Function');
        });
    });
    describe('getObjectMetadata()', () => {
        it('should cache metadata for performance', () => {
            const obj = { test: 'value' };
            const meta1 = completer.getObjectMetadata(obj, 'test');
            const meta2 = completer.getObjectMetadata(obj, 'test');
            expect(meta1).toBe(meta2);
        });
        it('should include prototype chain information', () => {
            class Parent {
                parentMethod() { }
            }
            class Child extends Parent {
                childMethod() { }
            }
            const metadata = completer.getObjectMetadata(new Child(), 'child');
            expect(metadata?.prototypeChain).toContain('Child');
            expect(metadata?.prototypeChain).toContain('Parent');
        });
    });
    describe('updateContext()', () => {
        it('should clear cache when context is updated', () => {
            const obj = { test: 'value' };
            completer.getObjectMetadata(obj, 'test');
            const newContext = { ...context, newKey: 'value' };
            completer.updateContext(newContext);
            expect(completer['cache'].size).toBe(0);
        });
        it('should use new context for completions', () => {
            const newContext = { ...context, newService: { method: () => { } } };
            completer.updateContext(newContext);
            const [completions] = completer.complete('newService.');
            expect(completions).toContain('method');
        });
    });
    describe('bracket notation completion', () => {
        it('should complete bracket notation with string keys', () => {
            const [completions] = completer.complete("config['");
            expect(completions).toContain("'env'");
            expect(completions).toContain("'port'");
            expect(completions).toContain("'database'");
        });
    });
    describe('getCompletions()', () => {
        it('should return all completions for empty prefix', () => {
            const completions = completer.getCompletions('');
            expect(completions).toContain('userService');
            expect(completions).toContain('orderService');
        });
        it('should filter completions by prefix', () => {
            const completions = completer.getCompletions('user');
            expect(completions).toContain('userService');
            expect(completions).not.toContain('orderService');
        });
    });
});
describe('createCompleter', () => {
    it('should return a completer function', () => {
        const context = { test: 'value' };
        const completerFn = (0, autocomplete_1.createCompleter)(context);
        expect(typeof completerFn).toBe('function');
    });
    it('should complete using the returned function', () => {
        const context = { myService: { method: () => { } } };
        const completerFn = (0, autocomplete_1.createCompleter)(context);
        const [completions] = completerFn('myService.');
        expect(completions).toContain('method');
    });
});
describe('addIntrospectionMethods', () => {
    let context;
    beforeEach(() => {
        context = {
            userService: new UserService(),
            config: { env: 'test', port: 3000 }
        };
        (0, autocomplete_1.addIntrospectionMethods)(context);
    });
    it('should add info() method', () => {
        expect(typeof context.info).toBe('function');
    });
    it('should add methods() method', () => {
        expect(typeof context.methods).toBe('function');
    });
    it('should add props() method', () => {
        expect(typeof context.props).toBe('function');
    });
    it('should add type() method', () => {
        expect(typeof context.type).toBe('function');
    });
    it('info() should return metadata for string key', () => {
        const metadata = context.info('userService');
        expect(metadata).not.toBeNull();
        expect(metadata?.name).toBe('userService');
    });
    it('info() should return metadata for object', () => {
        const metadata = context.info(context.userService);
        expect(metadata).not.toBeNull();
        expect(metadata?.type).toBe('UserService');
    });
    it('methods() should list all methods', () => {
        const methods = context.methods('userService');
        expect(methods).toContain('create');
        expect(methods).toContain('findById');
        expect(methods).toContain('update');
    });
    it('props() should list all non-method properties', () => {
        const props = context.props('config');
        expect(props).toContain('env');
        expect(props).toContain('port');
    });
    it('type() should return type for string key', () => {
        const type = context.type('userService');
        expect(type).toBe('UserService');
    });
    it('type() should return type for value', () => {
        const type = context.type(123);
        expect(type).toBe('number');
    });
});
//# sourceMappingURL=autocomplete.test.js.map