# Configuration

NodeSH can be configured via configuration files or `package.json`. On first run with `--yes`, it auto-generates appropriate configuration.

## Auto-Configuration

NodeSH automatically detects:

1. **Framework**: Express vs NestJS vs Next.js
2. **TypeScript**: Checks for `tsconfig.json`
3. **Entry Point**: Common locations like `src/app.js`, `src/main.ts`

## Configuration Files

NodeSH looks for configuration in this order:

1. `.nodesh.js`
2. `.nodesh.json`
3. `nodesh.config.js`
4. `package.json` under `"nodesh"` key

### JavaScript Config (.nodesh.js)

```javascript
module.exports = {
  // Path to your app entry file
  appEntry: 'src/app.js',
  
  // Directory paths
  modelsDir: 'src/models',
  servicesDir: 'src/services',
  helpersDir: 'src/helpers',
  configDir: 'src/config',
  
  // REPL settings
  prompt: 'myapp> ',
  useColors: true,
  historyFile: '~/.myapp_history',
  
  // Preload modules
  preload: [
    'dotenv/config',
    './src/database'
  ],
  
  // Custom context
  context: {
    moment: require('moment'),
    _: require('lodash'),
    customHelper: require('./src/custom-helper')
  },
  
  // Framework force options
  forceExpress: false  // Set true to skip NestJS/Next.js detection
};
```

### JSON Config (.nodesh.json)

```json
{
  "appEntry": "src/server.js",
  "modelsDir": "app/models",
  "servicesDir": "app/services",
  "prompt": "api> ",
  "useColors": true,
  "historyFile": "~/.nodesh_history"
}
```

### Package.json Config

```json
{
  "name": "my-app",
  "nodesh": {
    "appEntry": "dist/main.js",
    "modelsDir": "dist/models",
    "servicesDir": "dist/services",
    "prompt": "prod> ",
    "useColors": true
  }
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `appEntry` | `string` | `null` | Path to application entry file |
| `modelsDir` | `string` | `'models'` | Directory containing models |
| `servicesDir` | `string` | `'services'` | Directory containing services |
| `helpersDir` | `string` | `'helpers'` | Directory containing helpers |
| `configDir` | `string` | `'config'` | Directory containing config files |
| `prompt` | `string` | `'node> '` | REPL prompt string |
| `useColors` | `boolean` | `true` | Enable colored output |
| `useGlobal` | `boolean` | `true` | Use global context |
| `historyFile` | `string` | `~/.nodesh_history` | Path to history file |
| `preload` | `string[]` | `[]` | Modules to preload |
| `context` | `object` | `{}` | Additional context objects |
| `forceExpress` | `boolean` | `false` | Force Express mode |

## Environment-Specific Configuration

Use environment variables in your config:

```javascript
module.exports = {
  appEntry: process.env.NODE_ENV === 'production' 
    ? 'dist/main.js' 
    : 'src/app.ts',
  prompt: process.env.NODE_ENV === 'production' 
    ? 'prod> ' 
    : 'dev> ',
  context: {
    db: require(process.env.NODE_ENV === 'production' 
      ? './dist/database' 
      : './src/database')
  }
};
```

## CLI Options Override

CLI options take precedence over config files:

```bash
# Override entry point
nodesh --entry src/custom-app.js

# Override prompt
nodesh --prompt 'staging> '

# Disable colors
nodesh --no-color

# Set environment
nodesh --env production

# Force framework
nodesh --nestjs
nodesh --express
```

## Framework-Specific Notes

### Express

```javascript
// .nodesh.js for Express
module.exports = {
  appEntry: 'src/app.js',
  modelsDir: 'src/models',
  servicesDir: 'src/services',
  prompt: 'express> '
};
```

### NestJS

```javascript
// .nodesh.js for NestJS
module.exports = {
  appEntry: 'src/main.ts',
  modelsDir: 'src/models',
  servicesDir: 'src/services',
  prompt: 'nest> '
};
```

### Next.js

```javascript
// .nodesh.js for Next.js
module.exports = {
  appEntry: null,  // Next.js doesn't have a traditional entry
  modelsDir: 'src/models',
  servicesDir: 'src/services',
  prompt: 'next> '
};
```

## Debugging Configuration

To see what configuration is being used:

```javascript
// In the shell
node> .config
```

This displays the merged configuration from all sources.

## Best Practices

1. **Commit `.nodesh.js`** - Share configuration with your team
2. **Use relative paths** - Makes config portable
3. **Environment-specific** - Use env vars for different environments
4. **TypeScript projects** - Point to compiled files in production
