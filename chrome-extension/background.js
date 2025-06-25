import Woolball from 'woolball-client';

console.log('Background script starting...');
console.log('Running in service worker environment');

let woolballClient = null;
let clientId = null;
let isConnected = false;
let isWoolballInitialized = false;
let pendingUpdates = [];

chrome.runtime.onInstalled.addListener(() => {
  console.log('Woolball extension installed');
  
  chrome.storage.local.get(['clientId'], (result) => {
    if (!result.clientId) {
      clientId = generateClientId();
      chrome.storage.local.set({ clientId });
    } else {
      clientId = result.clientId;
    }
    console.log('Client ID:', clientId);
  });
  
  loadPendingUpdates();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Service worker starting...');
  loadPendingUpdates();
});

function loadPendingUpdates() {
  chrome.storage.local.get(['pendingUpdates'], (result) => {
    if (result.pendingUpdates && Array.isArray(result.pendingUpdates)) {
      pendingUpdates = result.pendingUpdates;
      console.log(`Loaded ${pendingUpdates.length} pending updates from storage`);
    }
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'initWoolball') {
    initializeWoolball(sendResponse);
    return true; 
  } else if (message.action === 'connect') {
    if (!isWoolballInitialized) {
      sendResponse({ success: false, error: 'Woolball not initialized. Click "Initialize Woolball" first.' });
    } else {
      connectToServer(message.serverUrl, sendResponse);
      return true; 
    }
  } else if (message.action === 'disconnect') {
    disconnectFromServer();
    sendResponse({ success: true });
  } else if (message.action === 'getWoolballStatus') {
    sendResponse({ initialized: isWoolballInitialized, connected: isConnected });
  } else if (message.action === 'getPendingUpdates') {
    const updates = [...pendingUpdates]; 
    sendResponse({ updates });
    
    pendingUpdates = [];
    chrome.storage.local.set({ pendingUpdates: [] });
    console.log(`Sent ${updates.length} pending updates to popup`);
  }
});


async function initializeWoolball(sendResponse) {
  try {
    console.log('Initializing Woolball client...');
    
    if (woolballClient) {
      console.log('Disconnecting existing client...');
      disconnectFromServer();
    }
    
    if (!clientId) {
      console.log('Loading client ID from storage...');
      const result = await chrome.storage.local.get(['clientId']);
      clientId = result.clientId || generateClientId();
      chrome.storage.local.set({ clientId });
      console.log('Using client ID:', clientId);
    }
    
    console.log('Importing Woolball...');
    
    if (typeof document === 'undefined') {
      console.log('Service worker environment detected');
    }
    
    woolballClient = new Woolball(clientId, null, {
      environment: 'extension'
    });
    
    console.log('Woolball client created successfully');
    isWoolballInitialized = true;
    
    sendResponse({ success: true });
    
    console.log('Woolball initialized successfully');
  } catch (error) {
    console.error('Error initializing Woolball:', error);
    console.error('Error stack:', error.stack);
    sendResponse({ success: false, error: error.message || 'Unknown initialization error' });
  }
}

async function connectToServer(serverUrl, sendResponse) {
  try {
    console.log('Connecting to server:', serverUrl);
    
    if (!woolballClient) {
      sendResponse({ success: false, error: 'Woolball client not initialized. Click "Initialize Woolball" first.' });
      return;
    }
    
    try {
      woolballClient.wsUrl = serverUrl;
      
      console.log('Starting connection...');
      woolballClient.start();
      
      console.log('Woolball client started successfully');
      
      setupEventListeners();
      
      isConnected = true;
      
      sendResponse({ success: true });
      
      console.log(`Successfully connected to Woolball server at ${serverUrl}`);
    } catch (woolballError) {
      console.error('Woolball connection error:', woolballError);
      console.error('Error stack:', woolballError.stack);
      sendResponse({ success: false, error: woolballError.message || 'Unknown Woolball connection error' });
    }
  } catch (error) {
    console.error('Failed to connect to Woolball server:', error);
    console.error('Error stack:', error.stack);
    sendResponse({ success: false, error: error.message || 'Unknown connection error' });
  }
}

function disconnectFromServer() {
  if (woolballClient) {
    try {
      woolballClient.destroy();
      isConnected = false;
      console.log('Disconnected from server');
      
      notifyPopup('connectionStatus', { connected: false });
    } catch (error) {
      console.error('Error disconnecting from server:', error);
    }
  }
}

function setupEventListeners() {
  if (!woolballClient) {
    console.error('Cannot set up event listeners: Woolball client not initialized');
    return;
  }

  console.log('Setting up Woolball client event listeners...');
  
  try {
    woolballClient.on('started', (data) => {
      console.log('Task started:', data);
    });

    woolballClient.on('success', (data) => {
      console.log('Task completed successfully:', data);
      notifyPopup('taskCompleted', { task: data });
    });

    woolballClient.on('error', (data) => {
      console.log('Task error:', data);
    });

    console.log('Woolball client event listeners set up successfully');
  } catch (error) {
    console.error('Error setting up event listeners:', error);
  }
}

function notifyPopup(type, data) {
  try {
    // Adapt message format for simplified interface
    let message;
    if (type === 'taskCompleted') {
      message = { type, task: data.task, timestamp: Date.now() };
    } else if (type === 'connectionStatus') {
      message = { type, connected: data.connected, timestamp: Date.now() };
    } else if (type === 'woolballStatus') {
      message = { type, initialized: data.initialized, timestamp: Date.now() };
    } else {
      message = { type, data, timestamp: Date.now() };
    }
    
    console.log('Sending message to popup:', message);
    
    chrome.runtime.sendMessage(message)
      .then(() => {
        console.log('Message sent successfully to popup');
      })
      .catch(error => {
        console.log('Popup not open, storing update in cache:', message);
        pendingUpdates.push(message);
        
        if (pendingUpdates.length > 100) {
          pendingUpdates = pendingUpdates.slice(-100);
        }
        
        chrome.storage.local.set({ pendingUpdates });
      });
  } catch (error) {
    console.log('Unexpected error sending message, storing in cache:', error);
    const message = { type, data, timestamp: Date.now() };
    pendingUpdates.push(message);
    chrome.storage.local.set({ pendingUpdates });
  }
}

function generateClientId() {
  return 'chrome-ext-' + Math.random().toString(36).substring(2, 15);
}