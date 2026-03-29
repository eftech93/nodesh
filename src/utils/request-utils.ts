/**
 * Request/Response utilities for NodeSH
 */

/**
 * Parse query string to object
 */
export function parseQuery(queryString: string): Record<string, string> {
  // Handle leading ?
  const qs = queryString.startsWith('?') ? queryString.slice(1) : queryString;
  const result: Record<string, string> = {};
  
  if (!qs) return result;
  
  // Manual parsing to handle = in values correctly
  const pairs = qs.split('&');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx === -1) {
      // Key without value
      result[decodeURIComponent(pair)] = '';
    } else {
      const key = decodeURIComponent(pair.slice(0, idx));
      const value = decodeURIComponent(pair.slice(idx + 1));
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Build query string from object
 */
export function buildQuery(params: Record<string, string | number | boolean>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, String(value));
  });
  return searchParams.toString();
}

/**
 * Extract path parameters from URL pattern
 * @example
 * extractPathParams('/users/:id', '/users/123') // { id: '123' }
 */
export function extractPathParams(
  pattern: string,
  path: string
): Record<string, string> | null {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');
  
  if (patternParts.length !== pathParts.length) return null;
  
  const params: Record<string, string> = {};
  
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];
    
    if (patternPart.startsWith(':')) {
      const paramName = patternPart.slice(1);
      params[paramName] = decodeURIComponent(pathPart);
    } else if (patternPart.startsWith('[') && patternPart.endsWith(']')) {
      // Next.js style [param]
      const paramName = patternPart.slice(1, -1);
      params[paramName] = decodeURIComponent(pathPart);
    } else if (patternPart !== pathPart) {
      return null;
    }
  }
  
  return params;
}

/**
 * Build URL with path parameters
 * @example
 * buildUrl('/users/:id', { id: '123' }) // '/users/123'
 */
export function buildUrl(
  pattern: string,
  params: Record<string, string | number>
): string {
  return pattern.replace(/:(\w+)|\[(\w+)\]/g, (match, p1, p2) => {
    const key = p1 || p2;
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

/**
 * Parse JSON safely
 */
export function safeJsonParse<T = unknown>(text: string, defaultValue?: T): T | undefined {
  try {
    return JSON.parse(text) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Stringify JSON safely with circular reference handling
 */
export function safeJsonStringify(
  value: unknown,
  space?: number
): string {
  const seen = new WeakSet();
  return JSON.stringify(
    value,
    (key, val) => {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) {
          return '[Circular]';
        }
        seen.add(val);
      }
      if (typeof val === 'bigint') {
        return String(val);
      }
      return val;
    },
    space
  );
}

/**
 * Get content type from headers
 */
export function getContentType(headers: Record<string, string>): string {
  return headers['content-type'] || headers['Content-Type'] || 'application/octet-stream';
}

/**
 * Check if content type is JSON
 */
export function isJsonContentType(contentType: string): boolean {
  return contentType.includes('application/json');
}

/**
 * Create a delayed response promise (for testing)
 */
export function delayedResponse<T>(
  data: T,
  delayMs: number
): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(data), delayMs));
}

/**
 * Create a mock fetch response
 */
export function createMockResponse(
  data: unknown,
  options: {
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
  } = {}
): {
  ok: boolean;
  status: number;
  statusText: string;
  headers: { get(name: string): string | null };
  json: () => Promise<unknown>;
  text: () => Promise<string>;
} {
  const {
    status = 200,
    statusText = 'OK',
    headers = {},
  } = options;

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: {
      get: (name: string) => headers[name.toLowerCase()] || null,
    },
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}
