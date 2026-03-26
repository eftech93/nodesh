/**
 * Configuration resolver for node-console
 */
import * as fs from 'fs';
import * as path from 'path';
import { ConfigResult } from './types';

export const CONFIG_FILES: string[] = [
  '.node-console.js',
  '.node-console.json',
  'node-console.config.js'
];

/**
 * Load configuration from various sources
 */
export function loadConfig(rootPath: string = process.cwd()): ConfigResult {
  const defaults: Partial<ConfigResult> = {
    rootPath,
    appEntry: null,
    modelsDir: 'models',
    servicesDir: 'services',
    helpersDir: 'helpers',
    configDir: 'config',
    prompt: 'node> ',
    useColors: true,
    historyFile: null,
    preload: [],
    context: {}
  };

  let config: Partial<ConfigResult> = { ...defaults };
  let configFileLoaded = false;

  // Check package.json for nodeConsole config first (lower priority)
  const packageJsonPath = path.join(rootPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.nodeConsole) {
        config = { ...config, ...packageJson.nodeConsole };
      }
    } catch (err) {
      // Ignore package.json errors
    }
  }

  // Try to load from config files (higher priority, overrides package.json)
  for (const configFile of CONFIG_FILES) {
    const configPath = path.join(rootPath, configFile);
    
    if (fs.existsSync(configPath)) {
      try {
        // Use absolute path for require
        const absolutePath = path.resolve(configPath);
        delete require.cache[require.resolve(absolutePath)];
        const fileConfig = require(absolutePath);
        config = { ...defaults, ...fileConfig.default, ...fileConfig };
        configFileLoaded = true;
        break;
      } catch (err) {
        console.warn(`Warning: Could not load config from ${configFile}`);
        // Reset to defaults on error to avoid stale values from package.json
        config = { ...defaults };
      }
    }
  }

  return config as ConfigResult;
}

/**
 * Generate default config file
 */
export function generateConfig(rootPath: string = process.cwd()): { created: boolean; path: string } {
  const configPath = path.join(rootPath, '.node-console.js');
  
  if (fs.existsSync(configPath)) {
    return { created: false, path: configPath };
  }

  const template = `/**
 * Node Console Configuration
 * 
 * This file configures the behavior of the node-console REPL.
 * 
 * @see https://github.com/yourusername/node-console
 */

module.exports = {
  // Path to your app entry file
  // If not specified, will try: app.js, server.js, index.js
  appEntry: 'app.js',

  // Directories to load (relative to project root)
  modelsDir: 'models',
  servicesDir: 'services',
  helpersDir: 'helpers',
  configDir: 'config',

  // REPL configuration
  prompt: 'node> ',
  useColors: true,
  
  // History file (null for default: ~/.node_console_history)
  historyFile: null,

  // Additional files to preload
  preload: [
    // './path/to/custom-module.js'
  ],

  // Custom context to add to REPL
  // These will be available as variables in the console
  context: {
    // db: require('./db'),
    // redis: require('./redis')
  }
};
`;

  fs.writeFileSync(configPath, template);
  return { created: true, path: configPath };
}
