import Woolball from 'woolball-client';

export class WebSocketManager {
  private container: HTMLElement;
  private woolball: Woolball;
  private eventsMap: Map<string, HTMLElement>;
  private onConnectionChange?: (status: 'connected' | 'disconnected' | 'loading' | 'error') => void;

  constructor(containerElement: HTMLElement, onConnectionChange?: (status: 'connected' | 'disconnected' | 'loading' | 'error') => void) {
    this.container = containerElement;
    this.woolball = new Woolball('0'); // non-tracking client
    this.eventsMap = new Map();
    this.onConnectionChange = onConnectionChange;
    this.initializeWoolballEvents();
    // Iniciar automaticamente ao criar a instância
    this.start();
  }

  private start(): void {
    try {
      this.updateConnectionStatus('loading');
      this.woolball.start();
      // Assumimos que a conexão foi bem sucedida se não houver erro
      this.updateConnectionStatus('connected');
    } catch (error) {
      console.error('Error starting Woolball:', error);
      this.updateConnectionStatus('error');
    }
  }

  public destroy(): void {
    try {
      this.woolball.destroy();
      this.updateConnectionStatus('disconnected');
      this.eventsMap.clear();
      this.container.querySelectorAll('.event-card').forEach(card => card.remove());
    } catch (error) {
      console.error('Error stopping Woolball:', error);
      this.updateConnectionStatus('error');
    }
  }

  private updateConnectionStatus(status: 'connected' | 'disconnected' | 'loading' | 'error'): void {
    this.onConnectionChange?.(status);
  }

  private initializeWoolballEvents(): void {
    this.woolball.on('started', (evt: any) => {
      console.log('Task started:', evt);
      this.renderEvent({ ...evt, status: 'started' });
    });
    
    this.woolball.on('success', (evt: any) => {
      console.log('Task success:', evt);
      this.renderEvent({ ...evt, status: 'success' });
    });
    
    this.woolball.on('error', (evt: any) => {
      console.error('Task error:', evt);
      this.renderEvent({ ...evt, status: 'error' });
      // Se houver erro na task, não alteramos o estado da conexão
      // pois o erro pode ser específico da task e não da conexão
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

  private renderEvent({ id, type, status }: { id: string; type: string; status: string }): void {
    let card = this.eventsMap.get(id);

    if (!card) {
      card = document.createElement('div');
      card.classList.add('event-card');
      card.setAttribute('data-id', id);

      card.innerHTML = `
        <div class="event-emoji">${this.getEmoji(type)}</div>
        <div class="event-info">
          <div class="event-type">${type}</div>
          <div class="event-status"></div>
        </div>
      `;
      this.container.prepend(card);
      this.eventsMap.set(id, card);
    }

    const statusEl = card.querySelector('.event-status');
    if (!statusEl) return;

    card.classList.remove('status-loading', 'status-success', 'status-error');

    if (status === 'started') {
      card.classList.add('status-loading');
      statusEl.innerHTML = `<div class="spinner"></div><span>Carregando...</span>`;
    }
    else if (status === 'success') {
      card.classList.add('status-success');
      statusEl.innerHTML = `✔️ Concluído`;
    }
    else if (status === 'error') {
      card.classList.add('status-error');
      statusEl.innerHTML = `❌ Erro`;
    }
  }
}