// WebSocketManager.js
import Woolball from '../dist/woolball.js';

export class WebSocketManager {
  constructor(containerElement) {
    this.container = containerElement;
    this.woolball = new Woolball.default();
    this.eventsMap = new Map();
    this.initializeWoolballEvents();
    this.initializeControls();
  }

  initializeControls() {
    const controls = document.createElement('div');
    controls.classList.add('controls');
    
    const startButton = document.createElement('button');
    startButton.textContent = 'Start';
    startButton.classList.add('start-button');
    startButton.onclick = () => this.start();

    const stopButton = document.createElement('button');
    stopButton.textContent = 'Stop';
    stopButton.classList.add('stop-button');
    stopButton.onclick = () => this.stop();

    controls.appendChild(startButton);
    controls.appendChild(stopButton);
    this.container.prepend(controls);
  }

  start() {
    this.woolball.start();
    this.updateConnectionStatus('connected');
  }

  stop() {
    this.woolball.destroy();
    this.updateConnectionStatus('disconnected');
  }

  updateConnectionStatus(status) {
    const controls = this.container.querySelector('.controls');
    if (!controls) return;

    const startButton = controls.querySelector('.start-button');
    const stopButton = controls.querySelector('.stop-button');

    if (status === 'connected') {
      startButton.disabled = true;
      stopButton.disabled = false;
    } else if (status === 'disconnected') {
      startButton.disabled = false;
      stopButton.disabled = true;
    }
  }

  initializeWoolballEvents() {
    this.woolball.on('started',    evt => this.renderEvent({...evt, status: 'started'}));
    this.woolball.on('success',    evt => this.renderEvent({...evt, status: 'success'}));
    this.woolball.on('error',      evt => this.renderEvent({...evt, status: 'error'}));
  }

  connect() {
    this.woolball.connect(); 
  }

  getEmoji(type) {
    const map = {
      'speech-recognition': '🎙️',
      'text-to-speech':     '🔊',
      'translation':        '🌐',
    };
    return map[type] || '❓';
  }

  renderEvent({ id, type, status }) {
    let card = this.eventsMap.get(id);

    // Create a new card if it doesn't exist
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

    // Atualiza o status
    const statusEl = card.querySelector('.event-status');
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
