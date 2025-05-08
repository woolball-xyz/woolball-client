import Woolball from 'woolball-client';

export class WebSocketManager {
  private container: HTMLElement;
  private woolballInstances: Woolball[] = [];
  private eventsMap: Map<string, HTMLElement>;
  private onConnectionChange?: (status: 'connected' | 'disconnected' | 'loading' | 'error') => void;
  private nodeCount: number;
  private wsUrl: string;

  constructor(
    containerElement: HTMLElement, 
    onConnectionChange?: (status: 'connected' | 'disconnected' | 'loading' | 'error') => void,
    nodeCount: number = 1,
    wsUrl?: string
  ) {
    this.container = containerElement;
    this.nodeCount = nodeCount;
    this.eventsMap = new Map();
    this.onConnectionChange = onConnectionChange;
    
    // Use provided WebSocket URL or fallback to environment variable or default
    this.wsUrl = wsUrl || import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:9002/api/v1/ws';
   
    // Create the specified number of Woolball instances
    this.createWoolballInstances();
    
    // Initialize event listeners for all instances
    this.initializeWoolballEvents();
    
    // Start automatically when instance is created
    this.start();
  }

  private createWoolballInstances(): void {
    console.log(`🧶 Creating ${this.nodeCount} Woolball instances`);
    
    // Clear any existing instances
    this.woolballInstances = [];
    
    // Create the specified number of instances
    for (let i = 0; i < this.nodeCount; i++) {
      console.log(`🧶 Creating Woolball instance #${i+1}`);
      const instance = new Woolball(`node-${i}`, this.wsUrl);
      this.woolballInstances.push(instance);
    }
    
    console.log(`✅ Created ${this.woolballInstances.length} Woolball instances`);
  }

  private start(): void {
    try {
      this.updateConnectionStatus('loading');
      
      // Log the current node count
      console.log(`⚙️ WebSocketManager starting with ${this.nodeCount} Woolball instances`);
      
      // Start each Woolball instance
      this.woolballInstances.forEach((instance, index) => {
        console.log(`⚙️ Starting Woolball instance #${index+1}`);
        instance.start();
      });
      
      // Assume the connection was successful if no error
      this.updateConnectionStatus('connected');
      console.log(`✅ All ${this.woolballInstances.length} Woolball instances started successfully`);
    } catch (error) {
      console.error('❌ Error starting Woolball instances:', error);
      this.updateConnectionStatus('error');
    }
  }

  public destroy(): void {
    try {
      // Stop all Woolball instances
      this.woolballInstances.forEach((instance, index) => {
        console.log(`⚙️ Stopping Woolball instance #${index+1}`);
        instance.destroy();
      });
      
      // Clear instances array
      this.woolballInstances = [];
      
      this.updateConnectionStatus('disconnected');
      this.eventsMap.clear();
      this.container.querySelectorAll('.event-card').forEach(card => card.remove());
      
      console.log('✅ All Woolball instances stopped successfully');
    } catch (error) {
      console.error('❌ Error stopping Woolball instances:', error);
      this.updateConnectionStatus('error');
    }
  }

  private updateConnectionStatus(status: 'connected' | 'disconnected' | 'loading' | 'error'): void {
    this.onConnectionChange?.(status);
  }

  private initializeWoolballEvents(): void {
    // Setup event listeners for each Woolball instance
    this.woolballInstances.forEach((instance, index) => {
      const instanceId = `node-${index+1}`;
      
      instance.on('started', (evt: any) => {
        console.log(`Task started on instance #${index+1}:`, evt);
        this.renderEvent({ ...evt, status: 'started', instance: instanceId });
      });
      
      instance.on('success', (evt: any) => {
        console.log(`Task success on instance #${index+1}:`, evt);
        this.renderEvent({ ...evt, status: 'success', instance: instanceId });
      });
      
      instance.on('error', (evt: any) => {
        console.error(`Task error on instance #${index+1}:`, evt);
        this.renderEvent({ ...evt, status: 'error', instance: instanceId });
      });
    });
  }

  private getEmoji(type: string): string {
    const map: { [key: string]: string } = {
      'speech-recognition': '🎙️',
      'text-to-speech': '🔊',
      'translation': '🌐',
    };
    return map[type] || '❓';
  }

  private renderEvent({ id, type, status, instance }: { id: string; type: string; status: string; instance?: string }): void {
    const cardId = instance ? `${instance}-${id}` : id;
    let card = this.eventsMap.get(cardId);

    if (!card) {
      card = document.createElement('div');
      card.classList.add('event-card');
      card.setAttribute('data-id', cardId);

      card.innerHTML = `
        <div class="event-emoji">${this.getEmoji(type)}</div>
        <div class="event-info">
          <div class="event-type">
            ${type}
            ${instance ? `<span class="event-instance">(${instance})</span>` : ''}
          </div>
          <div class="event-status"></div>
        </div>
      `;
      this.container.prepend(card);
      this.eventsMap.set(cardId, card);
    }

    const statusEl = card.querySelector('.event-status');
    if (!statusEl) return;

    card.classList.remove('status-loading', 'status-success', 'status-error');

    if (status === 'started') {
      card.classList.add('status-loading');
      statusEl.innerHTML = `<div class="spinner"></div><span>Loading...</span>`;
    }
    else if (status === 'success') {
      card.classList.add('status-success');
      statusEl.innerHTML = `✓ Completed`;
    }
    else if (status === 'error') {
      card.classList.add('status-error');
      statusEl.innerHTML = `❌ Error`;
    }
  }
}