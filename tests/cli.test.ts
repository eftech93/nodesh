/**
 * Unit tests for CLI module
 */

import * as fs from 'fs';
import * as path from 'path';

// Mock commander before importing cli
jest.mock('commander', () => ({
  program: {
    name: jest.fn().mockReturnThis(),
    alias: jest.fn().mockReturnThis(),
    description: jest.fn().mockReturnThis(),
    version: jest.fn().mockReturnThis(),
    option: jest.fn().mockReturnThis(),
    argument: jest.fn().mockReturnThis(),
    action: jest.fn().mockReturnThis(),
    parse: jest.fn()
  }
}));

describe('CLI Module', () => {
  const originalArgv = process.argv;
  
  beforeEach(() => {
    jest.resetModules();
    process.argv = ['node', 'nodesh'];
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  it('should export CLI setup', () => {
    // Import cli module (it registers commands on import)
    expect(() => {
      require('../src/cli');
    }).not.toThrow();
  });

  it('should have correct bin entries in package.json', () => {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    expect(packageJson.bin).toBeDefined();
    expect(packageJson.bin.nodesh).toBeDefined();
    expect(packageJson.bin.nsh).toBeDefined();
    expect(packageJson.bin.eft).toBeDefined();
  });

  it('should have main entry point defined', () => {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    expect(packageJson.main).toBe('dist/index.js');
    expect(packageJson.types).toBe('dist/index.d.ts');
  });
});
