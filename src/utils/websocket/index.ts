/**
 * WebSocket connection module
 * Provides utilities to connect to WebSocket server and handle messages
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

type WebSocketConfig = {
  url: string;
  id: string;
  onMessage?: (message: WorkerEvent) => void;
  onError?: (error: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onOpen?: () => void;
};

export class WebSocketConnection {
  private socket: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000; // Start with 1 second

  constructor(config: WebSocketConfig) {
    this.config = config;
    this.connect();
  }

  /**
   * Establishes connection to WebSocket server
   */
  private connect(): void {
    try {
      this.socket = new WebSocket(this.config.url);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        // Send client ID as soon as connection is established
        this.sendMessage({
          type: 'REGISTER',
          data: { id: this.config.id }
        });
        
        if (this.config.onOpen) {
          this.config.onOpen();
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WorkerEvent;
          if (this.config.onMessage) {
            this.config.onMessage(message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (this.config.onError) {
          this.config.onError(error);
        }
      };

      this.socket.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        
        if (this.config.onClose) {
          this.config.onClose(event);
        }
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
    }
  }

  /**
   * Attempts to reconnect to the WebSocket server with exponential backoff
   */
  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectTimeout * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Sends a message to the WebSocket server
   * @param message The message to send
   * @returns True if message was sent, false otherwise
   */
  public sendMessage(message: WebSocketMessage): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  /**
   * Closes the WebSocket connection
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Checks if the WebSocket connection is open
   * @returns True if connection is open, false otherwise
   */
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}