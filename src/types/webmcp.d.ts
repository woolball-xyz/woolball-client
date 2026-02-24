/**
 * Type definitions for W3C WebMCP API (navigator.modelContext)
 *
 * Spec: https://webmachinelearning.github.io/webmcp/
 * Chrome 146+ ships an early preview behind a flag.
 * For older browsers, use the @anthropic-ai/webmcp-polyfill package.
 */

interface McpToolInputSchema {
  type: 'object';
  properties: Record<string, {
    type: string;
    description?: string;
    default?: unknown;
    enum?: string[];
    items?: McpToolInputSchema;
  }>;
  required?: string[];
}

interface McpToolAnnotations {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

interface McpContentItem {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
}

interface McpToolResult {
  content: McpContentItem[];
  isError?: boolean;
}

interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: McpToolInputSchema;
  annotations?: McpToolAnnotations;
  execute: (args: Record<string, unknown>) => Promise<McpToolResult>;
}

interface McpToolRegistration {
  unregister(): void;
}

interface ModelContext {
  registerTool(tool: McpToolDefinition): McpToolRegistration;
  unregisterTool(name: string): void;
  provideContext(context: { tools: McpToolDefinition[] }): void;
  addEventListener(event: string, handler: (event: unknown) => void): void;
}

declare global {
  interface Navigator {
    modelContext?: ModelContext;
  }
}

export type { McpToolDefinition, McpToolResult, McpContentItem, McpToolInputSchema, ModelContext };
