/**
 * API Testing Helpers for NodeSH
 * Utilities for testing API routes directly in the console
 */

export interface MockRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  query?: Record<string, string>;
}

export interface MockResponse {
  status: number;
  data: unknown;
  headers: Record<string, string>;
}

/**
 * Create a mock request object for testing route handlers
 */
export function createMockRequest(
  url: string,
  options: MockRequestOptions = {}
): {
  url: string;
  method: string;
  headers: Map<string, string>;
  json: () => Promise<Record<string, unknown>>;
  text: () => Promise<string>;
} {
  const { method = 'GET', body, headers = {}, query } = options;
  
  // Build URL with query params
  const urlObj = new URL(url, 'http://localhost:3000');
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value);
    });
  }

  const headerMap = new Map<string, string>([
    ['content-type', 'application/json'],
    ...Object.entries(headers),
  ]);

  return {
    url: urlObj.toString(),
    method,
    headers: headerMap,
    json: async () => body || {},
    text: async () => JSON.stringify(body || {}),
  };
}

/**
 * Create a mock Next.js style request
 */
export function createNextRequest(
  path: string,
  options: MockRequestOptions = {}
): {
  url: string;
  method: string;
  headers: { get(name: string): string | null };
  json: () => Promise<Record<string, unknown>>;
  text: () => Promise<string>;
} {
  const request = createMockRequest(path, options);
  
  return {
    url: request.url,
    method: request.method,
    headers: {
      get: (name: string) => request.headers.get(name.toLowerCase()) || null,
    },
    json: request.json,
    text: request.text,
  };
}

/**
 * HTTP client for testing API routes
 */
export class ApiTester {
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:3000/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Make a request to an API route
   */
  async request(
    path: string,
    method: MockRequestOptions['method'] = 'GET',
    body?: Record<string, unknown>,
    query?: Record<string, string>
  ): Promise<MockResponse> {
    const url = new URL(path, this.baseUrl);
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    try {
      const response = await fetch(url.toString(), {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();
      
      return {
        status: response.status,
        data,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      throw new Error(`API request failed: ${(error as Error).message}`);
    }
  }

  /** GET request */
  get(path: string, query?: Record<string, string>): Promise<MockResponse> {
    return this.request(path, 'GET', undefined, query);
  }

  /** POST request */
  post(path: string, body: Record<string, unknown>): Promise<MockResponse> {
    return this.request(path, 'POST', body);
  }

  /** PATCH request */
  patch(path: string, body: Record<string, unknown>): Promise<MockResponse> {
    return this.request(path, 'PATCH', body);
  }

  /** PUT request */
  put(path: string, body: Record<string, unknown>): Promise<MockResponse> {
    return this.request(path, 'PUT', body);
  }

  /** DELETE request */
  delete(path: string): Promise<MockResponse> {
    return this.request(path, 'DELETE');
  }
}

/**
 * Shorthand HTTP methods
 */
export const http = {
  get: (url: string, query?: Record<string, string>) => 
    new ApiTester().get(url, query),
  post: (url: string, body: Record<string, unknown>) => 
    new ApiTester().post(url, body),
  patch: (url: string, body: Record<string, unknown>) => 
    new ApiTester().patch(url, body),
  put: (url: string, body: Record<string, unknown>) => 
    new ApiTester().put(url, body),
  delete: (url: string) => 
    new ApiTester().delete(url),
};

/**
 * Debug an API call with step-by-step logging
 */
export async function debugApi(
  path: string,
  method: MockRequestOptions['method'] = 'GET',
  body?: Record<string, unknown>
): Promise<MockResponse> {
  console.log(`\n🔍 Debugging API: ${method} ${path}`);
  console.log('Step 1: Creating request...');
  
  const request = createNextRequest(path, { method, body });
  
  console.log('Request:', {
    url: request.url,
    method: request.method,
    headers: 'Headers { ... }',
  });
  
  if (body) {
    console.log('Body:', body);
  }

  console.log('\nStep 2: Executing request...');
  const tester = new ApiTester();
  const result = await tester.request(path, method, body);
  
  console.log('\nStep 3: Response received:');
  console.log('Status:', result.status);
  console.log('Headers:', result.headers);
  console.log('Data:', result.data);

  return result;
}
