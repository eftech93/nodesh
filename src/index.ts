/**
 * NodeSH - Interactive shell for Node.js applications
 * 
 * Works with Express, NestJS, and Next.js
 * 
 * @example
 *   import { ExpressConsole } from '@eftech93/nodesh';
 *   
 *   const console = new ExpressConsole({
 *     rootPath: __dirname,
 *     appEntry: 'app.js'
 *   });
 *   
 *   await console.start();
 */

// Core exports
export { ExpressConsole } from './console';
export { AppLoader } from './loader';
export { NestJSLoader } from './nestjs-loader';
export { NextJSLoader } from './nextjs-loader';

// Config exports
export { loadConfig, generateConfig, CONFIG_FILES } from './config';

// Autocomplete exports
export { IntelligentCompleter, createCompleter, addIntrospectionMethods } from './autocomplete';

// Database exports
export * from './database';

// Helpers exports
export * from './helpers';

// Utils exports
export * from './utils';

// Types exports
export * from './types';
