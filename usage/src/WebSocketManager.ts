import Woolball from 'woolball-client';

export class WebSocketManager {
  private container: HTMLElement;
  private woolball: Woolball;
  private eventsMap: Map<string, HTMLElement>;

  constructor(containerElement: HTMLElement) {
    this.container = containerElement;
    this.woolball = new Woolball('0'); // non-tracking client
    this.eventsMap = new Map();
    this.initializeWoolballEvents();
  }

  private initializeWoolballEvents(): void {
    this.woolball.on('started', (evt: any) => this.renderEvent({ ...evt, status: 'started' }));
    this.woolball.on('success', (evt: any) => this.renderEvent({ ...evt, status: 'success' }));
    this.woolball.on('error', (evt: any) => this.renderEvent({ ...evt, status: 'error' }));
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