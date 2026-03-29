/**
 * NodeSH Console Helpers - Main export file
 * Re-exports from console-helpers for backward compatibility
 * 
 * All exports from this file are automatically added to the NodeSH console context
 */

// Re-export everything from console-helpers (these will be in the context)
export * from './console-helpers';

// Re-export from library for convenience
export {
  // Core helpers from NodeSH library
  run,
  batch,
  execAction,
  http,
  nextFetch,
  debugApi,
  callNextRoute,
  importServerActions,
  createNextAppRouterRequest,
  // New API helpers from library
  api,
  apiHttp,
  nextApi,
} from '@eftech93/nodesh';
