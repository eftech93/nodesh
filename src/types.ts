/**
 * Type definitions for express-console
 */

import { Application as ExpressApplication } from 'express';
import { INestApplication } from '@nestjs/common';
import { REPLServer } from 'repl';

export interface ExpressConsoleOptions {
  /** Project root directory path */
  rootPath?: string;
  
  /** Path to Express app entry file */
  appEntry?: string;
  
  /** Directory containing models */
  modelsDir?: string;
  
  /** Directory containing services */
  servicesDir?: string;
  
  /** Directory containing helpers */
  helpersDir?: string;
  
  /** Directory containing configuration files */
  configDir?: string;
  
  /** REPL prompt string */
  prompt?: string;
  
  /** Enable colored output */
  useColors?: boolean;
  
  /** Use global context */
  useGlobal?: boolean;
  
  /** Path to history file */
  historyFile?: string | null;
  
  /** Additional files to preload */
  preload?: string[];
  
  /** Custom context to add to REPL */
  context?: Record<string, unknown>;

  /** Force Express mode (skip NestJS detection) */
  forceExpress?: boolean;
}

export interface AppLoaderOptions {
  rootPath?: string;
  config?: ExpressConsoleOptions;
}

export interface RouteInfo {
  path: string;
  methods: string[];
}

export interface LoadedContext {
  [key: string]: unknown;
  app?: ExpressApplication | INestApplication;
  expressApp?: ExpressApplication;
  nestApp?: INestApplication;
  config?: Record<string, unknown>;
  env?: NodeJS.ProcessEnv;
  NODE_ENV?: string;
  routes?: RouteInfo[];
}

export interface ConfigResult {
  rootPath: string;
  appEntry: string | null;
  modelsDir: string;
  servicesDir: string;
  helpersDir: string;
  configDir: string;
  prompt: string;
  useColors: boolean;
  historyFile: string | null;
  preload: string[];
  context: Record<string, unknown>;
  forceExpress?: boolean;
}

export type ModuleCallback = (name: string, module: unknown) => void;

export interface ConsoleCommand {
  help: string;
  action(this: REPLServer): void;
}

// Extend REPLServer to include history
declare module 'repl' {
  interface REPLServer {
    history: string[];
  }
}

// Define CompleterResult type
export type CompleterResult = [string[], string];

/**
 * Property information for intelligent autocomplete
 */
export interface PropertyInfo {
  name: string;
  type: string;
  value?: unknown;
  isMethod: boolean;
  isStatic: boolean;
  isInherited: boolean;
  description?: string;
}

/**
 * Object metadata for introspection
 */
export interface ObjectMetadata {
  name: string;
  type: string;
  constructor?: string;
  properties: PropertyInfo[];
  staticProperties: PropertyInfo[];
  prototypeChain: string[];
}
