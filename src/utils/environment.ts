/**
 * Utility function to check if the code is running in a Node.js environment
 * @returns boolean indicating if the environment is Node.js
 */
export function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' && 
         process.versions != null && 
         process.versions.node != null;
}

/**
 * Get the appropriate device for transformers.js based on the current environment
 * @returns 'cpu' for Node.js environment, 'wasm' or 'webgpu' for browser environment
 */
export function getTransformersDevice(defaultDevice: 'wasm' | 'webgpu' = 'wasm'): string {
  return isNodeEnvironment() ? 'cpu' : defaultDevice;
}