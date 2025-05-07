declare module 'woolball-client' {
  type WoolballEvent = 'started' | 'success' | 'error';
  
  interface WoolballConfig {
    nodeCount?: number;
  }

  export default class Woolball {
    constructor(id: string, url?: string);
    start(): void;
    start(config: WoolballConfig): void;
    destroy(): void;
    on(event: WoolballEvent, callback: (data: any) => void): void;
    processEvent(type: string, value: any): Promise<any>;
  }
} 