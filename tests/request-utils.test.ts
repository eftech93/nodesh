/**
 * Unit tests for Request Utilities
 */

import {
  parseQuery,
  buildQuery,
  extractPathParams,
  buildUrl,
  safeJsonParse,
  safeJsonStringify,
} from '../src/utils/request-utils';

describe('Request Utilities', () => {
  describe('parseQuery()', () => {
    it('should parse query string without leading ?', () => {
      const result = parseQuery('foo=bar&baz=qux');
      expect(result).toEqual({ foo: 'bar', baz: 'qux' });
    });

    it('should parse query string with leading ?', () => {
      const result = parseQuery('?foo=bar&baz=qux');
      expect(result).toEqual({ foo: 'bar', baz: 'qux' });
    });

    it('should handle empty string', () => {
      expect(parseQuery('')).toEqual({});
      expect(parseQuery('?')).toEqual({});
    });

    it('should decode URL-encoded values', () => {
      const result = parseQuery('name=John%20Doe&city=New%20York');
      expect(result).toEqual({ name: 'John Doe', city: 'New York' });
    });

    it('should handle duplicate keys (last wins)', () => {
      const result = parseQuery('foo=bar&foo=baz');
      expect(result).toEqual({ foo: 'baz' });
    });

    it('should handle values with = in them', () => {
      const result = parseQuery('equation=1+1=2');
      expect(result).toEqual({ equation: '1+1=2' });
    });

    it('should handle empty values', () => {
      const result = parseQuery('foo=&bar=');
      expect(result).toEqual({ foo: '', bar: '' });
    });

    it('should handle keys without values', () => {
      const result = parseQuery('foo&bar');
      expect(result).toEqual({ foo: '', bar: '' });
    });
  });

  describe('buildQuery()', () => {
    it('should build query string from object', () => {
      const result = buildQuery({ foo: 'bar', baz: 'qux' });
      expect(result).toBe('foo=bar&baz=qux');
    });

    it('should encode values', () => {
      const result = buildQuery({ name: 'John Doe', city: 'New York' });
      expect(result).toBe('name=John+Doe&city=New+York');
    });

    it('should handle empty object', () => {
      expect(buildQuery({})).toBe('');
    });

    it('should handle numbers', () => {
      const result = buildQuery({ count: 42, page: 1 });
      expect(result).toBe('count=42&page=1');
    });

    it('should handle booleans', () => {
      const result = buildQuery({ active: true, deleted: false });
      expect(result).toBe('active=true&deleted=false');
    });
  });

  describe('extractPathParams()', () => {
    it('should extract named parameters', () => {
      const pattern = '/users/:id/posts/:postId';
      const path = '/users/123/posts/456';
      
      const result = extractPathParams(pattern, path);
      
      expect(result).toEqual({ id: '123', postId: '456' });
    });

    it('should handle single parameter', () => {
      const result = extractPathParams('/users/:id', '/users/abc');
      expect(result).toEqual({ id: 'abc' });
    });

    it('should return null if path does not match', () => {
      const result = extractPathParams('/users/:id', '/posts/123');
      expect(result).toBeNull();
    });

    it('should handle empty pattern', () => {
      expect(extractPathParams('', '/users/123')).toBeNull();
    });

    it('should handle pattern without parameters', () => {
      const result = extractPathParams('/users/list', '/users/list');
      expect(result).toEqual({});
    });
  });

  describe('buildUrl()', () => {
    it('should build URL with path parameters', () => {
      const result = buildUrl('/users/:id', { id: '123' });
      expect(result).toBe('/users/123');
    });

    it('should handle multiple parameters', () => {
      const result = buildUrl('/users/:id/posts/:postId', { id: '123', postId: '456' });
      expect(result).toBe('/users/123/posts/456');
    });

    it('should handle Next.js style parameters', () => {
      const result = buildUrl('/users/[id]', { id: '123' });
      expect(result).toBe('/users/123');
    });

    it('should leave unmatched parameters as-is', () => {
      const result = buildUrl('/users/:id/posts/:postId', { id: '123' });
      expect(result).toBe('/users/123/posts/:postId');
    });

    it('should handle numeric parameters', () => {
      const result = buildUrl('/users/:id', { id: 123 });
      expect(result).toBe('/users/123');
    });
  });

  describe('safeJsonParse()', () => {
    it('should parse valid JSON string', () => {
      const result = safeJsonParse('{"name":"John","age":30}');
      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('should parse JSON array', () => {
      const result = safeJsonParse('[1,2,3]');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should return default value on invalid JSON', () => {
      const result = safeJsonParse('invalid json', { default: true });
      expect(result).toEqual({ default: true });
    });

    it('should return undefined as default if not specified', () => {
      const result = safeJsonParse('invalid json');
      expect(result).toBeUndefined();
    });

    it('should handle empty string', () => {
      const result = safeJsonParse('', {});
      expect(result).toEqual({});
    });

    it('should parse JSON with nested objects', () => {
      const result = safeJsonParse('{"user":{"name":"John"},"items":[1,2]}');
      expect(result).toEqual({ user: { name: 'John' }, items: [1, 2] });
    });
  });

  describe('safeJsonStringify()', () => {
    it('should stringify object', () => {
      const result = safeJsonStringify({ name: 'John', age: 30 });
      expect(result).toBe('{"name":"John","age":30}');
    });

    it('should stringify array', () => {
      const result = safeJsonStringify([1, 2, 3]);
      expect(result).toBe('[1,2,3]');
    });

    it('should handle circular reference', () => {
      const obj: any = { name: 'Test' };
      obj.self = obj; // Circular reference
      
      const result = safeJsonStringify(obj);
      expect(result).toBe('{"name":"Test","self":"[Circular]"}');
    });

    it('should handle null input', () => {
      expect(safeJsonStringify(null)).toBe('null');
    });

    it('should handle undefined input', () => {
      expect(safeJsonStringify(undefined)).toBeUndefined();
    });

    it('should handle bigint values', () => {
      const result = safeJsonStringify({ value: BigInt(9007199254740991) });
      expect(result).toBe('{"value":"9007199254740991"}');
    });

    it('should use space parameter for formatting', () => {
      const result = safeJsonStringify({ name: 'John' }, 2);
      expect(result).toContain('\n');
      expect(result).toContain('  ');
    });
  });
});
