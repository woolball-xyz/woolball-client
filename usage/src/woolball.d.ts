declare module 'woolball-client' {
  type WoolballEvent = 'started' | 'success' | 'error';

  export default class Woolball {
    constructor(id: string, url?: string);
    start(): void;
    destroy(): void;
    on(event: WoolballEvent, callback: (data: any) => void): void;
    processEvent(type: string, value: any): Promise<any>;
  }
} 