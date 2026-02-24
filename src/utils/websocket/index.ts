/**
 * WebSocket connection module
 * Provides type definitions for WebSocket messages
 */
export type WorkerEvent = {
  Id: string;
  Key: string;
  Value: string;
};

export type WebSocketMessage = {
  type: string;
  data: any;
};
