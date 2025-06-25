// Environment utility to get variables from both Vite build time and runtime

interface EnvConfig {
  VITE_WEBSOCKET_URL: string;
  VITE_API_URL: string;
  [key: string]: string;
}

declare global {
  interface Window {
    ENV_CONFIG?: EnvConfig;
  }
}

/**
 * Get an environment variable from runtime config or Vite
 * @param key The environment variable key
 * @param fallback Optional fallback value
 * @returns The environment variable value
 */
export function getEnv(key: string, fallback?: string): string {
  // First try to get from runtime config
  if (window.ENV_CONFIG && window.ENV_CONFIG[key]) {
    return window.ENV_CONFIG[key];
  }
  
  // Then try to get from Vite
  const viteValue = import.meta.env[key];
  if (viteValue) {
    return viteValue;
  }
  
  // Return fallback or empty string
  return fallback || '';
}

// Common environment variables
export const WEBSOCKET_URL = getEnv('VITE_WEBSOCKET_URL', 'ws://localhost:9003/ws');
export const API_URL = getEnv('VITE_API_URL', 'http://localhost:9002/api/v1'); 