/**
 * Intelligent Autocomplete Module for Node Console
 * 
 * Provides deep property and method completion by analyzing:
 * - Object instance properties and methods
 * - Class static methods and properties
 * - Prototype chain inheritance
 * - Dynamic property access patterns
 */

import { CompleterResult, PropertyInfo, ObjectMetadata } from './types';

export { PropertyInfo, ObjectMetadata };

/**
 * Intelligent completer that provides deep property suggestions
 */
export class IntelligentCompleter {
  private context: Record<string, unknown>;
  private cache: Map<unknown, ObjectMetadata>;
  private maxDepth: number;

  constructor(context: Record<string, unknown>, maxDepth: number = 3) {
    this.context = context;
    this.cache = new Map();
    this.maxDepth = maxDepth;
  }

  /**
   * Update the context reference
   */
  updateContext(context: Record<string, unknown>): void {
    this.context = context;
    this.cache.clear();
  }

  /**
   * Main completion entry point
   */
  complete(line: string): CompleterResult {
    const trimmedLine = line.trim();

    // Handle empty line - show all top-level context
    if (!trimmedLine) {
      const allKeys = this.getAllTopLevelKeys();
      return [allKeys, line];
    }

    // Check for property access patterns (obj.prop or obj['prop'])
    const propertyMatch = this.parsePropertyAccess(trimmedLine);
    if (propertyMatch) {
      return this.completePropertyAccess(propertyMatch, line);
    }

    // Check for bracket notation (obj[')
    const bracketMatch = trimmedLine.match(/^(.*?)(?:\['?([^'\]]*)'?)$/);
    if (bracketMatch) {
      return this.completeBracketAccess(bracketMatch, line);
    }

    // Check for method call chain (obj.method().prop)
    const chainMatch = this.parseChainAccess(trimmedLine);
    if (chainMatch) {
      return this.completeChainAccess(chainMatch, line);
    }

    // Default: complete from top-level context
    return this.completeTopLevel(trimmedLine, line);
  }

  /**
   * Parse property access patterns like: obj.prop, obj.prop.nested, obj?.prop
   */
  private parsePropertyAccess(line: string): { object: string; partial: string } | null {
    // Match patterns like: obj.prop, obj.nested.prop, obj?.prop (optional chaining)
    const match = line.match(/^(.*?)(?:\?\.)?\.([a-zA-Z_$][a-zA-Z0-9_$]*)?$/);
    if (match) {
      return {
        object: match[1],
        partial: match[2] || ''
      };
    }
    return null;
  }

  /**
   * Parse method chain patterns like: obj.method().prop or obj.prop.method()
   */
  private parseChainAccess(line: string): { chain: string; partial: string } | null {
    // Match patterns with method calls: obj.method().prop, obj.getData().items
    const chainMatch = line.match(/^(.*\(\))\.([a-zA-Z_$][a-zA-Z0-9_$]*)?$/);
    if (chainMatch) {
      return {
        chain: chainMatch[1],
        partial: chainMatch[2] || ''
      };
    }
    return null;
  }

  /**
   * Complete property access like obj.prop or obj.nested.prop
   */
  private completePropertyAccess(
    match: { object: string; partial: string }, 
    originalLine: string
  ): CompleterResult {
    const { object: objectExpr, partial } = match;

    try {
      // Try to evaluate the object expression to get the actual object
      const obj = this.evaluateExpression(objectExpr);
      
      if (obj === null || obj === undefined) {
        return [[], originalLine];
      }

      // Get all available properties
      const properties = this.getAllProperties(obj);
      
      // Filter by partial match
      const matches = properties
        .filter(p => p.name.startsWith(partial))
        .map(p => this.formatPropertyCompletion(p));

      return [matches, partial];
    } catch (err) {
      // Fall back to showing what we can determine statically
      return this.completeFromMetadata(objectExpr, partial, originalLine);
    }
  }

  /**
   * Complete bracket notation like obj['prop'] or obj["prop"]
   */
  private completeBracketAccess(
    match: RegExpMatchArray,
    originalLine: string
  ): CompleterResult {
    const objectExpr = match[1].trim();
    const partial = match[2] || '';

    try {
      const obj = this.evaluateExpression(objectExpr);
      
      if (obj === null || obj === undefined) {
        return [[], originalLine];
      }

      // For bracket notation, we suggest string property names
      const properties = this.getAllProperties(obj);
      const matches = properties
        .filter(p => p.name.includes(partial))
        .map(p => `'${p.name}'`);

      return [matches, partial];
    } catch (err) {
      return [[], originalLine];
    }
  }

  /**
   * Complete chain access like obj.method().prop
   */
  private completeChainAccess(
    match: { chain: string; partial: string },
    originalLine: string
  ): CompleterResult {
    // For now, we can't easily evaluate method chains without executing them
    // So we provide generic completions based on common patterns
    const commonChainMethods = [
      'then', 'catch', 'finally',
      'map', 'filter', 'reduce', 'forEach', 'find', 'some', 'every',
      'toString', 'valueOf', 'length', 'name', 'constructor',
      'keys', 'values', 'entries'
    ];

    const matches = commonChainMethods
      .filter(m => m.startsWith(match.partial))
      .map(m => m);

    return [matches, match.partial];
  }

  /**
   * Complete top-level context keys
   */
  private completeTopLevel(partial: string, originalLine: string): CompleterResult {
    const allKeys = this.getAllTopLevelKeys();
    const matches = allKeys.filter(k => k.startsWith(partial));
    return [matches, partial];
  }

  /**
   * Get all top-level keys including context and common globals
   */
  private getAllTopLevelKeys(): string[] {
    const contextKeys = Object.keys(this.context);
    
    // Common JavaScript globals that might be useful
    const commonGlobals = [
      'console', 'process', 'Buffer', 'Array', 'Object', 'String', 'Number',
      'Date', 'RegExp', 'Error', 'Promise', 'Set', 'Map', 'JSON', 'Math',
      'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURI', 'decodeURI',
      'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
      'require', 'module', 'exports', '__dirname', '__filename'
    ];

    // Context-specific common completions
    const contextCompletions: string[] = [];
    
    // If we have models, add common model methods
    const hasModels = contextKeys.some(k => 
      this.isModelLike(this.context[k])
    );
    if (hasModels) {
      contextCompletions.push(
        'find', 'findOne', 'findById', 'findAll', 'create', 
        'update', 'updateOne', 'delete', 'destroy', 'remove',
        'count', 'exists', 'distinct', 'aggregate'
      );
    }

    // If we have services, add common service methods
    const hasServices = contextKeys.some(k => 
      this.isServiceLike(this.context[k])
    );
    if (hasServices) {
      contextCompletions.push(
        'get', 'getAll', 'getById', 'getOne', 'findById',
        'create', 'update', 'delete', 'remove', 'save'
      );
    }

    return [...new Set([...contextKeys, ...commonGlobals, ...contextCompletions])];
  }

  /**
   * Evaluate an expression to get its value
   * Safely evaluates expressions in the context
   */
  private evaluateExpression(expr: string): unknown {
    // Direct variable lookup
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(expr)) {
      return this.context[expr];
    }

    // Try to evaluate nested property access safely
    try {
      // Create a safe evaluation context
      const evalContext = { ...this.context };
      const keys = Object.keys(evalContext);
      const values = Object.values(evalContext);
      
      // Use Function constructor for safer evaluation
      const fn = new Function(...keys, `return ${expr}`);
      return fn(...values);
    } catch (err) {
      // If evaluation fails, try simple parsing
      return this.parseSimpleExpression(expr);
    }
  }

  /**
   * Parse simple expressions without full evaluation
   */
  private parseSimpleExpression(expr: string): unknown {
    const parts = expr.split('.');
    let current: unknown = this.context[parts[0]];

    for (let i = 1; i < parts.length && current != null; i++) {
      const part = parts[i];
      if (typeof current === 'object' && current !== null) {
        current = (current as Record<string, unknown>)[part];
      } else if (typeof current === 'function') {
        // For functions, look at prototype
        const fn = current as { prototype?: Record<string, unknown> };
        current = fn.prototype?.[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Get all properties of an object including inherited ones
   */
  private getAllProperties(obj: unknown): PropertyInfo[] {
    if (obj === null || obj === undefined) {
      return [];
    }

    const properties: PropertyInfo[] = [];
    const seen = new Set<string>();

    // Get own properties
    this.collectProperties(obj, properties, seen, false);

    // Walk the prototype chain
    let prototype = Object.getPrototypeOf(obj);
    let isInherited = false;
    
    while (prototype !== null && prototype !== Object.prototype) {
      this.collectPropertiesFromPrototype(prototype, properties, seen, isInherited);
      prototype = Object.getPrototypeOf(prototype);
      isInherited = true;
    }

    return properties;
  }

  /**
   * Collect properties from an object instance
   */
  private collectProperties(
    obj: unknown,
    properties: PropertyInfo[],
    seen: Set<string>,
    isInherited: boolean
  ): void {
    if (obj === null || obj === undefined) return;

    const objType = typeof obj;

    if (objType === 'function') {
      // For functions, collect static properties
      this.collectStaticProperties(obj as Record<string, unknown>, properties, seen);
      
      // And prototype methods
      const fn = obj as { prototype?: Record<string, unknown> };
      if (fn.prototype) {
        this.collectPropertiesFromPrototype(fn.prototype, properties, seen, false);
      }
    } else if (objType === 'object') {
      // For objects, collect own properties
      const descriptors = Object.getOwnPropertyDescriptors(obj);
      
      for (const [name, descriptor] of Object.entries(descriptors)) {
        if (seen.has(name)) continue;
        seen.add(name);

        let value: unknown;
        try {
          value = (obj as Record<string, unknown>)[name];
        } catch (e) {
          value = undefined;
        }

        properties.push({
          name,
          type: this.getTypeName(value),
          value,
          isMethod: typeof value === 'function',
          isStatic: false,
          isInherited
        });
      }
    }
  }

  /**
   * Collect properties from a prototype object
   */
  private collectPropertiesFromPrototype(
    prototype: Record<string, unknown> | null,
    properties: PropertyInfo[],
    seen: Set<string>,
    isInherited: boolean
  ): void {
    if (!prototype || prototype === Object.prototype) return;

    const descriptors = Object.getOwnPropertyDescriptors(prototype);
    
    for (const [name, descriptor] of Object.entries(descriptors)) {
      if (seen.has(name) || name === 'constructor') continue;
      seen.add(name);

      let value: unknown;
      try {
        value = prototype[name];
      } catch (e) {
        value = undefined;
      }

      properties.push({
        name,
        type: this.getTypeName(value),
        value,
        isMethod: typeof value === 'function',
        isStatic: false,
        isInherited
      });
    }
  }

  /**
   * Collect static properties from a class/function
   */
  private collectStaticProperties(
    fn: Record<string, unknown>,
    properties: PropertyInfo[],
    seen: Set<string>
  ): void {
    const descriptors = Object.getOwnPropertyDescriptors(fn);
    
    for (const [name, descriptor] of Object.entries(descriptors)) {
      if (seen.has(name) || name === 'length' || name === 'name' || name === 'prototype') continue;
      seen.add(name);

      let value: unknown;
      try {
        value = fn[name];
      } catch (e) {
        value = undefined;
      }

      properties.push({
        name,
        type: this.getTypeName(value),
        value,
        isMethod: typeof value === 'function',
        isStatic: true,
        isInherited: false
      });
    }
  }

  /**
   * Complete properties from metadata when we can't evaluate
   */
  private completeFromMetadata(
    objectExpr: string,
    partial: string,
    originalLine: string
  ): CompleterResult {
    // Try to find the base object in context
    const baseName = objectExpr.split(/\.|\['?/)[0];
    const baseObj = this.context[baseName];

    if (!baseObj) {
      return [[], originalLine];
    }

    // Get metadata for the base object
    const metadata = this.getObjectMetadata(baseObj, baseName);
    if (!metadata) {
      return [[], originalLine];
    }

    // Find the nested property path
    const path = objectExpr.slice(baseName.length).split(/\.|\['?|'?\]/).filter(Boolean);
    
    let currentMetadata: ObjectMetadata | null = metadata;
    for (const prop of path) {
      if (!currentMetadata) break;
      const propInfo = currentMetadata.properties.find(p => p.name === prop);
      if (!propInfo || !propInfo.value) {
        return [[], originalLine];
      }
      currentMetadata = this.getObjectMetadata(propInfo.value, prop);
    }

    if (!currentMetadata) {
      return [[], originalLine];
    }

    // Filter properties by partial match
    const matches = currentMetadata.properties
      .filter(p => p.name.startsWith(partial))
      .map(p => this.formatPropertyCompletion(p));

    return [matches, partial];
  }

  /**
   * Get metadata for an object
   */
  getObjectMetadata(obj: unknown, name: string): ObjectMetadata | null {
    if (this.cache.has(obj)) {
      return this.cache.get(obj)!;
    }

    const metadata: ObjectMetadata = {
      name,
      type: this.getTypeName(obj),
      constructor: this.getConstructorName(obj),
      properties: this.getAllProperties(obj),
      staticProperties: typeof obj === 'function' 
        ? this.getAllProperties(obj).filter(p => p.isStatic)
        : [],
      prototypeChain: this.getPrototypeChain(obj)
    };

    this.cache.set(obj, metadata);
    return metadata;
  }

  /**
   * Get the prototype chain as an array of class names
   */
  private getPrototypeChain(obj: unknown): string[] {
    const chain: string[] = [];
    let current = Object.getPrototypeOf(obj);
    
    while (current !== null && current !== Object.prototype) {
      const constructor = current.constructor;
      if (constructor && constructor.name) {
        chain.push(constructor.name);
      }
      current = Object.getPrototypeOf(current);
    }

    return chain;
  }

  /**
   * Get the constructor name of an object
   */
  private getConstructorName(obj: unknown): string | undefined {
    if (obj === null || obj === undefined) return undefined;
    
    if (typeof obj === 'function') {
      return (obj as { name?: string }).name || 'Function';
    }

    const constructor = (obj as { constructor?: { name?: string } }).constructor;
    return constructor?.name;
  }

  /**
   * Get a human-readable type name
   */
  getTypeName(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    const type = typeof value;
    
    if (type === 'object') {
      const constructor = (value as { constructor?: { name?: string } }).constructor;
      const name = constructor?.name;
      if (name && name !== 'Object') {
        return name;
      }
      
      if (Array.isArray(value)) {
        return 'Array';
      }
      
      if (value instanceof Date) return 'Date';
      if (value instanceof RegExp) return 'RegExp';
      if (value instanceof Error) return 'Error';
      if (value instanceof Map) return 'Map';
      if (value instanceof Set) return 'Set';
      if (value instanceof Promise) return 'Promise';
      
      return 'Object';
    }
    
    if (type === 'function') {
      const fnName = (value as { name?: string }).name;
      return fnName ? `${fnName}()` : 'Function';
    }
    
    return type;
  }

  /**
   * Format a property for completion display
   */
  private formatPropertyCompletion(prop: PropertyInfo): string {
    // Add () suffix for methods to distinguish them from properties
    if (prop.isMethod) {
      return `${prop.name}()`;
    }
    
    return prop.name;
  }

  /**
   * Check if an object looks like a model (Mongoose, Sequelize, etc.)
   */
  private isModelLike(obj: unknown): boolean {
    if (!obj || typeof obj !== 'function') return false;
    
    // Check for common model signatures
    const fn = obj as unknown as Record<string, unknown>;
    const hasModelMethods = ['find', 'findOne', 'create', 'update', 'delete', 'destroy']
      .every(method => typeof fn[method] === 'function');
    
    const hasModelStaticMethods = ['find', 'findOne', 'create']
      .some(method => typeof fn[method] === 'function');

    return hasModelMethods || hasModelStaticMethods;
  }

  /**
   * Check if an object looks like a service
   */
  private isServiceLike(obj: unknown): boolean {
    if (!obj || typeof obj !== 'object') return false;
    
    // Check for common service method patterns
    const serviceMethods = ['get', 'getAll', 'create', 'update', 'delete', 'find', 'save'];
    const objRecord = obj as Record<string, unknown>;
    
    return serviceMethods.some(method => typeof objRecord[method] === 'function');
  }

  /**
   * Get detailed info about a specific object for introspection
   */
  introspect(name: string): ObjectMetadata | null {
    const obj = this.context[name];
    if (obj === undefined) return null;
    
    return this.getObjectMetadata(obj, name);
  }

  /**
   * Get all available completions for a given prefix
   */
  getCompletions(prefix: string = ''): string[] {
    const [completions] = this.complete(prefix);
    return completions;
  }
}

/**
 * Create a completer function for use with Node.js REPL
 */
export function createCompleter(context: Record<string, unknown>) {
  const completer = new IntelligentCompleter(context);
  
  return function(line: string): CompleterResult {
    return completer.complete(line);
  };
}

/**
 * Enhance the REPL context with introspection methods
 */
export function addIntrospectionMethods(context: Record<string, unknown>): void {
  const completer = new IntelligentCompleter(context);

  // Add info() method to get info about any object
  (context as Record<string, unknown>).info = function(obj: unknown): ObjectMetadata | null {
    if (typeof obj === 'string') {
      return completer.introspect(obj);
    }
    if (obj !== undefined) {
      return completer.getObjectMetadata(obj, 'anonymous');
    }
    return null;
  };

  // Add methods() to list methods of an object
  (context as Record<string, unknown>).methods = function(obj: unknown): string[] {
    if (typeof obj === 'string') {
      const metadata = completer.introspect(obj);
      return metadata?.properties
        .filter(p => p.isMethod)
        .map(p => p.name) || [];
    }
    if (obj !== undefined && obj !== null) {
      const metadata = completer.getObjectMetadata(obj, 'anonymous');
      if (!metadata) return [];
      return metadata.properties
        .filter(p => p.isMethod)
        .map(p => p.name);
    }
    return [];
  };

  // Add props() to list properties of an object
  (context as Record<string, unknown>).props = function(obj: unknown): string[] {
    if (typeof obj === 'string') {
      const metadata = completer.introspect(obj);
      return metadata?.properties
        .filter(p => !p.isMethod)
        .map(p => p.name) || [];
    }
    if (obj !== undefined && obj !== null) {
      const metadata = completer.getObjectMetadata(obj, 'anonymous');
      if (!metadata) return [];
      return metadata.properties
        .filter(p => !p.isMethod)
        .map(p => p.name);
    }
    return [];
  };

  // Add type() to get type information
  (context as Record<string, unknown>).type = function(obj: unknown): string {
    if (typeof obj === 'string' && context[obj] !== undefined) {
      const metadata = completer.introspect(obj);
      return metadata?.type || typeof context[obj];
    }
    return completer.getTypeName(obj);
  };
}
