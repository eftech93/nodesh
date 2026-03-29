/**
 * Next.js specific helpers for NodeSH
 * Supports App Router API routes and Server Actions
 */

// Import Next.js types as dev dependency - users will have Next.js installed
import type { NextRequest } from 'next/server';

/**
 * Create a mock Next.js App Router request
 * Compatible with Next.js 14+ App Router
 */
export function createNextAppRouterRequest(
  url: string,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {} } = options;
  
  // Create a proper Request object that NextRequest can wrap
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  
  if (body && method !== 'GET') {
    init.body = JSON.stringify(body);
  }
  
  // Use global Request and cast to NextRequest
  return new Request(url, init) as unknown as NextRequest;
}

/**
 * Call a Next.js API route handler directly
 * Works with App Router route.ts files
 */
export async function callNextRoute(
  modulePath: string,
  method: string,
  body?: Record<string, unknown>,
  params?: Record<string, string>,
  query?: Record<string, string>
): Promise<{
  status: number;
  data: unknown;
  headers: Record<string, string>;
}> {
  // Resolve path relative to current working directory
  const fullPath = require.resolve(modulePath, { paths: [process.cwd()] });
  
  // Import the route module
  const routeModule = require(fullPath);
  
  // Get the HTTP method handler
  const handler = routeModule[method];
  if (!handler) {
    throw new Error(`No ${method} handler found in ${modulePath}`);
  }
  
  // Build URL with query params
  let url = 'http://localhost:3000/api/test';
  if (query && Object.keys(query).length > 0) {
    const searchParams = new URLSearchParams(query);
    url += `?${searchParams.toString()}`;
  }
  
  // Create mock request
  const request = createNextAppRouterRequest(url, { method, body });
  
  // Build context
  const context: { params?: Record<string, string> } = {};
  if (params) {
    context.params = params;
  }
  
  // Call handler
  const response = await handler(request, context);
  
  // Parse response
  const responseData = await response.json();
  
  return {
    status: response.status,
    data: responseData,
    headers: Object.fromEntries(response.headers.entries()),
  };
}

/**
 * Generic API caller for Next.js App Router routes
 * Automatically resolves route files based on rootPath and path
 * 
 * @param rootPath - Base directory for API routes (e.g., './src/app/api')
 * @param path - API path (e.g., '/users' or '/users/123')
 * @param method - HTTP method
 * @param body - Request body
 * @param options - Additional options (query, headers)
 */
export async function api(
  rootPath: string,
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS' = 'GET',
  body?: Record<string, unknown>,
  options: {
    query?: Record<string, string>;
    headers?: Record<string, string>;
  } = {}
): Promise<{
  status: number;
  data: unknown;
  headers: Record<string, string>;
}> {
  // Remove leading /api/ if present
  const cleanPath = path.replace(/^\/api\//, '').replace(/^\//, '');
  
  // Check if this is a dynamic route (ends with /id)
  const pathParts = cleanPath.split('/');
  const lastPart = pathParts[pathParts.length - 1];
  const isDynamicRoute = /^[a-zA-Z0-9_-]+$/.test(lastPart) && 
                         !['users', 'products', 'orders', 'items'].includes(lastPart);
  
  let modulePath: string;
  let params: Record<string, string> | undefined;
  
  if (isDynamicRoute && pathParts.length > 1) {
    // Dynamic route: /users/123 -> /users/[id]/route
    const basePath = pathParts.slice(0, -1).join('/');
    modulePath = `${rootPath}/${basePath}/[id]/route`;
    params = { id: lastPart };
  } else {
    // Static route: /users -> /users/route
    modulePath = `${rootPath}/${cleanPath}/route`;
  }

  return callNextRoute(
    modulePath,
    method,
    body,
    params,
    options.query
  );
}

/**
 * Shorthand HTTP methods for Next.js API routes
 * 
 * @example
 * const nextApi = apiHttp('./src/app/api');
 * const users = await nextApi.get('/users');
 * const newUser = await nextApi.post('/users', { name: 'John' });
 */
export function apiHttp(rootPath: string) {
  return {
    get: (path: string, query?: Record<string, string>) => 
      api(rootPath, path, 'GET', undefined, { query }),
    
    post: (path: string, body: Record<string, unknown>) => 
      api(rootPath, path, 'POST', body),
    
    patch: (path: string, body: Record<string, unknown>) => 
      api(rootPath, path, 'PATCH', body),
    
    put: (path: string, body: Record<string, unknown>) => 
      api(rootPath, path, 'PUT', body),
    
    delete: (path: string) => 
      api(rootPath, path, 'DELETE'),
    
    head: (path: string) =>
      api(rootPath, path, 'HEAD'),
    
    options: (path: string) =>
      api(rootPath, path, 'OPTIONS'),
  };
}

/**
 * Pre-configured API caller for standard Next.js 14+ App Router structure
 * Assumes routes are in ./src/app/api or ./app/api
 * 
 * @example
 * import { nextApi } from '@eftech93/nodesh';
 * const users = await nextApi.get('/users');
 */
export const nextApi = {
  get: (path: string, query?: Record<string, string>) => 
    api('./src/app/api', path, 'GET', undefined, { query }),
  
  post: (path: string, body: Record<string, unknown>) => 
    api('./src/app/api', path, 'POST', body),
  
  patch: (path: string, body: Record<string, unknown>) => 
    api('./src/app/api', path, 'PATCH', body),
  
  put: (path: string, body: Record<string, unknown>) => 
    api('./src/app/api', path, 'PUT', body),
  
  delete: (path: string) => 
    api('./src/app/api', path, 'DELETE'),
  
  head: (path: string) =>
    api('./src/app/api', path, 'HEAD'),
  
  options: (path: string) =>
    api('./src/app/api', path, 'OPTIONS'),
};

/**
 * Import and return all server actions from a directory
 */
export async function importServerActions(
  actionsDir: string
): Promise<Record<string, (...args: unknown[]) => Promise<unknown>>> {
  const pathModule: typeof import('path') = require('path');
  const fsModule: typeof import('fs') = require('fs');
  
  const actions: Record<string, (...args: unknown[]) => Promise<unknown>> = {};
  
  try {
    const fullPath = pathModule.resolve(process.cwd(), actionsDir);
    const files = fsModule.readdirSync(fullPath);
    
    for (const file of files) {
      if (file.endsWith('.ts') || file.endsWith('.js')) {
        const actionName = file.replace(/\.(ts|js)$/, '');
        const modulePath = pathModule.join(fullPath, file);
        
        try {
          const module = await import(modulePath);
          // Export all exported functions
          for (const [funcName, func] of Object.entries(module)) {
            if (typeof func === 'function') {
              actions[`${actionName}.${funcName}`] = func as (...args: unknown[]) => Promise<unknown>;
            }
          }
        } catch (e) {
          console.warn(`Failed to import ${file}:`, e);
        }
      }
    }
  } catch (e) {
    console.warn(`Failed to load actions from ${actionsDir}:`, e);
  }
  
  return actions;
}

/**
 * Execute a server action with logging
 */
export async function execAction<T = unknown>(
  action: (...args: unknown[]) => Promise<T>,
  ...args: unknown[]
): Promise<T> {
  console.log(`🚀 Executing server action...`);
  console.log(`   Args:`, args);
  
  try {
    const result = await action(...args);
    console.log(`✅ Action completed`);
    console.log(`   Result:`, result);
    return result;
  } catch (error) {
    console.error(`❌ Action failed:`, error);
    throw error;
  }
}

/**
 * Batch execute multiple server actions
 */
export async function batchActions<T = unknown>(
  actions: Array<{
    action: (...args: unknown[]) => Promise<T>;
    args?: unknown[];
  }>
): Promise<T[]> {
  console.log(`🚀 Executing ${actions.length} actions in batch...`);
  
  const results = await Promise.all(
    actions.map(({ action, args = [] }) => action(...args))
  );
  
  console.log(`✅ All ${actions.length} actions completed`);
  return results;
}

/**
 * Fetch against a running Next.js dev server
 * Useful for testing deployed or running dev servers
 */
export async function nextFetch(
  baseUrl: string,
  path: string,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
  } = {}
): Promise<{
  status: number;
  data: unknown;
  headers: Record<string, string>;
}> {
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;
  
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  
  const data = await response.json().catch(() => null);
  
  return {
    status: response.status,
    data,
    headers: Object.fromEntries(response.headers.entries()),
  };
}
