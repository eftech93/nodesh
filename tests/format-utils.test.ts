/**
 * Unit tests for Format Utilities
 */

import {
  formatValue,
  truncate,
  formatBytes,
  formatDuration,
  formatTable,
} from '../src/utils/format-utils';

describe('Format Utilities', () => {
  describe('formatValue()', () => {
    it('should format string values', () => {
      expect(formatValue('hello')).toBe('"hello"');
    });

    it('should format number values', () => {
      expect(formatValue(42)).toBe('42');
    });

    it('should format boolean values', () => {
      expect(formatValue(true)).toBe('true');
    });

    it('should format null values', () => {
      expect(formatValue(null)).toBe('null');
    });

    it('should format undefined values', () => {
      expect(formatValue(undefined)).toBe('undefined');
    });

    it('should format object values as JSON', () => {
      const obj = { name: 'test', value: 123 };
      const result = formatValue(obj);
      expect(result).toContain('name: "test"');
      expect(result).toContain('value: 123');
    });

    it('should format array values', () => {
      const arr = [1, 2, 3];
      expect(formatValue(arr)).toBe('[1, 2, 3]');
    });
  });

  describe('truncate()', () => {
    it('should return string as-is if within limit', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('should truncate long strings', () => {
      expect(truncate('hello world', 8)).toBe('hello...');
    });

    it('should use custom suffix', () => {
      expect(truncate('hello world', 8, '…')).toBe('hello w…');
    });

    it('should handle empty string', () => {
      expect(truncate('', 5)).toBe('');
    });

    it('should handle limit of 0', () => {
      expect(truncate('hello', 0)).toBe('...');
    });

    it('should handle exact length match', () => {
      expect(truncate('hello', 5)).toBe('hello');
    });
  });

  describe('formatBytes()', () => {
    it('should format 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(formatBytes(512)).toBe('512 B');
    });

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(5242880)).toBe('5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('should format terabytes', () => {
      expect(formatBytes(1099511627776)).toBe('1 TB');
    });
  });

  describe('formatDuration()', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500ms');
      expect(formatDuration(999)).toBe('999ms');
    });

    it('should format seconds', () => {
      expect(formatDuration(1000)).toBe('1.00s');
      expect(formatDuration(5000)).toBe('5.00s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(60000)).toBe('1m 0.00s');
      expect(formatDuration(90000)).toBe('1m 30.00s');
      expect(formatDuration(125000)).toBe('2m 5.00s');
    });

    it('should handle 0', () => {
      expect(formatDuration(0)).toBe('0ms');
    });

    it('should handle negative values', () => {
      expect(formatDuration(-1000)).toBe('-1.00s');
    });
  });

  describe('formatTable()', () => {
    it('should format array of objects as table', () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ];

      const result = formatTable(data);
      
      expect(result).toContain('Alice');
      expect(result).toContain('Bob');
      expect(result).toContain('30');
      expect(result).toContain('25');
    });

    it('should handle empty array', () => {
      expect(formatTable([])).toBe('No data');
    });

    it('should handle single row', () => {
      const data = [{ name: 'Alice', age: 30 }];
      const result = formatTable(data);
      
      expect(result).toContain('Alice');
      expect(result).toContain('30');
    });

    it('should handle various data types', () => {
      const data = [
        { name: 'Test', count: 100, active: true, value: null },
      ];

      const result = formatTable(data);
      
      expect(result).toContain('Test');
      expect(result).toContain('100');
    });

    it('should handle objects with many keys', () => {
      const data = [
        { a: 1, b: 2, c: 3, d: 4, e: 5 },
      ];

      const result = formatTable(data);
      
      expect(result).toContain('a');
      expect(result).toContain('e');
    });

    it('should align columns', () => {
      const data = [
        { name: 'A', value: 1 },
        { name: 'Long Name', value: 1000 },
      ];

      const result = formatTable(data);
      const lines = result.split('\n');
      
      // Header and data rows should have consistent structure
      expect(lines.length).toBeGreaterThan(2);
    });
  });
});
