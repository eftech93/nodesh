/**
 * Unit tests for the Next.js Loader module
 */

import * as fs from 'fs';
import * as path from 'path';
import { NextJSLoader } from '../src/nextjs-loader';

function createTempDir(): string {
  const tempDir = path.join(__dirname, 'temp-nextjs-test-' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

function removeTempDir(tempDir: string): void {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

describe('NextJSLoader', () => {
  let tempDir: string;
  let loader: NextJSLoader;

  beforeEach(() => {
    tempDir = createTempDir();
    loader = new NextJSLoader({ rootPath: tempDir, config: {} });
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  describe('isNextJSProject', () => {
    it('should detect Next.js by next.config.js', () => {
      fs.writeFileSync(path.join(tempDir, 'next.config.js'), 'module.exports = {};');
      expect(NextJSLoader.isNextJSProject(tempDir)).toBe(true);
    });

    it('should detect Next.js by next.config.ts', () => {
      fs.writeFileSync(path.join(tempDir, 'next.config.ts'), 'export default {};');
      expect(NextJSLoader.isNextJSProject(tempDir)).toBe(true);
    });

    it('should detect Next.js by package.json dependency', () => {
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ dependencies: { next: '^14.0.0' } })
      );
      expect(NextJSLoader.isNextJSProject(tempDir)).toBe(true);
    });

    it('should detect Next.js by app directory', () => {
      fs.mkdirSync(path.join(tempDir, 'app'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'app', 'page.tsx'), 'export default function Page() {}');
      expect(NextJSLoader.isNextJSProject(tempDir)).toBe(true);
    });

    it('should detect Next.js by pages directory', () => {
      fs.mkdirSync(path.join(tempDir, 'pages'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'pages', 'index.tsx'), 'export default function Home() {}');
      expect(NextJSLoader.isNextJSProject(tempDir)).toBe(true);
    });

    it('should return false for non-NextJS projects', () => {
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ dependencies: { express: '^4.0.0' } })
      );
      expect(NextJSLoader.isNextJSProject(tempDir)).toBe(false);
    });
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const defaultLoader = new NextJSLoader();
      expect(defaultLoader.rootPath).toBe(process.cwd());
      expect(defaultLoader.context).toEqual({});
      expect(defaultLoader.loadedFiles).toEqual([]);
      expect(defaultLoader.nextConfig).toBeNull();
    });
  });

  describe('loadEnvironment', () => {
    it('should set env and NODE_ENV in context', () => {
      loader.loadEnvironment();
      expect(loader.context.env).toBe(process.env);
      expect(loader.context.NODE_ENV).toBeDefined();
    });
  });

  describe('autoConnectDB', () => {
    it('should find and call connectDB from lib/db.ts', async () => {
      fs.mkdirSync(path.join(tempDir, 'lib'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, 'lib', 'db.ts'),
        'export async function connectDB() { return "connected"; }'
      );

      await loader.autoConnectDB();

      expect(loader.context.connectDB).toBeDefined();
      expect(loader.context.connect).toBeDefined();
    });

    it('should handle missing db file gracefully', async () => {
      await expect(loader.autoConnectDB()).resolves.not.toThrow();
    });
  });

  describe('loadNextConfig', () => {
    it('should load next.config.js', async () => {
      fs.writeFileSync(
        path.join(tempDir, 'next.config.js'),
        'module.exports = { reactStrictMode: true };'
      );

      await loader.loadNextConfig();

      expect(loader.context.nextConfig).toEqual({ reactStrictMode: true });
    });

    it('should handle missing config gracefully', async () => {
      await expect(loader.loadNextConfig()).resolves.not.toThrow();
      expect(loader.context.nextConfig).toBeUndefined();
    });
  });

  describe('loadAPIRoutes', () => {
    it('should load API route files and create helpers', async () => {
      fs.mkdirSync(path.join(tempDir, 'app', 'api', 'users'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, 'app', 'api', 'users', 'route.ts'),
        'export async function GET() { return { users: [] }; }'
      );

      await loader.loadAPIRoutes();

      expect(loader.context.apiUsersRoute).toBeDefined();
      expect(loader.context.apiUsersGET).toBeDefined();
    });

    it('should handle missing api directory gracefully', async () => {
      await expect(loader.loadAPIRoutes()).resolves.not.toThrow();
    });
  });

  describe('createRouteHelpers', () => {
    it('should create helper functions for HTTP methods', () => {
      const routeModule = {
        GET: jest.fn().mockResolvedValue({ data: [] }),
        POST: jest.fn().mockResolvedValue({ created: true })
      };

      loader.createRouteHelpers('api/users', routeModule);

      expect(loader.context.apiUsersGET).toBeDefined();
      expect(loader.context.apiUsersPOST).toBeDefined();
    });

    it('should create dynamic route helpers', () => {
      const routeModule = {
        GET: jest.fn().mockResolvedValue({ data: {} })
      };

      loader.createRouteHelpers('api/users/[id]', routeModule);

      expect(loader.context.apiUsersIdGET).toBeDefined();
    });
  });

  describe('loadModels', () => {
    it('should load models from src/models', async () => {
      fs.mkdirSync(path.join(tempDir, 'src', 'models'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, 'src', 'models', 'User.js'),
        'class User { } module.exports = User;'
      );

      await loader.loadModels();

      expect(loader.context.User).toBeDefined();
    });

    it('should create pluralized aliases', async () => {
      fs.mkdirSync(path.join(tempDir, 'models'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, 'models', 'User.js'),
        'class User { } module.exports = User;'
      );

      await loader.loadModels();

      expect(loader.context.User).toBeDefined();
      expect(loader.context.Users).toBeDefined();
    });
  });

  describe('loadServices', () => {
    it('should load services and create aliases', async () => {
      fs.mkdirSync(path.join(tempDir, 'src', 'services'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, 'src', 'services', 'UserService.js'),
        'class UserService { findAll() { return []; } } module.exports = UserService;'
      );

      await loader.loadServices();

      expect(loader.context.UserService).toBeDefined();
      expect(loader.context.userService).toBeDefined();
    });
  });

  describe('loadServerActions', () => {
    it('should load server actions from actions directory', async () => {
      fs.mkdirSync(path.join(tempDir, 'app', 'actions'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, 'app', 'actions', 'auth.js'),
        '"use server"; function login() { return "logged in"; } function logout() { return "logged out"; } module.exports = { login, logout };'
      );

      await loader.loadServerActions();

      expect(loader.context.authLogin).toBeDefined();
      expect(loader.context.authLogout).toBeDefined();
    });

    it('should load server actions from .actions.ts files', async () => {
      fs.mkdirSync(path.join(tempDir, 'src', 'app', 'actions'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, 'src', 'app', 'actions', 'user.actions.js'),
        'function createUser() { return "created"; } module.exports = { createUser };'
      );

      await loader.loadServerActions();

      // .actions suffix is stripped, so it becomes userCreateUser
      expect(loader.context.userCreateUser).toBeDefined();
    });

    it('should wrap actions with logging and error handling', async () => {
      fs.mkdirSync(path.join(tempDir, 'actions'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, 'actions', 'test.actions.js'),
        '"use server"; async function testAction() { return "success"; } module.exports = { testAction };'
      );

      await loader.loadServerActions();

      // Check that the action is wrapped (should log execution)
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const testActionFn = loader.context.testTestAction as (...args: unknown[]) => Promise<unknown>;
      expect(testActionFn).toBeDefined();
      const result = await testActionFn();
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Executing server action'));
      expect(result).toBe('success');
      consoleSpy.mockRestore();
    });

    it('should add Action suffix for clarity', async () => {
      fs.mkdirSync(path.join(tempDir, 'lib', 'actions'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, 'lib', 'actions', 'email.js'),
        '"use server"; function sendEmail() { return "sent"; } module.exports = { sendEmail };'
      );

      await loader.loadServerActions();

      // Actions are named with directory prefix + function name
      expect(loader.context.emailSendEmailAction).toBeDefined();
      expect(typeof loader.context.emailSendEmailAction).toBe('function');
    });

    it('should scan app directory for server actions', async () => {
      fs.mkdirSync(path.join(tempDir, 'app', 'login'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, 'app', 'login', 'page.tsx'),
        '"use server"; export async function doLogin() { return "done"; }'
      );

      await loader.loadServerActions();

      // Should detect the file has 'use server' and load it
      expect(loader.loadedFiles.some(f => f.includes('page.tsx'))).toBe(true);
    });

    it('should handle missing actions directory gracefully', async () => {
      await expect(loader.loadServerActions()).resolves.not.toThrow();
    });
  });

  describe('createActionWrapper', () => {
    it('should execute action and log success', async () => {
      const action = jest.fn().mockResolvedValue('result');
      const wrapped = loader.createActionWrapper('testAction', action);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const result = await wrapped('arg1', 'arg2');

      expect(action).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result).toBe('result');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Executing server action'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('completed'));
      consoleSpy.mockRestore();
    });

    it('should log errors when action fails', async () => {
      const action = jest.fn().mockRejectedValue(new Error('Action failed'));
      const wrapped = loader.createActionWrapper('failingAction', action);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await expect(wrapped()).rejects.toThrow('Action failed');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('failed'), 'Action failed');
      consoleSpy.mockRestore();
    });

    it('should validate and serialize arguments', async () => {
      const action = jest.fn().mockResolvedValue('ok');
      const wrapped = loader.createActionWrapper('test', action);

      await wrapped({ name: 'test', value: 123 });

      expect(action).toHaveBeenCalledWith(expect.objectContaining({ name: 'test', value: 123 }));
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
      });

      it('should handle words ending in s, x, ch', () => {
        expect(loader.pluralize('Class')).toBe('Classes');
        expect(loader.pluralize('Box')).toBe('Boxes');
      });
    });

    describe('toCamelCase', () => {
      it('should convert snake_case to camelCase', () => {
        expect(loader.toCamelCase('user_service')).toBe('userService');
      });

      it('should convert PascalCase to camelCase', () => {
        expect(loader.toCamelCase('UserService')).toBe('userService');
      });
    });

    describe('getHelpText', () => {
      it('should return formatted help text', () => {
        loader.context = {
          User: class {},
          apiUsersGET: jest.fn(),
          env: {}
        };

        const helpText = loader.getHelpText();

        expect(helpText).toContain('Available Context');
        expect(helpText).toContain('Next.js');
      });
    });
  });

  describe('full load', () => {
    it('should load all components', async () => {
      fs.mkdirSync(path.join(tempDir, 'app', 'api'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'next.config.js'), '{}');

      const context = await loader.load();

      expect(context).toBeDefined();
      expect(context.env).toBeDefined();
    });
  });
});
