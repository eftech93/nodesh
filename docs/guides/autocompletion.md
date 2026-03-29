# Intelligent Autocompletion

NodeSH provides intelligent tab autocompletion for exploring your application's objects, methods, and properties.

## Features

- **Property Completion**: Complete object properties and methods
- **Deep Nesting**: Complete nested properties like `config.database.url`
- **Method Detection**: Distinguishes methods from properties
- **Static Methods**: Complete static methods on classes
- **Prototype Chain**: Discovers inherited methods
- **Partial Matching**: Type a few letters and tab complete

## Basic Usage

Press `TAB` at any time to see completions:

```javascript
// Complete top-level context
node> <TAB>
// Shows: User, Order, userService, orderService, config, db, ...

// Complete with prefix
node> user<TAB>
// Shows: userService, User
```

## Property Completion

### Instance Properties

```javascript
node> userService.<TAB>
// Shows: 
//   create()       findById()     findByEmail()
//   findActive()   update()       delete()
//   authenticate() getStats()     clearCache()
//   name
```

### Static Methods

```javascript
node> User.<TAB>
// Shows:
//   find()         findOne()      findById()
//   create()       updateOne()    deleteOne()
//   countDocuments() exists()     aggregate()
```

### Nested Properties

```javascript
node> config.<TAB>
// Shows: env, port, database, redis, jwt

node> config.database.<TAB>
// Shows: url, host, port, name, options

node> config.database.options.<TAB>
// Shows: useNewUrlParser, useUnifiedTopology, ...
```

## Partial Completion

Type part of a name and press `TAB`:

```javascript
node> userService.find<TAB>
// Shows: findById, findByEmail, findActive

node> userService.findB<TAB>
// Completes to: findBy
// Shows: findById, findByEmail
```

## Bracket Notation

Complete string keys with bracket notation:

```javascript
node> config['<TAB>
// Shows: 'env', 'port', 'database'

node> config['data<TAB>
// Completes to: config['database'
```

## Array Methods

When completing arrays, standard methods are available:

```javascript
node> users.<TAB>
// Shows: map(), filter(), reduce(), forEach(), find(), ...
```

## Prototype Chain

Methods from parent classes are discovered:

```javascript
class BaseService {
  async findAll() { }
  async findById(id) { }
}

class UserService extends BaseService {
  async findByEmail(email) { }
}

node> userService.<TAB>
// Shows: findAll(), findById(), findByEmail()
```

## Autocompletion in Action

### Exploring a Service

```javascript
node> userService.<TAB><TAB>
create              findById            findByEmail
findActive          update              delete
authenticate        getStats            clearCache
name

node> userService.create({
...   email: 'test@example.com',
...   name: 'Test User'
... })
```

### Chaining Methods

```javascript
node> users = await User.find()
node> users.filter(u => u.isActive).<TAB>
// Shows: map(), filter(), forEach(), length, ...

node> users.filter(u => u.isActive).map(u => u.email)
```

### Configuration Exploration

```javascript
node> config.<TAB><TAB>
env                 port                database
redis               jwt

node> config.database.<TAB><TAB>
url                 host                port
name                options

node> config.database.url
'mongodb://localhost:27017/myapp'
```

## Programmatic API

You can use the autocompleter in your own code:

```typescript
import { IntelligentCompleter } from '@eftech93/nodesh';

const context = {
  userService: new UserService(),
  orderService: new OrderService()
};

const completer = new IntelligentCompleter(context);

// Get completions
const [completions] = completer.complete('userService.find');
console.log(completions); 
// ['findById()', 'findByEmail()', 'findActive()']

// Get metadata
const metadata = completer.introspect('userService');
console.log(metadata.methods);
```

## Creating a Custom Completer

```typescript
import { createCompleter } from '@eftech93/nodesh';
import repl from 'repl';

const context = {
  myService: new MyService()
};

const replServer = repl.start({
  prompt: 'myapp> ',
  completer: createCompleter(context)
});

Object.assign(replServer.context, context);
```

## Tips

1. **Double TAB**: Press TAB twice to see all completions
2. **Case Sensitive**: Completion respects case
3. **Private Methods**: Methods starting with `_` are included
4. **Symbols**: Symbol properties are shown with bracket notation
5. **Async Methods**: Async functions are marked with `async` in metadata
