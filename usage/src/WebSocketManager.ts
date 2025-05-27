import Woolball from 'woolball-client';
import { WEBSOCKET_URL } from './utils/env';

export class WebSocketManager {
  private container: HTMLElement;
  private woolballInstances: Woolball[] = [];
  private eventsMap: Map<string, HTMLElement>;
  private onConnectionChange?: (status: 'connected' | 'disconnected' | 'loading' | 'error') => void;
  private onNodeCountChange?: (nodeCount: number) => void;
  private nodeCount: number;
  private wsUrl: string;

  private isChromeBased(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('chrome') || 
           userAgent.includes('chromium') || 
           userAgent.includes('edg');
  }

  private showBrowserCompatibilityError(): void {
    this.container.innerHTML = `
      <div class="browser-compatibility-error">
        <div class="error-icon">⚠️</div>
        <h3>Browser Compatibility Notice</h3>
        <p>This application requires a Chrome-based browser to function properly.</p>
        <button class="why-button" onclick="document.getElementById('compatibility-modal').showModal()">Why?</button>
        
        <dialog id="compatibility-modal" class="compatibility-modal">
          <div class="modal-content">
            <button class="close-button" onclick="this.closest('dialog').close()">×</button>
            <h3>Browser Compatibility</h3>
            <p>Many of our advanced AI models use WebGPU technology for faster processing, currently available only in Chrome-based browsers.</p>
            <div class="requirements-section">
              <h4>System requirements:</h4>
              <ul class="requirements-list">
                <li><span>Chrome-based browser</span></li>
                <li><span>16GB RAM recommended</span></li>
                <li class="with-sublist">
                  <span>Any modern device:</span>
                  <ul class="sub-list">
                    <li><span class="emoji">🍎</span><span>Macs (M1/M2/M3)</span></li>
                    <li><span class="emoji">🖥️</span><span>Windows PCs</span></li>
                    <li><span class="emoji">📱</span><span>Android phones with Chrome</span></li>
                  </ul>
                </li>
              </ul>
            </div>
            <p>No dedicated graphics card needed!</p>
            
            <div class="modal-footer">
              <a href="https://github.com/your-repo/issues" target="_blank" class="report-issue-button">
                Think this is a mistake? Let us know
              </a>
            </div>
          </div>
        </dialog>
      </div>
    `;

    // Add some basic styles for the error message
    const style = document.createElement('style');
    style.textContent = `
      .browser-compatibility-error {
        padding: 20px;
        border-radius: 8px;
        background-color: #fff3f3;
        border: 1px solid #ffcdd2;
        text-align: center;
        max-width: 500px;
        margin: 20px auto;
        font-family: system-ui, -apple-system, sans-serif;
      }
      .browser-compatibility-error .error-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      .browser-compatibility-error h3 {
        color: #d32f2f;
        margin: 0 0 16px 0;
      }
      .browser-compatibility-error p {
        margin: 8px 0;
        color: #555;
      }
      .why-button {
        margin: 12px 0;
        padding: 8px 16px;
        border: 1px solid #d32f2f;
        background: transparent;
        color: #d32f2f;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      }
      .why-button:hover {
        background: #d32f2f;
        color: white;
      }
      
      .compatibility-modal {
        border: none;
        border-radius: 12px;
        padding: 0;
        max-width: 500px;
        width: 90%;
        background: white;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        margin: 0;
      }
      
      .compatibility-modal::backdrop {
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(2px);
      }
      
      .modal-content {
        padding: 24px;
        position: relative;
        color: #333;
      }
      
      .close-button {
        position: absolute;
        right: 16px;
        top: 16px;
        background: none;
        border: none;
        font-size: 24px;
        color: #666;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s;
      }
      
      .close-button:hover {
        background: #f5f5f5;
        color: #333;
      }
      
      .modal-content h3 {
        margin-top: 0;
        color: #333;
        font-size: 20px;
      }

      .requirements-section {
        margin: 20px 0;
        background: #f8f9fa;
        border-radius: 8px;
        padding: 16px;
      }

      .requirements-section h4 {
        margin: 0 0 12px 0;
        color: #333;
        font-size: 16px;
      }
      
      .modal-content p {
        color: #555;
        line-height: 1.5;
      }
      
      .requirements-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      
      .requirements-list li {
        display: flex;
        align-items: flex-start;
        padding: 8px 0;
        color: #555;
        gap: 12px;
      }

      .requirements-list .emoji {
        flex-shrink: 0;
        width: 24px;
        text-align: center;
      }

      .requirements-list span:not(.emoji) {
        flex: 1;
      }

      .sub-list {
        list-style: none;
        padding: 0;
        margin: 8px 0 0 36px;
      }

      .sub-list li {
        padding: 4px 0;
      }
      
      .modal-footer {
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid #eee;
        text-align: center;
      }
      
      .report-issue-button {
        display: inline-block;
        padding: 8px 16px;
        color: #666;
        text-decoration: none;
        font-size: 14px;
        border-radius: 4px;
        transition: all 0.2s;
      }
      
      .report-issue-button:hover {
        background: #f5f5f5;
        color: #333;
      }
    `;
    document.head.appendChild(style);
  }

  constructor(
    containerElement: HTMLElement, 
    onConnectionChange?: (status: 'connected' | 'disconnected' | 'loading' | 'error') => void,
    onNodeCountChange?: (nodeCount: number) => void,
    nodeCount: number = 1,
    wsUrl?: string
  ) {
    this.container = containerElement;
    this.nodeCount = nodeCount;
    this.eventsMap = new Map();
    this.onConnectionChange = onConnectionChange;
    this.onNodeCountChange = onNodeCountChange;
    this.wsUrl = wsUrl || WEBSOCKET_URL;

    if (!this.isChromeBased()) {
      this.showBrowserCompatibilityError();
      this.updateConnectionStatus('error');
      return;
    }
    
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

      instance.on('node_count', (evt: any) => {
        if (evt.nodeCount !== undefined && this.onNodeCountChange) {
          this.onNodeCountChange(evt.nodeCount);
        }
      });
    });
  }

  private getEmoji(type: string): string {
    const map: { [key: string]: string } = {
      'automatic-speech-recognition': '🎙️',
      'text-to-speech': '🔊',
      'translation': '🌐',
      'text-generation': '💬',
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