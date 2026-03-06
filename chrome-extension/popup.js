const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const tasksCompletedEl = document.getElementById('tasks-completed');

const tabCloud = document.getElementById('tab-cloud');
const tabSelfhosted = document.getElementById('tab-selfhosted');
const cloudSection = document.getElementById('cloud-section');
const selfhostedSection = document.getElementById('selfhosted-section');

const cloudApiKeyInput = document.getElementById('cloud-api-key');
const cloudConnectBtn = document.getElementById('cloud-connect-btn');
const getKeyLink = document.getElementById('get-key-link');

const selfhostedUrlInput = document.getElementById('selfhosted-url');
const selfhostedApiKeyInput = document.getElementById('selfhosted-api-key');
const selfhostedConnectBtn = document.getElementById('selfhosted-connect-btn');

let isConnected = false;
let isWoolballInitialized = false;
let tasksCompleted = 0;
let currentMode = 'cloud';

function isValidServerUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'wss:' || parsed.protocol === 'ws:';
  } catch {
    return false;
  }
}

function switchMode(mode) {
  currentMode = mode;
  chrome.storage.local.set({ mode });

  if (mode === 'cloud') {
    tabCloud.classList.add('active');
    tabSelfhosted.classList.remove('active');
    cloudSection.classList.remove('hidden');
    selfhostedSection.classList.add('hidden');
  } else {
    tabCloud.classList.remove('active');
    tabSelfhosted.classList.add('active');
    cloudSection.classList.add('hidden');
    selfhostedSection.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['mode', 'apiKey', 'serverUrl', 'selfhostedApiKey', 'tasksCompleted', 'isConnected'], (result) => {
    if (result.mode) {
      switchMode(result.mode);
    }
    if (result.apiKey) {
      cloudApiKeyInput.value = result.apiKey;
    }
    if (result.serverUrl) {
      selfhostedUrlInput.value = result.serverUrl;
    }
    if (result.selfhostedApiKey) {
      selfhostedApiKeyInput.value = result.selfhostedApiKey;
    }
    if (result.tasksCompleted) {
      tasksCompleted = result.tasksCompleted;
      tasksCompletedEl.textContent = tasksCompleted;
    }
    if (result.isConnected) {
      updateConnectionStatus(true);
      requestPendingUpdates();
    }
  });

  chrome.runtime.sendMessage({ action: 'getWoolballStatus' }, (response) => {
    if (response && response.initialized) {
      isWoolballInitialized = true;
      if (response.connected) {
        updateConnectionStatus(true);
      }
    }
  });

  tabCloud.addEventListener('click', () => switchMode('cloud'));
  tabSelfhosted.addEventListener('click', () => switchMode('selfhosted'));

  cloudConnectBtn.addEventListener('click', () => handleConnect('cloud'));
  selfhostedConnectBtn.addEventListener('click', () => handleConnect('selfhosted'));

  getKeyLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://portal.woolball.xyz#create-key' });
  });
});

async function handleConnect(mode) {
  if (isConnected) {
    chrome.runtime.sendMessage({ action: 'disconnect' });
    updateConnectionStatus(false);
    return;
  }

  let serverUrl;
  let apiKey;

  if (mode === 'cloud') {
    apiKey = cloudApiKeyInput.value.trim();
    if (!apiKey || !apiKey.startsWith('wb_ws_')) {
      alert('Please enter a valid API key (starts with wb_ws_)');
      return;
    }
    serverUrl = 'wss://api.woolball.xyz/ws';
    chrome.storage.local.set({ apiKey });
  } else {
    serverUrl = selfhostedUrlInput.value.trim();
    if (!serverUrl) {
      serverUrl = 'ws://localhost:9003/ws';
      selfhostedUrlInput.value = serverUrl;
    }
    if (!isValidServerUrl(serverUrl)) {
      alert('Please enter a valid WebSocket URL (ws:// or wss://)');
      return;
    }
    apiKey = selfhostedApiKeyInput.value.trim() || null;
    chrome.storage.local.set({ serverUrl });
    if (apiKey) {
      chrome.storage.local.set({ selfhostedApiKey: apiKey });
    }
  }

  const connectBtn = mode === 'cloud' ? cloudConnectBtn : selfhostedConnectBtn;

  statusDot.classList.remove('connected');
  statusDot.classList.add('connecting');
  statusText.textContent = 'Connecting...';
  connectBtn.disabled = true;

  if (!isWoolballInitialized) {
    try {
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'initWoolball' }, (response) => {
          if (response && response.success) {
            isWoolballInitialized = true;
            resolve();
          } else {
            reject(new Error(response?.error || 'Failed to initialize Woolball'));
          }
        });
      });
    } catch (error) {
      statusDot.classList.remove('connecting');
      statusText.textContent = 'Failed';
      connectBtn.disabled = false;
      alert('Woolball initialization failed: ' + error.message);
      return;
    }
  }

  chrome.runtime.sendMessage(
    { action: 'connect', serverUrl, apiKey },
    (response) => {
      if (response && response.success) {
        updateConnectionStatus(true);
      } else {
        statusDot.classList.remove('connecting');
        statusText.textContent = 'Failed';
        connectBtn.disabled = false;
        if (response && response.error) {
          alert('Connection failed: ' + response.error);
        }
      }
    }
  );
}

function updateConnectionStatus(connected) {
  isConnected = connected;
  chrome.storage.local.set({ isConnected });

  const connectBtn = currentMode === 'cloud' ? cloudConnectBtn : selfhostedConnectBtn;

  if (connected) {
    statusDot.classList.remove('connecting');
    statusDot.classList.add('connected');
    statusText.textContent = 'Connected';
    cloudConnectBtn.textContent = 'Disconnect';
    cloudConnectBtn.classList.add('disconnect');
    cloudConnectBtn.disabled = false;
    selfhostedConnectBtn.textContent = 'Disconnect';
    selfhostedConnectBtn.classList.add('disconnect');
    selfhostedConnectBtn.disabled = false;
  } else {
    statusDot.classList.remove('connected', 'connecting');
    statusText.textContent = 'Disconnected';
    cloudConnectBtn.textContent = 'Connect';
    cloudConnectBtn.classList.remove('disconnect');
    cloudConnectBtn.disabled = false;
    selfhostedConnectBtn.textContent = 'Connect';
    selfhostedConnectBtn.classList.remove('disconnect');
    selfhostedConnectBtn.disabled = false;
  }
}

function addTaskToHistory(task) {
  tasksCompleted++;
  tasksCompletedEl.textContent = tasksCompleted;
  chrome.storage.local.set({ tasksCompleted });
}

function requestPendingUpdates() {
  chrome.runtime.sendMessage({ action: 'getPendingUpdates' }, (response) => {
    if (response && response.updates && response.updates.length > 0) {
      response.updates.forEach(update => {
        processMessage(update);
      });
    }
  });
}

function processMessage(message) {
  if (!message || !message.type) return;

  switch (message.type) {
    case 'connectionStatus':
      updateConnectionStatus(message.connected);
      break;
    case 'taskCompleted':
      if (message.task) {
        addTaskToHistory(message.task);
      }
      break;
  }
}

chrome.runtime.onMessage.addListener((message) => {
  processMessage(message);
});
