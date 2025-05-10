import Woolball from 'woolball-client';
import { WEBSOCKET_URL } from './utils/env';

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
    
    this.wsUrl = wsUrl || WEBSOCKET_URL;
    
    this.addEmptyStateMessage();
   
    this.createWoolballInstances();
    
    this.initializeWoolballEvents();
    
    this.start();
  }
  
  private addEmptyStateMessage(): void {
    this.container.innerHTML = '';
    
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'no-events-message';
    emptyMessage.innerHTML = 'Your tasks will appear here. Press the play button to start processing.';
    this.container.appendChild(emptyMessage);
  }
  
  private createWoolballInstances(): void {
    console.log(`🧶 Creating ${this.nodeCount} Woolball instances`);
    
    this.woolballInstances = [];
    
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
      
      console.log(`⚙️ WebSocketManager starting with ${this.nodeCount} Woolball instances`);
      
      this.woolballInstances.forEach((instance, index) => {
        console.log(`⚙️ Starting Woolball instance #${index+1}`);
        instance.start();
      });
      
      this.updateConnectionStatus('connected');
      console.log(`✅ All ${this.woolballInstances.length} Woolball instances started successfully`);
    } catch (error) {
      console.error('❌ Error starting Woolball instances:', error);
      this.updateConnectionStatus('error');
    }
  }

  public destroy(): void {
    try {
      this.woolballInstances.forEach((instance, index) => {
        console.log(`⚙️ Stopping Woolball instance #${index+1}`);
        instance.destroy();
      });
      
      this.woolballInstances = [];
      
      this.updateConnectionStatus('disconnected');
      this.eventsMap.clear();
      this.container.querySelectorAll('.event-card').forEach(card => card.remove());
      
      this.addEmptyStateMessage();
      
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
    const emptyMessage = this.container.querySelector('.no-events-message');
    if (emptyMessage) {
      emptyMessage.remove();
    }
    
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
            <span>${type}</span>
            ${instance ? `<span class="event-instance">${instance}</span>` : ''}
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