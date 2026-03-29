/**
 * Formatting utilities for NodeSH
 */

/**
 * Format a value for display in the console
 */
export function formatValue(value: unknown, maxLength = 500): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.slice(0, 5).map(v => formatValue(v, 50));
    const suffix = value.length > 5 ? `, ... (${value.length} items)` : '';
    return `[${items.join(', ')}${suffix}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    const items = entries.slice(0, 3).map(([k, v]) => `${k}: ${formatValue(v, 30)}`);
    const suffix = entries.length > 3 ? `, ... (${entries.length} keys)` : '';
    return `{${items.join(', ')}${suffix}}`;
  }
  if (typeof value === 'function') {
    const name = (value as { name?: string }).name || 'anonymous';
    return `[Function: ${name}]`;
  }
  return String(value);
}

/**
 * Truncate a string to a maximum length
 */
export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (str.length <= maxLength) return str;
  if (maxLength <= 0) return suffix;
  const sliceLength = Math.max(0, maxLength - suffix.length);
  return str.slice(0, sliceLength) + suffix;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format duration to human-readable string
 */
export function formatDuration(ms: number): string {
  const absMs = Math.abs(ms);
  const sign = ms < 0 ? '-' : '';
  if (absMs < 1000) return `${sign}${absMs}ms`;
  if (absMs < 60000) return `${sign}${(absMs / 1000).toFixed(2)}s`;
  const minutes = Math.floor(absMs / 60000);
  const seconds = ((absMs % 60000) / 1000).toFixed(2);
  return `${sign}${minutes}m ${seconds}s`;
}

/**
 * Format a table for console output
 */
export function formatTable(
  rows: Record<string, unknown>[],
  columns?: string[]
): string {
  if (rows.length === 0) return 'No data';
  
  const keys = columns || Object.keys(rows[0]);
  
  // Calculate column widths
  const widths: Record<string, number> = {};
  keys.forEach(key => {
    widths[key] = Math.max(
      key.length,
      ...rows.map(row => String(row[key] ?? '').length)
    );
  });
  
  // Build header
  const header = keys.map(k => k.padEnd(widths[k])).join(' | ');
  const separator = keys.map(k => '-'.repeat(widths[k])).join('-+-');
  
  // Build rows
  const dataRows = rows.map(row => 
    keys.map(k => String(row[k] ?? '').padEnd(widths[k])).join(' | ')
  );
  
  return [header, separator, ...dataRows].join('\n');
}
