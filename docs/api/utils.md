# Utilities API

Formatting and utility functions.

## Format Utilities

### formatTable()

Formats an array of objects as a text table.

```typescript
function formatTable(
  data: Record<string, any>[],
  options?: {
    padding?: number;
    maxWidth?: number;
  }
): string
```

**Parameters:**
- `data` - Array of objects to format
- `options.padding` - Cell padding (default: 1)
- `options.maxWidth` - Maximum column width

**Returns:** Formatted table string

**Example:**

```typescript
import { formatTable } from '@eftech93/nodesh';

const data = [
  { name: 'User', count: 100, active: 85 },
  { name: 'Order', count: 500, active: 450 },
  { name: 'Product', count: 50, active: 48 }
];

console.log(formatTable(data));
// Output:
// ┌─────────┬───────┬────────┐
// │ name    │ count │ active │
// ├─────────┼───────┼────────┤
// │ User    │ 100   │ 85     │
// │ Order   │ 500   │ 450    │
// │ Product │ 50    │ 48     │
// └─────────┴───────┴────────┘
```

### formatBytes()

Formats bytes to human-readable format.

```typescript
function formatBytes(bytes: number, decimals?: number): string
```

**Parameters:**
- `bytes` - Number of bytes
- `decimals` - Decimal places (default: 2)

**Returns:** Formatted string

**Example:**

```typescript
import { formatBytes } from '@eftech93/nodesh';

formatBytes(1024);           // "1 KB"
formatBytes(1048576);        // "1 MB"
formatBytes(1073741824);     // "1 GB"
formatBytes(1536);           // "1.5 KB"
formatBytes(123456789, 1);   // "117.7 MB"
```

### formatDuration()

Formats milliseconds to human-readable duration.

```typescript
function formatDuration(ms: number): string
```

**Parameters:**
- `ms` - Milliseconds

**Returns:** Formatted string

**Example:**

```typescript
import { formatDuration } from '@eftech93/nodesh';

formatDuration(500);         // "500ms"
formatDuration(5000);        // "5.00s"
formatDuration(120000);      // "2m 0.00s"
formatDuration(3600000);     // "1h 0m 0.00s"
formatDuration(3661000);     // "1h 1m 1.00s"
```

## Request Utilities

### buildQueryString()

Builds a URL query string from an object.

```typescript
function buildQueryString(
  params: Record<string, string | number | boolean | undefined>
): string
```

**Parameters:**
- `params` - Query parameters

**Returns:** Query string (without leading `?`)

**Example:**

```typescript
import { buildQueryString } from '@eftech93/nodesh';

buildQueryString({ page: 1, limit: 10, active: true });
// Returns: "page=1&limit=10&active=true"

buildQueryString({ search: 'hello world' });
// Returns: "search=hello%20world"
```

### parseQueryString()

Parses a query string into an object.

```typescript
function parseQueryString(query: string): Record<string, string>
```

**Parameters:**
- `query` - Query string (with or without leading `?`)

**Returns:** Parsed parameters

**Example:**

```typescript
import { parseQueryString } from '@eftech93/nodesh';

parseQueryString('page=1&limit=10');
// Returns: { page: '1', limit: '10' }

parseQueryString('?search=hello%20world');
// Returns: { search: 'hello world' }
```

## String Utilities

### truncate()

Truncates a string to a specified length.

```typescript
function truncate(
  str: string,
  length: number,
  suffix?: string
): string
```

**Parameters:**
- `str` - String to truncate
- `length` - Maximum length
- `suffix` - Suffix to add (default: '...')

**Example:**

```typescript
import { truncate } from '@eftech93/nodesh';

truncate('This is a long string', 10);
// Returns: "This is a..."

truncate('This is a long string', 10, '…');
// Returns: "This is a…"
```

### camelCase()

Converts a string to camelCase.

```typescript
function camelCase(str: string): string
```

**Example:**

```typescript
import { camelCase } from '@eftech93/nodesh';

camelCase('foo bar');      // "fooBar"
camelCase('foo-bar');      // "fooBar"
camelCase('foo_bar');      // "fooBar"
camelCase('Foo Bar');      // "fooBar"
```

### kebabCase()

Converts a string to kebab-case.

```typescript
function kebabCase(str: string): string
```

**Example:**

```typescript
import { kebabCase } from '@eftech93/nodesh';

kebabCase('fooBar');       // "foo-bar"
kebabCase('foo bar');      // "foo-bar"
kebabCase('Foo Bar');      // "foo-bar"
```

### snakeCase()

Converts a string to snake_case.

```typescript
function snakeCase(str: string): string
```

**Example:**

```typescript
import { snakeCase } from '@eftech93/nodesh';

snakeCase('fooBar');       // "foo_bar"
snakeCase('foo bar');      // "foo_bar"
snakeCase('Foo Bar');      // "foo_bar"
```

## Array Utilities

### chunk()

Splits an array into chunks of specified size.

```typescript
function chunk<T>(array: T[], size: number): T[][]
```

**Example:**

```typescript
import { chunk } from '@eftech93/nodesh';

chunk([1, 2, 3, 4, 5, 6], 2);
// Returns: [[1, 2], [3, 4], [5, 6]]

chunk([1, 2, 3, 4, 5], 2);
// Returns: [[1, 2], [3, 4], [5]]
```

### uniq()

Returns unique values from an array.

```typescript
function uniq<T>(array: T[]): T[]
```

**Example:**

```typescript
import { uniq } from '@eftech93/nodesh';

uniq([1, 2, 2, 3, 3, 3]);
// Returns: [1, 2, 3]
```

### groupBy()

Groups array elements by a key function.

```typescript
function groupBy<T>(
  array: T[],
  keyFn: (item: T) => string
): Record<string, T[]>
```

**Example:**

```typescript
import { groupBy } from '@eftech93/nodesh';

const users = [
  { name: 'John', role: 'admin' },
  { name: 'Jane', role: 'user' },
  { name: 'Bob', role: 'user' }
];

groupBy(users, u => u.role);
// Returns:
// {
//   admin: [{ name: 'John', role: 'admin' }],
//   user: [
//     { name: 'Jane', role: 'user' },
//     { name: 'Bob', role: 'user' }
//   ]
// }
```

## Object Utilities

### pick()

Picks specified keys from an object.

```typescript
function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K>
```

**Example:**

```typescript
import { pick } from '@eftech93/nodesh';

const user = {
  id: 1,
  name: 'John',
  email: 'john@example.com',
  password: 'secret'
};

pick(user, ['id', 'name', 'email']);
// Returns: { id: 1, name: 'John', email: 'john@example.com' }
```

### omit()

Omits specified keys from an object.

```typescript
function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K>
```

**Example:**

```typescript
import { omit } from '@eftech93/nodesh';

const user = {
  id: 1,
  name: 'John',
  email: 'john@example.com',
  password: 'secret'
};

omit(user, ['password']);
// Returns: { id: 1, name: 'John', email: 'john@example.com' }
```

### deepClone()

Deep clones an object.

```typescript
function deepClone<T>(obj: T): T
```

**Example:**

```typescript
import { deepClone } from '@eftech93/nodesh';

const original = { user: { name: 'John', tags: ['a', 'b'] } };
const cloned = deepClone(original);

cloned.user.name = 'Jane';
console.log(original.user.name); // Still 'John'
```

## Complete Example

```typescript
import {
  formatTable,
  formatBytes,
  formatDuration,
  buildQueryString,
  camelCase,
  chunk,
  groupBy,
  pick
} from '@eftech93/nodesh';

// Format database stats
const stats = [
  { collection: 'users', documents: 1500, size: 1048576 },
  { collection: 'orders', documents: 5000, size: 5242880 },
  { collection: 'products', documents: 500, size: 512000 }
];

console.log(formatTable(stats));

// Format bytes
console.log(formatBytes(1048576)); // "1 MB"

// Format duration
console.log(formatDuration(1250)); // "1.25s"

// Build query string
const query = buildQueryString({
  page: 1,
  limit: 10,
  sort: 'createdAt'
});
// "page=1&limit=10&sort=createdAt"

// String transformation
console.log(camelCase('user-name')); // "userName"

// Array chunking
const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const batches = chunk(ids, 3);
// [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]

// Grouping
const users = [
  { name: 'John', status: 'active' },
  { name: 'Jane', status: 'inactive' },
  { name: 'Bob', status: 'active' }
];
const byStatus = groupBy(users, u => u.status);

// Pick fields
const user = {
  id: 1,
  name: 'John',
  email: 'john@example.com',
  password: 'secret',
  internal: 'data'
};
const publicFields = pick(user, ['id', 'name', 'email']);
```
