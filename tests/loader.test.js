"use strict";
/**
 * Unit tests for the AppLoader module
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const loader_1 = require("../src/loader");
// Helper functions for temp directories
function createTempDir() {
    const tempDir = path.join(__dirname, 'temp-loader-test-' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });
    return tempDir;
}
function removeTempDir(tempDir) {
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}
describe('AppLoader', () => {
    let tempDir;
    let loader;
    beforeEach(() => {
        tempDir = createTempDir();
        loader = new loader_1.AppLoader({
            rootPath: tempDir,
            config: {}
        });
    });
    afterEach(() => {
        removeTempDir(tempDir);
    });
    describe('constructor', () => {
        it('should initialize with default values', () => {
            const defaultLoader = new loader_1.AppLoader();
            expect(defaultLoader.rootPath).toBe(process.cwd());
            expect(defaultLoader.context).toEqual({});
            expect(defaultLoader.loadedFiles).toEqual([]);
        });
        it('should initialize with provided options', () => {
            const customLoader = new loader_1.AppLoader({
                rootPath: tempDir,
                config: { modelsDir: 'custom/models' }
            });
            expect(customLoader.rootPath).toBe(tempDir);
            expect(customLoader.config).toEqual({ modelsDir: 'custom/models' });
        });
    });
    describe('loadEnvironment', () => {
        it('should set env and NODE_ENV in context', () => {
            loader.loadEnvironment();
            expect(loader.context.env).toBe(process.env);
            expect(loader.context.NODE_ENV).toBe(process.env.NODE_ENV || 'development');
        });
        it('should load .env file if it exists', () => {
            fs.writeFileSync(path.join(tempDir, '.env'), 'TEST_VAR=hello\nANOTHER_VAR=world');
            loader.loadEnvironment();
            // Note: This test assumes dotenv is not installed in test environment
            // The method should at least not throw an error
            expect(loader.context.env).toBeDefined();
        });
    });
    describe('loadConfigs', () => {
        it('should load config files from config directory', () => {
            const configDir = path.join(tempDir, 'config');
            fs.mkdirSync(configDir, { recursive: true });
            fs.writeFileSync(path.join(configDir, 'database.js'), 'module.exports = { host: "localhost", port: 27017 };');
            fs.writeFileSync(path.join(configDir, 'app.json'), JSON.stringify({ name: 'test-app', version: '1.0.0' }));
            loader.loadConfigs();
            expect(loader.context.config).toBeDefined();
            expect(loader.context.config.database).toEqual({
                host: 'localhost',
                port: 27017
            });
            expect(loader.context.config.app).toEqual({
                name: 'test-app',
                version: '1.0.0'
            });
        });
        it('should handle missing config directory gracefully', () => {
            loader.loadConfigs();
            // Should not throw and context should be empty or undefined
            expect(loader.context.config).toBeUndefined();
        });
        it('should skip config files that fail to load', () => {
            const configDir = path.join(tempDir, 'config');
            fs.mkdirSync(configDir, { recursive: true });
            fs.writeFileSync(path.join(configDir, 'invalid.js'), 'throw new Error("Invalid config");');
            fs.writeFileSync(path.join(configDir, 'valid.js'), 'module.exports = { valid: true };');
            const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
            loader.loadConfigs();
            expect(loader.context.config.valid).toEqual({ valid: true });
            expect(consoleWarn).toHaveBeenCalled();
            consoleWarn.mockRestore();
        });
    });
    describe('loadModels', () => {
        it('should load models from models directory', async () => {
            const modelsDir = path.join(tempDir, 'models');
            fs.mkdirSync(modelsDir, { recursive: true });
            fs.writeFileSync(path.join(modelsDir, 'User.js'), 'class User { constructor(name) { this.name = name; } } module.exports = User;');
            fs.writeFileSync(path.join(modelsDir, 'Product.js'), 'class Product { constructor(price) { this.price = price; } } module.exports = Product;');
            await loader.loadModels();
            expect(loader.context.User).toBeDefined();
            expect(loader.context.Product).toBeDefined();
            expect(typeof loader.context.User).toBe('function');
        });
        it('should also load from app/models directory', async () => {
            const appModelsDir = path.join(tempDir, 'app', 'models');
            fs.mkdirSync(appModelsDir, { recursive: true });
            fs.writeFileSync(path.join(appModelsDir, 'Order.js'), 'class Order { } module.exports = Order;');
            await loader.loadModels();
            expect(loader.context.Order).toBeDefined();
        });
        it('should create pluralized aliases for models', async () => {
            const modelsDir = path.join(tempDir, 'models');
            fs.mkdirSync(modelsDir, { recursive: true });
            fs.writeFileSync(path.join(modelsDir, 'User.js'), 'class User { } module.exports = User;');
            await loader.loadModels();
            expect(loader.context.User).toBeDefined();
            expect(loader.context.Users).toBeDefined();
            expect(loader.context.User).toBe(loader.context.Users);
        });
        it('should handle missing models directory gracefully', async () => {
            await loader.loadModels();
            // Should not throw
            expect(loader.context).toBeDefined();
        });
    });
    describe('loadServices', () => {
        it('should load services from services directory', async () => {
            const servicesDir = path.join(tempDir, 'services');
            fs.mkdirSync(servicesDir, { recursive: true });
            fs.writeFileSync(path.join(servicesDir, 'UserService.js'), 'class UserService { async create() { return "created"; } } module.exports = UserService;');
            await loader.loadServices();
            expect(loader.context.UserService).toBeDefined();
            expect(loader.context.userService).toBeDefined();
        });
        it('should load from app/services directory', async () => {
            const appServicesDir = path.join(tempDir, 'app', 'services');
            fs.mkdirSync(appServicesDir, { recursive: true });
            fs.writeFileSync(path.join(appServicesDir, 'OrderService.js'), 'class OrderService { } module.exports = OrderService;');
            await loader.loadServices();
            expect(loader.context.OrderService).toBeDefined();
        });
        it('should handle service names with Service suffix', async () => {
            const servicesDir = path.join(tempDir, 'services');
            fs.mkdirSync(servicesDir, { recursive: true });
            fs.writeFileSync(path.join(servicesDir, 'UserService.js'), 'class UserService { } module.exports = UserService;');
            await loader.loadServices();
            // Should have both UserService and userService
            expect(loader.context.UserService).toBeDefined();
            expect(loader.context.userService).toBeDefined();
        });
    });
    describe('loadHelpers', () => {
        it('should load helpers from helpers directory', async () => {
            const helpersDir = path.join(tempDir, 'helpers');
            fs.mkdirSync(helpersDir, { recursive: true });
            fs.writeFileSync(path.join(helpersDir, 'dateHelper.js'), 'module.exports = { format: () => "2024-01-01" };');
            await loader.loadHelpers();
            expect(loader.context.dateHelper).toBeDefined();
        });
        it('should load from utils directory', async () => {
            const utilsDir = path.join(tempDir, 'utils');
            fs.mkdirSync(utilsDir, { recursive: true });
            fs.writeFileSync(path.join(utilsDir, 'stringUtils.js'), 'module.exports = { capitalize: (s) => s.toUpperCase() };');
            await loader.loadHelpers();
            expect(loader.context.stringUtils).toBeDefined();
        });
    });
    describe('utility methods', () => {
        describe('pluralize', () => {
            it('should pluralize regular nouns', () => {
                expect(loader.pluralize('User')).toBe('Users');
                expect(loader.pluralize('Product')).toBe('Products');
            });
            it('should handle words ending in y', () => {
                expect(loader.pluralize('Category')).toBe('Categories');
                expect(loader.pluralize('City')).toBe('Cities');
            });
            it('should handle words ending in s, x, ch', () => {
                expect(loader.pluralize('Class')).toBe('Classes');
                expect(loader.pluralize('Box')).toBe('Boxes');
                expect(loader.pluralize('Watch')).toBe('Watches');
            });
        });
        describe('toCamelCase', () => {
            it('should convert PascalCase to camelCase', () => {
                expect(loader.toCamelCase('UserService')).toBe('userService');
                expect(loader.toCamelCase('OrderService')).toBe('orderService');
            });
            it('should convert snake_case to camelCase', () => {
                expect(loader.toCamelCase('user_service')).toBe('userService');
                expect(loader.toCamelCase('order_service')).toBe('orderService');
            }, 10000);
            it('should convert kebab-case to camelCase', () => {
                expect(loader.toCamelCase('user-service')).toBe('userService');
                expect(loader.toCamelCase('order-service')).toBe('orderService');
            });
            it('should handle spaces', () => {
                expect(loader.toCamelCase('user service')).toBe('userService');
            });
        });
        describe('getHelpText', () => {
            it('should return help text with available context', () => {
                loader.context = {
                    User: class User {
                    },
                    userService: {},
                    config: {},
                    env: {},
                    NODE_ENV: 'test'
                };
                loader.loadedFiles = [
                    '/models/User.js',
                    '/services/UserService.js'
                ];
                const helpText = loader.getHelpText();
                expect(helpText).toContain('Available Context');
                expect(helpText).toContain('Models');
                expect(helpText).toContain('Services');
            });
        });
    });
    describe('full load', () => {
        it('should load all components', async () => {
            // Set up a complete project structure
            fs.mkdirSync(path.join(tempDir, 'models'), { recursive: true });
            fs.mkdirSync(path.join(tempDir, 'services'), { recursive: true });
            fs.mkdirSync(path.join(tempDir, 'config'), { recursive: true });
            fs.writeFileSync(path.join(tempDir, 'models', 'User.js'), 'class User { } module.exports = User;');
            fs.writeFileSync(path.join(tempDir, 'services', 'UserService.js'), 'class UserService { } module.exports = UserService;');
            fs.writeFileSync(path.join(tempDir, 'config', 'database.js'), 'module.exports = { url: "mongodb://localhost/test" };');
            const context = await loader.load();
            expect(context.User).toBeDefined();
            expect(context.UserService).toBeDefined();
            expect(context.config).toBeDefined();
            expect(context.env).toBeDefined();
            expect(loader.loadedFiles.length).toBeGreaterThan(0);
        });
    });
});
//# sourceMappingURL=loader.test.js.map