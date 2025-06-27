const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const serverUrlInput = document.getElementById('server-url');
const connectBtn = document.getElementById('connect-btn');
const woolballStatusEl = document.getElementById('woolball-status');
const tasksCompletedEl = document.getElementById('tasks-completed');

let isConnected = false;
let isWoolballInitialized = false;
let tasksCompleted = 0;

document.addEventListener('DOMContentLoaded', async () => {
  chrome.storage.local.get(['serverUrl'], (result) => {
    if (result.serverUrl) {
      serverUrlInput.value = result.serverUrl;
    }
  });

  // Reset task counter when extension is opened
  resetTaskCounter();

  chrome.storage.local.get(['isConnected'], (result) => {
    if (result.isConnected) {
      updateConnectionStatus(true);
      requestPendingUpdates();
    }
  });

  chrome.runtime.sendMessage({ action: 'getWoolballStatus' }, (response) => {
    if (response && response.initialized) {
      updateWoolballStatus(true);
      
      if (response.connected) {
        updateConnectionStatus(true);
      }
    }
  });

  connectBtn.addEventListener('click', toggleConnection);
});

// Function removed as initialization is now handled in toggleConnection

function updateWoolballStatus(initialized) {
  isWoolballInitialized = initialized;
  
  if (initialized) {
    woolballStatusEl.textContent = 'Woolball successfully initialized';
  } else {
    woolballStatusEl.textContent = 'Woolball not initialized';
  }
}

async function toggleConnection() {
  if (isConnected) {
    chrome.runtime.sendMessage({ action: 'disconnect' });
    updateConnectionStatus(false);
  } else {
    const serverUrl = serverUrlInput.value.trim();
    if (!serverUrl) {
      alert('Please enter a valid server URL');
      return;
    }
    
    chrome.storage.local.set({ serverUrl });
    
    statusDot.classList.remove('connected');
    statusDot.classList.add('connecting');
    statusText.textContent = 'Connecting...';
    connectBtn.disabled = true;
    woolballStatusEl.textContent = 'Initializing Woolball...';
    
    // Initialize Woolball first if needed
    if (!isWoolballInitialized) {
      try {
        await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ action: 'initWoolball' }, (response) => {
            if (response && response.success) {
              updateWoolballStatus(true);
              resolve();
            } else {
              reject(new Error(response?.error || 'Failed to initialize Woolball'));
            }
          });
        });
      } catch (error) {
        statusDot.classList.remove('connecting');
        statusText.textContent = 'Connection failed';
        connectBtn.disabled = false;
        woolballStatusEl.textContent = 'Woolball initialization failed';
        alert(`Failed to initialize Woolball: ${error.message}`);
        return;
      }
    }
    
    // Now connect to the server
    chrome.runtime.sendMessage(
      { action: 'connect', serverUrl },
      (response) => {
        if (response && response.success) {
          updateConnectionStatus(true);
        } else {
          statusDot.classList.remove('connecting');
          statusText.textContent = 'Connection failed';
          connectBtn.disabled = false;
          
          if (response && response.error) {
            alert(`Connection failed: ${response.error}`);
          }
        }
      }
    );
  }
}

function updateConnectionStatus(connected) {
  isConnected = connected;
  chrome.storage.local.set({ isConnected });
  
  if (connected) {
    statusDot.classList.remove('connecting');
    statusDot.classList.add('connected');
    statusText.textContent = 'Connected';
    connectBtn.textContent = 'Disconnect';
    connectBtn.classList.add('disconnect');
    connectBtn.disabled = false;
  } else {
    statusDot.classList.remove('connected', 'connecting');
    statusText.textContent = 'Disconnected';
    connectBtn.textContent = 'Connect';
    connectBtn.classList.remove('disconnect');
    connectBtn.disabled = false;
  }
}



function addTaskToHistory(task) {
  // Increment task counter only once per task
  tasksCompleted++;
  tasksCompletedEl.textContent = tasksCompleted;
  chrome.storage.local.set({ tasksCompleted });
}

function requestPendingUpdates() {
  chrome.runtime.sendMessage({ action: 'getPendingUpdates' }, (response) => {
    if (response && response.updates && response.updates.length > 0) {
      console.log(`Processing ${response.updates.length} pending updates`);
      
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
    case 'woolballStatus':
      updateWoolballStatus(message.initialized);
      break;
    case 'taskCompleted':
      // Task count is incremented in addTaskToHistory
      if (message.task) {
        addTaskToHistory(message.task);
      }
      break;
  }
}

chrome.runtime.onMessage.addListener((message) => {
  processMessage(message);
});

// Reset task counter when extension is opened
function resetTaskCounter() {
  chrome.storage.local.get(['tasksCompleted'], (result) => {
    if (result.tasksCompleted) {
      tasksCompleted = result.tasksCompleted;
      tasksCompletedEl.textContent = tasksCompleted;
    }
  });
}