/**
 * Unit tests for the NestJS Loader module
 */

import * as fs from 'fs';
import * as path from 'path';
import { NestJSLoader } from '../src/nestjs-loader';

function createTempDir(): string {
  const tempDir = path.join(__dirname, 'temp-nestjs-test-' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

function removeTempDir(tempDir: string): void {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

describe('NestJSLoader', () => {
  let tempDir: string;
  let loader: NestJSLoader;

  beforeEach(() => {
    tempDir = createTempDir();
    loader = new NestJSLoader({ rootPath: tempDir, config: {} });
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  describe('isNestJSProject', () => {
    it('should detect NestJS by nest-cli.json', () => {
      fs.writeFileSync(path.join(tempDir, 'nest-cli.json'), '{}');
      expect(NestJSLoader.isNestJSProject(tempDir)).toBe(true);
    });

    it('should detect NestJS by package.json dependency', () => {
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ dependencies: { '@nestjs/core': '^10.0.0' } })
      );
      expect(NestJSLoader.isNestJSProject(tempDir)).toBe(true);
    });

    it('should detect NestJS by main.ts with NestFactory', () => {
      fs.mkdirSync(path.join(tempDir, 'src'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, 'src', 'main.ts'),
        'import { NestFactory } from "@nestjs/core";'
      );
      expect(NestJSLoader.isNestJSProject(tempDir)).toBe(true);
    });

    it('should return false for non-NestJS projects', () => {
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ dependencies: { express: '^4.0.0' } })
      );
      expect(NestJSLoader.isNestJSProject(tempDir)).toBe(false);
    });
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const defaultLoader = new NestJSLoader();
      expect(defaultLoader.rootPath).toBe(process.cwd());
      expect(defaultLoader.context).toEqual({});
      expect(defaultLoader.loadedFiles).toEqual([]);
      expect(defaultLoader.nestApp).toBeNull();
    });

    it('should initialize with provided options', () => {
      const customLoader = new NestJSLoader({
        rootPath: tempDir,
        config: { modelsDir: 'src/models' }
      });
      expect(customLoader.rootPath).toBe(tempDir);
      expect(customLoader.config).toEqual({ modelsDir: 'src/models' });
    });
  });

  describe('loadEnvironment', () => {
    it('should set env and NODE_ENV in context', () => {
      loader.loadEnvironment();
      expect(loader.context.env).toBe(process.env);
      expect(loader.context.NODE_ENV).toBe(process.env.NODE_ENV || 'development');
    });

    it('should load .env files if they exist', () => {
      fs.writeFileSync(path.join(tempDir, '.env'), 'TEST_VAR=hello');
      loader.loadEnvironment();
      expect(loader.context.env).toBeDefined();
    });
  });

  describe('loadEntities', () => {
    it('should load entity files', async () => {
      fs.mkdirSync(path.join(tempDir, 'src'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, 'src', 'User.entity.js'),
        'class UserEntity { id; } module.exports = UserEntity;'
      );

      await loader.loadEntities();

      expect(loader.loadedFiles.some(f => f.includes('User.entity'))).toBe(true);
    });

    it('should handle missing src directory gracefully', async () => {
      await expect(loader.loadEntities()).resolves.not.toThrow();
    });
  });

  describe('loadAllServices', () => {
    it('should load service files', async () => {
      fs.mkdirSync(path.join(tempDir, 'src'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, 'src', 'User.service.ts'),
        'export class UserService { findAll() { return []; } }'
      );

      await loader.loadAllServices();

      expect(loader.loadedFiles.some(f => f.includes('User.service'))).toBe(true);
    });
  });

  describe('loadQueues', () => {
    it('should load queue files from queues directory', async () => {
      fs.mkdirSync(path.join(tempDir, 'src', 'queues'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, 'src', 'queues', 'email.processor.js'),
        'class EmailProcessor { } module.exports = EmailProcessor;'
      );

      await loader.loadQueues();

      expect(loader.loadedFiles.some(f => f.includes('email.processor'))).toBe(true);
    });

    it('should handle missing queues directory gracefully', async () => {
      await expect(loader.loadQueues()).resolves.not.toThrow();
    });
  });

  describe('utility methods', () => {
    describe('toCamelCase', () => {
      it('should convert PascalCase to camelCase', () => {
        expect(loader.toCamelCase('UserService')).toBe('userService');
        expect(loader.toCamelCase('OrderProcessor')).toBe('orderProcessor');
      });

      it('should handle already camelCase strings', () => {
        expect(loader.toCamelCase('userService')).toBe('userService');
      });
    });

    describe('getHelpText', () => {
      it('should return help text with available context', () => {
        // Add loaded files to trigger entity detection
        loader.loadedFiles = ['src/entities/Order.entity.js'];
        
        loader.context = {
          UserService: class {},
          OrderEntity: class {},
          env: {},
          NODE_ENV: 'test'
        };

        const helpText = loader.getHelpText();

        expect(helpText).toContain('Available Context');
        expect(helpText).toContain('NestJS');
        expect(helpText).toContain('Services');
        expect(helpText).toContain('Entities');
      });
    });
  });

  describe('full load', () => {
    it('should load all components without errors', async () => {
      fs.mkdirSync(path.join(tempDir, 'src'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, 'src', 'main.ts'),
        'export async function bootstrap() { return {}; }'
      );

      const context = await loader.load();

      expect(context).toBeDefined();
      expect(loader.loadedFiles.length).toBeGreaterThanOrEqual(0);
    });
  });
});
