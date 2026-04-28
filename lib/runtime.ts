export type RuntimeType = 'nodejs' | 'edge';

export interface RuntimeConfig {
  runtime: RuntimeType;
  supportsNodeModules: boolean;
  supportsStreams: boolean;
  maxDuration?: number;
}

export const NODEJS_CONFIG: RuntimeConfig = {
  runtime: 'nodejs',
  supportsNodeModules: true,
  supportsStreams: true,
  maxDuration: 300,
};

export const EDGE_CONFIG: RuntimeConfig = {
  runtime: 'edge',
  supportsNodeModules: false,
  supportsStreams: true,
  maxDuration: 30,
};

export function getRuntimeConfig(runtime: RuntimeType): RuntimeConfig {
  return runtime === 'nodejs' ? NODEJS_CONFIG : EDGE_CONFIG;
}

export function isNodeRuntime(): boolean {
  if (typeof process === 'undefined') {
    return false;
  }
  return process.env.NEXT_RUNTIME === 'nodejs' || !process.env.NEXT_RUNTIME;
}

export function isEdgeRuntime(): boolean {
  if (typeof process === 'undefined') {
    return false;
  }
  return process.env.NEXT_RUNTIME === 'edge';
}

export function assertNodeRuntime(): void {
  if (isEdgeRuntime()) {
    throw new Error('This module requires Node.js runtime');
  }
}

export function assertEdgeRuntime(): void {
  if (isNodeRuntime()) {
    throw new Error('This module requires Edge runtime');
  }
}

export const NODE_ONLY_MODULES = [
  'node:crypto',
  'node:stream',
  'node:fs',
  'node:path',
  'bcryptjs',
  'jsonwebtoken',
  '@prisma/client',
  '@prisma/adapter-pg',
  'pg',
  'node-cron',
];

export function isNodeOnlyModule(moduleName: string): boolean {
  return NODE_ONLY_MODULES.some((name) => 
    moduleName === name || moduleName.startsWith(`${name}/`)
  );
}

export function getRecommendedRuntime(moduleNames: string[]): RuntimeType {
  const requiresNode = moduleNames.some(isNodeOnlyModule);
  return requiresNode ? 'nodejs' : 'edge';
}

export function generateRuntimeExport(moduleNames: string[]): string {
  const runtime = getRecommendedRuntime(moduleNames);
  return `export const runtime = '${runtime}';`;
}