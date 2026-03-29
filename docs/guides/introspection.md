# Object Introspection

NodeSH provides powerful introspection helpers to explore objects at runtime.

## Built-in Helpers

| Helper | Description | Example Output |
|--------|-------------|----------------|
| `info(obj)` | Detailed metadata about an object | `{ name, type, constructor, properties }` |
| `methods(obj)` | List all methods of an object | `['create', 'findById', ...]` |
| `props(obj)` | List all non-method properties | `['name', 'config', ...]` |
| `type(obj)` | Get the type of any value | `'UserService'`, `'string'`, `'Array'` |

## info() - Object Information

Get comprehensive information about any object:

```javascript
node> info(userService)
{
  name: 'userService',
  type: 'UserService',
  constructor: 'UserService',
  properties: [
    { name: 'name', type: 'string', isMethod: false },
    { name: 'create', type: 'Function', isMethod: true, isAsync: true },
    { name: 'findById', type: 'Function', isMethod: true, isAsync: true },
    { name: 'update', type: 'Function', isMethod: true, isAsync: true }
  ],
  prototypeChain: ['UserService', 'BaseService', 'Object']
}
```

### With String Key

```javascript
node> info('config')
{
  name: 'config',
  type: 'Object',
  properties: [
    { name: 'env', type: 'string', isMethod: false },
    { name: 'port', type: 'number', isMethod: false },
    { name: 'database', type: 'Object', isMethod: false }
  ]
}
```

## methods() - List Methods

Get all methods of an object:

```javascript
node> methods(userService)
[
  'create',
  'findById',
  'findByEmail',
  'findActive',
  'update',
  'delete',
  'authenticate',
  'getStats',
  'clearCache'
]

// On models
node> methods(User)
[
  'find',
  'findOne',
  'findById',
  'create',
  'updateOne',
  'deleteOne',
  'countDocuments'
]
```

## props() - List Properties

Get all non-method properties:

```javascript
node> props(config)
['env', 'port', 'database', 'redis', 'jwt']

node> props(userService)
['name']
```

## type() - Get Type

Determine the type of any value:

```javascript
node> type('hello')
'string'

node> type(123)
'number'

node> type(true)
'boolean'

node> type([])
'Array'

node> type({})
'Object'

node> type(new Date())
'Date'

node> type(/regex/)
'RegExp'

node> type(userService)
'UserService'

node> type(null)
'null'

node> type(undefined)
'undefined'
```

## Practical Examples

### Discover Service Capabilities

```javascript
node> methods(userService)
// See what operations are available

node> userService.create({
...   email: 'test@test.com',
...   password: 'secret'
... })
```

### Inspect Configuration

```javascript
node> props(config)
['env', 'port', 'database', 'redis']

node> config.database
{
  url: 'mongodb://localhost:27017/myapp',
  host: 'localhost',
  port: 27017
}
```

### Debug Object Structure

```javascript
node> const result = await User.findOne()
node> info(result)
{
  type: 'model',
  properties: ['_id', 'email', 'name', 'createdAt', ...]
}

node> type(result._id)
'ObjectId'
```

### Check Method Signatures

```javascript
node> info(userService).properties
  .filter(p => p.isMethod)
  .map(p => p.name)
['create', 'findById', 'update', 'delete']
```

## Using Introspection in Code

You can also use these helpers programmatically:

```typescript
import { addIntrospectionMethods } from '@eftech93/nodesh';

const context = {
  userService: new UserService()
};

// Add introspection helpers
addIntrospectionMethods(context);

// Now context has info, methods, props, type
const metadata = context.info('userService');
console.log(metadata.methods);
```

## Introspection with Custom REPL

```typescript
import { addIntrospectionMethods } from '@eftech93/nodesh';
import repl from 'repl';

const replServer = repl.start({ prompt: '> ' });

// Add to context
addIntrospectionMethods(replServer.context);

// Now available in REPL
Object.assign(replServer.context, {
  myService: new MyService()
});
```

## Advanced Usage

### Filter Methods by Pattern

```javascript
node> methods(userService).filter(m => m.includes('find'))
['findById', 'findByEmail', 'findActive']
```

### Get Async Methods Only

```javascript
node> info(userService).properties
  .filter(p => p.isMethod && p.isAsync)
  .map(p => p.name)
['create', 'findById', 'update', 'delete']
```

### Compare Objects

```javascript
node> const userMethods = methods(userService)
node> const orderMethods = methods(orderService)
node> userMethods.filter(m => !orderMethods.includes(m))
['authenticate', 'clearCache']
```

## Tips

1. **Use `info()` for overview** - Quick way to understand any object
2. **Use `methods()` for operations** - See what you can do with an object
3. **Use `props()` for data** - View available data properties
4. **Use `type()` for debugging** - Confirm object types
5. **Chain with array methods** - Filter, map results for analysis
