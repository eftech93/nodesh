/**
 * Unit tests for API Helpers
 */

import {
  createMockRequest,
  createNextRequest,
  ApiTester,
  http,
} from '../src/helpers/api-helpers';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMockRequest()', () => {
    it('should create a basic GET request', () => {
      const request = createMockRequest('/api/users');

      expect(request.url).toBe('http://localhost:3000/api/users');
      expect(request.method).toBe('GET');
      expect(request.headers.get('content-type')).toBe('application/json');
    });

    it('should create a POST request with body', async () => {
      const body = { name: 'John', email: 'john@example.com' };
      const request = createMockRequest('/api/users', {
        method: 'POST',
        body,
      });

      expect(request.method).toBe('POST');
      expect(await request.json()).toEqual(body);
      expect(await request.text()).toBe(JSON.stringify(body));
    });

    it('should add query parameters to URL', () => {
      const request = createMockRequest('/api/users', {
        query: { page: '1', limit: '10' },
      });

      expect(request.url).toContain('page=1');
      expect(request.url).toContain('limit=10');
    });

    it('should include custom headers', () => {
      const request = createMockRequest('/api/users', {
        headers: { authorization: 'Bearer token123' },
      });

      expect(request.headers.get('authorization')).toBe('Bearer token123');
      expect(request.headers.get('content-type')).toBe('application/json');
    });

    it('should handle empty options', () => {
      const request = createMockRequest('/api/test', {});

      expect(request.method).toBe('GET');
      expect(request.headers.get('content-type')).toBe('application/json');
    });

    it('should handle all HTTP methods', () => {
      const methods: Array<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'> = [
        'GET', 'POST', 'PUT', 'PATCH', 'DELETE'
      ];

      methods.forEach(method => {
        const request = createMockRequest('/api/test', { method });
        expect(request.method).toBe(method);
      });
    });
  });

  describe('createNextRequest()', () => {
    it('should create Next.js style request', () => {
      const request = createNextRequest('/api/users');

      expect(request.url).toBe('http://localhost:3000/api/users');
      expect(request.method).toBe('GET');
      expect(request.headers.get('content-type')).toBe('application/json');
    });

    it('should have header get method', () => {
      const request = createNextRequest('/api/users', {
        headers: { 'content-type': 'text/html' },
      });

      // Headers from createMockRequest get merged, so content-type will be application/json
      expect(typeof request.headers.get).toBe('function');
    });

    it('should return null for missing headers', () => {
      const request = createNextRequest('/api/users');

      expect(request.headers.get('x-custom-header')).toBeNull();
    });

    it('should pass body to json() method', async () => {
      const body = { test: 'data' };
      const request = createNextRequest('/api/test', {
        method: 'POST',
        body,
      });

      expect(await request.json()).toEqual(body);
    });
  });

  describe('ApiTester', () => {
    it('should use default base URL', () => {
      const tester = new ApiTester();
      expect((tester as any).baseUrl).toBe('http://localhost:3000/api');
    });

    it('should accept custom base URL', () => {
      const tester = new ApiTester('http://localhost:8080');
      expect((tester as any).baseUrl).toBe('http://localhost:8080');
    });

    it('should make GET request', async () => {
      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue({ data: 'test' }),
        headers: new Map(),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const tester = new ApiTester();
      const result = await tester.get('/users');

      expect(global.fetch).toHaveBeenCalled();
      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('/users');
      expect(result.status).toBe(200);
      expect(result.data).toEqual({ data: 'test' });
    });

    it('should make POST request with body', async () => {
      const mockResponse = {
        status: 201,
        json: jest.fn().mockResolvedValue({ id: 1 }),
        headers: new Map(),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const tester = new ApiTester();
      const body = { name: 'New User' };
      await tester.post('/users', body);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[1].method).toBe('POST');
      expect(callArgs[1].body).toBe(JSON.stringify(body));
    });

    it('should make PUT request', async () => {
      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue({ updated: true }),
        headers: new Map(),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const tester = new ApiTester();
      await tester.put('/users/1', { name: 'Updated' });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[1].method).toBe('PUT');
    });

    it('should make PATCH request', async () => {
      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue({ patched: true }),
        headers: new Map(),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const tester = new ApiTester();
      await tester.patch('/users/1', { active: true });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[1].method).toBe('PATCH');
    });

    it('should make DELETE request', async () => {
      const mockResponse = {
        status: 204,
        json: jest.fn().mockResolvedValue({}),
        headers: new Map(),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const tester = new ApiTester();
      await tester.delete('/users/1');

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[1].method).toBe('DELETE');
    });

    it('should add query parameters', async () => {
      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue([]),
        headers: new Map(),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const tester = new ApiTester();
      await tester.get('/users', { page: '1', limit: '10' });

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('page=1');
      expect(callUrl).toContain('limit=10');
    });

    it('should include response headers', async () => {
      const mockHeaders = new Map([['x-total-count', '100']]);
      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue([]),
        headers: {
          entries: () => mockHeaders.entries(),
        },
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const tester = new ApiTester();
      const result = await tester.get('/users');

      expect(result.headers).toHaveProperty('x-total-count', '100');
    });

    it('should throw on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const tester = new ApiTester();
      await expect(tester.get('/users')).rejects.toThrow('API request failed: Network error');
    });

    it('should throw on fetch failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new TypeError('Failed to fetch'));

      const tester = new ApiTester();
      await expect(tester.get('/users')).rejects.toThrow('API request failed: Failed to fetch');
    });
  });

  describe('http shorthand', () => {
    it('should make GET request via shorthand', async () => {
      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue({}),
        headers: new Map(),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await http.get('/users', { page: '1' });

      expect(global.fetch).toHaveBeenCalled();
      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('/users');
    });

    it('should make POST request via shorthand', async () => {
      const mockResponse = {
        status: 201,
        json: jest.fn().mockResolvedValue({}),
        headers: new Map(),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await http.post('/users', { name: 'Test' });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[1].method).toBe('POST');
    });

    it('should make PUT request via shorthand', async () => {
      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue({}),
        headers: new Map(),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await http.put('/users/1', { name: 'Updated' });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[1].method).toBe('PUT');
    });

    it('should make PATCH request via shorthand', async () => {
      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue({}),
        headers: new Map(),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await http.patch('/users/1', { active: true });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[1].method).toBe('PATCH');
    });

    it('should make DELETE request via shorthand', async () => {
      const mockResponse = {
        status: 204,
        json: jest.fn().mockResolvedValue({}),
        headers: new Map(),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await http.delete('/users/1');

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[1].method).toBe('DELETE');
    });
  });
});
