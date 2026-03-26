/**
 * Express Console - Rails-like console for Express.js
 * 
 * @example
 *   import { ExpressConsole } from 'express-console';
 *   
 *   const console = new ExpressConsole({
 *     rootPath: __dirname,
 *     appEntry: 'app.js'
 *   });
 *   
 *   await console.start();
 */

export { ExpressConsole } from './console';
export { AppLoader } from './loader';
export { NestJSLoader } from './nestjs-loader';
export { loadConfig, generateConfig, CONFIG_FILES } from './config';
export { IntelligentCompleter, createCompleter, addIntrospectionMethods } from './autocomplete';
export * from './types';
