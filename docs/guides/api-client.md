# API Client Guide

NodeSH includes a built-in HTTP client for testing APIs directly from the console. This is useful for:

- Testing external APIs
- Testing your own application's endpoints
- Debugging API integrations
- Quick API exploration

## Basic Usage

### Setting Base URL

```javascript
// Set base URL for all requests
node> apiService.setBaseURL('https://api.example.com')

// Set default headers
node> apiService.setDefaultHeaders({
...   'Authorization': 'Bearer your-token-here',
...   'X-API-Key': 'your-api-key'
... })
```

### HTTP Methods

```javascript
// GET request
node> const users = await apiService.get('/users')

// GET with query params
node> const results = await apiService.get('/search', {
...   params: { q: 'nodejs', limit: 10 }
... })

// POST request
node> const newUser = await apiService.post('/users', {
...   name: 'John Doe',
...   email: 'john@example.com'
... })

// PUT request
node> const updated = await apiService.put('/users/1', {
...   name: 'Jane Doe'
... })

// PATCH request
node> const patched = await apiService.patch('/users/1', {
...   active: true
... })

// DELETE request
node> await apiService.delete('/users/1')
```

### Custom Options

```javascript
// Custom headers per request
node> const data = await apiService.get('/protected', {
...   headers: { 'Authorization': 'Bearer token123' }
... })

// Custom timeout
node> const data = await apiService.get('/slow-endpoint', {
...   timeout: 10000  // 10 seconds
... })

// Combine options
node> const data = await apiService.post('/upload', formData, {
...   headers: { 'Content-Type': 'multipart/form-data' },
...   timeout: 30000
... })
```

## Testing Local APIs

The `local()` method makes it easy to test your own application's endpoints:

```javascript
// GET request to local API
node> const users = await apiService.local('GET', '/users')

// GET with query params
node> const orders = await apiService.local('GET', '/orders', null, {
...   params: { status: 'pending', limit: 10 }
... })

// POST request
node> const newUser = await apiService.local('POST', '/users', {
...   name: 'John',
...   email: 'john@example.com'
... })

// PUT request
node> const updated = await apiService.local('PUT', '/users/123', {
...   name: 'Jane'
... })

// PATCH request
node> const patched = await apiService.local('PATCH', '/users/123', {
...   active: false
... })

// DELETE request
node> await apiService.local('DELETE', '/users/123')
```

### Local API Configuration

By default, `local()` uses `http://localhost:3000`. You can change this:

```bash
# Set via environment variable
export API_BASE_URL=http://localhost:8080
```

## Health Checks

Test if an endpoint is reachable:

```javascript
// Simple ping
node> await apiService.ping('https://api.example.com/health')
// => { success: true, latency: 45, status: 200 }

// Failed ping
node> await apiService.ping('https://offline.example.com')
// => { success: false, latency: 5000 }
```

## Examples

### Testing External API

```javascript
node> apiService.setBaseURL('https://jsonplaceholder.typicode.com')

node> const posts = await apiService.get('/posts?_limit=5')
node> const post = await apiService.get('/posts/1')
node> const newPost = await apiService.post('/posts', {
...   title: 'Test Post',
...   body: 'This is a test',
...   userId: 1
... })
```

### Testing Your NestJS API

```javascript
// Assuming your NestJS app runs on localhost:3000

// Create a user
node> const user = await apiService.local('POST', '/users', {
...   email: 'test@example.com',
...   password: 'password123',
...   name: { first: 'Test', last: 'User' }
... })

// Get the created user
node> const found = await apiService.local('GET', `/users/${user._id}`)

// Create an order for the user
node> const order = await apiService.local('POST', '/orders', {
...   userId: user._id,
...   items: [
...     { productId: 'prod1', quantity: 2, price: 29.99 }
...   ]
... })

// Check cache stats
node> const cacheStats = await apiService.local('GET', '/cache/stats')
```

### Batch API Requests

```javascript
// Fetch multiple users in parallel
node> const userIds = ['1', '2', '3', '4', '5']
node> const users = await Promise.all(
...   userIds.map(id => apiService.get(`/users/${id}`))
... )

// Or with local API
node> const users = await Promise.all(
...   userIds.map(id => apiService.local('GET', `/users/${id}`))
... )
```

## Error Handling

```javascript
node> try {
...   const user = await apiService.get('/users/999')
... } catch (error) {
...   console.error('Request failed:', error.message)
...   if (error.response) {
...     console.error('Status:', error.response.status)
...     console.error('Data:', error.response.data)
...   }
... }
```

## API Reference

### Methods

| Method | Description |
|--------|-------------|
| `setBaseURL(url)` | Set base URL for all requests |
| `setDefaultHeaders(headers)` | Set default headers for all requests |
| `get(url, options?)` | Make GET request |
| `post(url, data?, options?)` | Make POST request |
| `put(url, data?, options?)` | Make PUT request |
| `patch(url, data?, options?)` | Make PATCH request |
| `delete(url, options?)` | Make DELETE request |
| `ping(url)` | Test connectivity to endpoint |
| `local(method, path, data?, options?)` | Make request to local API |

### Options

```typescript
interface ApiRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
}
```

## Tips

1. **Use `local()` for testing your own API** - It automatically handles the base URL
2. **Set default headers for authentication** - Avoid repeating auth headers
3. **Use `ping()` for health checks** - Quick way to test connectivity
4. **Handle errors gracefully** - Always wrap requests in try-catch for production APIs
