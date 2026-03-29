/**
 * Unit tests for the Configuration module
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadConfig, generateConfig, CONFIG_FILES } from '../src/config';

// Helper to create temporary test directories
function createTempDir(): string {
  const tempDir = path.join(__dirname, 'temp-test-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11));
  fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

// Helper to clean up temp directories
function removeTempDir(tempDir: string): void {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

describe('CONFIG_FILES', () => {
  it('should include expected config file names', () => {
    expect(CONFIG_FILES).toContain('.nodesh.js');
    expect(CONFIG_FILES).toContain('.nodesh.json');
    expect(CONFIG_FILES).toContain('nodesh.config.js');
  });
});

describe('loadConfig', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  it('should return default config when no config files exist', () => {
    const config = loadConfig(tempDir);
    
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

  it('should load config from .nodesh.js', () => {
    const configContent = `
      module.exports = {
        appEntry: 'src/app.js',
        modelsDir: 'src/models',
        servicesDir: 'src/services',
        prompt: 'test> ',
        useColors: false
      };
    `;
    fs.writeFileSync(path.join(tempDir, '.nodesh.js'), configContent);
    
    const config = loadConfig(tempDir);
    
    expect(config.appEntry).toBe('src/app.js');
    expect(config.modelsDir).toBe('src/models');
    expect(config.servicesDir).toBe('src/services');
    expect(config.prompt).toBe('test> ');
    expect(config.useColors).toBe(false);
  });

  it('should load config from .nodesh.json', () => {
    const configContent = {
      appEntry: 'src/server.js',
      modelsDir: 'app/models',
      prompt: 'json> '
    };
    fs.writeFileSync(
      path.join(tempDir, '.nodesh.json'),
      JSON.stringify(configContent, null, 2)
    );
    
    const config = loadConfig(tempDir);
    
    expect(config.appEntry).toBe('src/server.js');
    expect(config.modelsDir).toBe('app/models');
    expect(config.prompt).toBe('json> ');
  });

  it('should load config from package.json nodesh field', () => {
    const packageContent = {
      name: 'test-app',
      version: '1.0.0',
      nodesh: {
        appEntry: 'dist/main.js',
        modelsDir: 'dist/models',
        prompt: 'pkg> '
      }
    };
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify(packageContent, null, 2)
    );
    
    const config = loadConfig(tempDir);
    
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
    fs.writeFileSync(path.join(tempDir, '.nodesh.js'), configContent);
    
    const packageContent = {
      name: 'test-app',
      nodeConsole: {
        appEntry: 'from-package.json',
        prompt: 'package> '
      }
    };
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify(packageContent, null, 2)
    );
    
    const config = loadConfig(tempDir);
    
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
    
    fs.writeFileSync(path.join(tempDir, '.nodesh.js'), jsConfig);
    fs.writeFileSync(
      path.join(tempDir, '.nodesh.json'),
      JSON.stringify(jsonConfig)
    );
    
    const config = loadConfig(tempDir);
    
    expect(config.appEntry).toBe('first.js');
  });

  it('should use default when config file has syntax error', () => {
    const invalidConfig = `
      module.exports = {
        appEntry: 'test.js',
        invalid syntax here
      };
    `;
    fs.writeFileSync(path.join(tempDir, '.nodesh.js'), invalidConfig);
    
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
    
    const config = loadConfig(tempDir);
    
    // Should fall back to defaults
    expect(config.appEntry).toBeNull();
    expect(consoleWarn).toHaveBeenCalled();
    
    consoleWarn.mockRestore();
  });

  it('should use default when package.json has syntax error', () => {
    fs.writeFileSync(path.join(tempDir, 'package.json'), 'invalid json');
    
    const config = loadConfig(tempDir);
    
    // Should fall back to defaults
    expect(config.appEntry).toBeNull();
    expect(config.prompt).toBe('node> ');
  });

  it('should handle missing package.json gracefully', () => {
    // No package.json created
    const config = loadConfig(tempDir);
    
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
    fs.writeFileSync(path.join(tempDir, '.nodesh.js'), configContent);
    
    const config = loadConfig(tempDir);
    
    expect(config.appEntry).toBe('custom.js');
    expect(config.modelsDir).toBe('models'); // default
    expect(config.servicesDir).toBe('services'); // default
    expect(config.useColors).toBe(true); // default
  });

  it('should use process.cwd() as default rootPath', () => {
    const originalCwd = process.cwd;
    process.cwd = jest.fn().mockReturnValue(tempDir);
    
    const config = loadConfig();
    
    expect(config.rootPath).toBe(tempDir);
    
    process.cwd = originalCwd;
  });
});

describe('generateConfig', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  it('should create config file when it does not exist', () => {
    const result = generateConfig(tempDir);
    
    expect(result.created).toBe(true);
    expect(result.path).toBe(path.join(tempDir, '.nodesh.js'));
    expect(fs.existsSync(result.path)).toBe(true);
  });

  it('should not overwrite existing config file', () => {
    // Create existing config
    fs.writeFileSync(path.join(tempDir, '.nodesh.js'), 'module.exports = {};');
    
    const result = generateConfig(tempDir);
    
    expect(result.created).toBe(false);
    expect(result.path).toBe(path.join(tempDir, '.nodesh.js'));
  });

  it('should generate valid JavaScript config', () => {
    generateConfig(tempDir);
    
    const configPath = path.join(tempDir, '.nodesh.js');
    const content = fs.readFileSync(configPath, 'utf8');
    
    expect(content).toContain('module.exports');
    expect(content).toContain('appEntry');
    expect(content).toContain('modelsDir');
    expect(content).toContain('servicesDir');
    expect(content).toContain('prompt');
  });

  it('should generate config with helpful comments', () => {
    generateConfig(tempDir);
    
    const configPath = path.join(tempDir, '.nodesh.js');
    const content = fs.readFileSync(configPath, 'utf8');
    
    expect(content).toContain('NodeSH Configuration');
    expect(content).toContain('Path to your app entry file');
  });

  it('should use process.cwd() as default', () => {
    const originalCwd = process.cwd;
    process.cwd = jest.fn().mockReturnValue(tempDir);
    
    const result = generateConfig();
    
    expect(result.path).toBe(path.join(tempDir, '.nodesh.js'));
    
    process.cwd = originalCwd;
  });
});
