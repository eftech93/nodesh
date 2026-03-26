"use strict";
/**
 * Unit tests for the Configuration module
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
const config_1 = require("../src/config");
// Helper to create temporary test directories
function createTempDir() {
    const tempDir = path.join(__dirname, 'temp-test-' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });
    return tempDir;
}
// Helper to clean up temp directories
function removeTempDir(tempDir) {
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}
describe('CONFIG_FILES', () => {
    it('should include expected config file names', () => {
        expect(config_1.CONFIG_FILES).toContain('.node-console.js');
        expect(config_1.CONFIG_FILES).toContain('.node-console.json');
        expect(config_1.CONFIG_FILES).toContain('node-console.config.js');
    });
});
describe('loadConfig', () => {
    let tempDir;
    beforeEach(() => {
        tempDir = createTempDir();
    });
    afterEach(() => {
        removeTempDir(tempDir);
    });
    it('should return default config when no config files exist', () => {
        const config = (0, config_1.loadConfig)(tempDir);
        expect(config.rootPath).toBe(tempDir);
        expect(config.appEntry).toBeNull();
        expect(config.modelsDir).toBe('models');
        expect(config.servicesDir).toBe('services');
        expect(config.helpersDir).toBe('helpers');
        expect(config.configDir).toBe('config');
        expect(config.prompt).toBe('node> ');
        expect(config.useColors).toBe(true);
        expect(config.historyFile).toBeNull();
        expect(config.preload).toEqual([]);
        expect(config.context).toEqual({});
    });
    it('should load config from .node-console.js', () => {
        const configContent = `
      module.exports = {
        appEntry: 'src/app.js',
        modelsDir: 'src/models',
        servicesDir: 'src/services',
        prompt: 'test> ',
        useColors: false
      };
    `;
        fs.writeFileSync(path.join(tempDir, '.node-console.js'), configContent);
        const config = (0, config_1.loadConfig)(tempDir);
        expect(config.appEntry).toBe('src/app.js');
        expect(config.modelsDir).toBe('src/models');
        expect(config.servicesDir).toBe('src/services');
        expect(config.prompt).toBe('test> ');
        expect(config.useColors).toBe(false);
    });
    it('should load config from .node-console.json', () => {
        const configContent = {
            appEntry: 'src/server.js',
            modelsDir: 'app/models',
            prompt: 'json> '
        };
        fs.writeFileSync(path.join(tempDir, '.node-console.json'), JSON.stringify(configContent, null, 2));
        const config = (0, config_1.loadConfig)(tempDir);
        expect(config.appEntry).toBe('src/server.js');
        expect(config.modelsDir).toBe('app/models');
        expect(config.prompt).toBe('json> ');
    });
    it('should load config from package.json nodeConsole field', () => {
        const packageContent = {
            name: 'test-app',
            version: '1.0.0',
            nodeConsole: {
                appEntry: 'dist/main.js',
                modelsDir: 'dist/models',
                prompt: 'pkg> '
            }
        };
        fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageContent, null, 2));
        const config = (0, config_1.loadConfig)(tempDir);
        expect(config.appEntry).toBe('dist/main.js');
        expect(config.modelsDir).toBe('dist/models');
        expect(config.prompt).toBe('pkg> ');
    });
    it('should prefer config file over package.json', () => {
        // Create both config file and package.json
        const configContent = `
      module.exports = {
        appEntry: 'from-config.js',
        prompt: 'config> '
      };
    `;
        fs.writeFileSync(path.join(tempDir, '.node-console.js'), configContent);
        const packageContent = {
            name: 'test-app',
            nodeConsole: {
                appEntry: 'from-package.json',
                prompt: 'package> '
            }
        };
        fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageContent, null, 2));
        const config = (0, config_1.loadConfig)(tempDir);
        // Config file should take precedence
        expect(config.appEntry).toBe('from-config.js');
        expect(config.prompt).toBe('config> ');
    });
    it('should handle first available config file', () => {
        // Create multiple config files - first one should win
        const jsConfig = `
      module.exports = {
        appEntry: 'first.js'
      };
    `;
        const jsonConfig = {
            appEntry: 'second.js'
        };
        fs.writeFileSync(path.join(tempDir, '.node-console.js'), jsConfig);
        fs.writeFileSync(path.join(tempDir, '.node-console.json'), JSON.stringify(jsonConfig));
        const config = (0, config_1.loadConfig)(tempDir);
        expect(config.appEntry).toBe('first.js');
    });
    it('should use default when config file has syntax error', () => {
        const invalidConfig = `
      module.exports = {
        appEntry: 'test.js',
        invalid syntax here
      };
    `;
        fs.writeFileSync(path.join(tempDir, '.node-console.js'), invalidConfig);
        const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
        const config = (0, config_1.loadConfig)(tempDir);
        // Should fall back to defaults
        expect(config.appEntry).toBeNull();
        expect(consoleWarn).toHaveBeenCalled();
        consoleWarn.mockRestore();
    });
    it('should use default when package.json has syntax error', () => {
        fs.writeFileSync(path.join(tempDir, 'package.json'), 'invalid json');
        const config = (0, config_1.loadConfig)(tempDir);
        // Should fall back to defaults
        expect(config.appEntry).toBeNull();
        expect(config.prompt).toBe('node> ');
    });
    it('should handle missing package.json gracefully', () => {
        // No package.json created
        const config = (0, config_1.loadConfig)(tempDir);
        expect(config.rootPath).toBe(tempDir);
        expect(config.prompt).toBe('node> ');
    });
    it('should merge partial config with defaults', () => {
        const configContent = `
      module.exports = {
        appEntry: 'custom.js'
        // Other values should use defaults
      };
    `;
        fs.writeFileSync(path.join(tempDir, '.node-console.js'), configContent);
        const config = (0, config_1.loadConfig)(tempDir);
        expect(config.appEntry).toBe('custom.js');
        expect(config.modelsDir).toBe('models'); // default
        expect(config.servicesDir).toBe('services'); // default
        expect(config.useColors).toBe(true); // default
    });
    it('should use process.cwd() as default rootPath', () => {
        const originalCwd = process.cwd;
        process.cwd = jest.fn().mockReturnValue(tempDir);
        const config = (0, config_1.loadConfig)();
        expect(config.rootPath).toBe(tempDir);
        process.cwd = originalCwd;
    });
});
describe('generateConfig', () => {
    let tempDir;
    beforeEach(() => {
        tempDir = createTempDir();
    });
    afterEach(() => {
        removeTempDir(tempDir);
    });
    it('should create config file when it does not exist', () => {
        const result = (0, config_1.generateConfig)(tempDir);
        expect(result.created).toBe(true);
        expect(result.path).toBe(path.join(tempDir, '.node-console.js'));
        expect(fs.existsSync(result.path)).toBe(true);
    });
    it('should not overwrite existing config file', () => {
        // Create existing config
        fs.writeFileSync(path.join(tempDir, '.node-console.js'), 'module.exports = {};');
        const result = (0, config_1.generateConfig)(tempDir);
        expect(result.created).toBe(false);
        expect(result.path).toBe(path.join(tempDir, '.node-console.js'));
    });
    it('should generate valid JavaScript config', () => {
        (0, config_1.generateConfig)(tempDir);
        const configPath = path.join(tempDir, '.node-console.js');
        const content = fs.readFileSync(configPath, 'utf8');
        expect(content).toContain('module.exports');
        expect(content).toContain('appEntry');
        expect(content).toContain('modelsDir');
        expect(content).toContain('servicesDir');
        expect(content).toContain('prompt');
    });
    it('should generate config with helpful comments', () => {
        (0, config_1.generateConfig)(tempDir);
        const configPath = path.join(tempDir, '.node-console.js');
        const content = fs.readFileSync(configPath, 'utf8');
        expect(content).toContain('Node Console Configuration');
        expect(content).toContain('Path to your app entry file');
    });
    it('should use process.cwd() as default', () => {
        const originalCwd = process.cwd;
        process.cwd = jest.fn().mockReturnValue(tempDir);
        const result = (0, config_1.generateConfig)();
        expect(result.path).toBe(path.join(tempDir, '.node-console.js'));
        process.cwd = originalCwd;
    });
});
//# sourceMappingURL=config.test.js.map