import { useEffect, useRef, useState } from 'react';
import { WebSocketManager } from './WebSocketManager';
import './App.css';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [connection, setConnection] = useState<'connected' | 'disconnected' | 'loading' | 'error'>('disconnected');
  const [running, setRunning] = useState(false);
  const wsManagerRef = useRef<WebSocketManager | null>(null);

  useEffect(() => {
    if (running && containerRef.current) {
      wsManagerRef.current = new WebSocketManager(containerRef.current, setConnection);
    }
    if (!running && wsManagerRef.current) {
      wsManagerRef.current.destroy();
      wsManagerRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      setConnection('disconnected');
    }
    
    return () => {
      if (wsManagerRef.current) {
        wsManagerRef.current.destroy();
        wsManagerRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, [running]);

  const statusText = {
    loading: 'Connecting to server... waiting for tasks',
    connected: 'Connected to Woolball server',
    disconnected: 'You are offline',
    error: 'Connection error'
  }[connection];

  const handleButton = () => {
    setRunning((prev) => !prev);
  };

  return (
    <div className="main-bg central-layout">
      <header className="app-header">
        <span className={`logo-dot connection-${connection}`} title={statusText} />
        <h1 className="app-title">Woolball Client</h1>
      </header>
      <div className="central-content">
        <div className="content-wrapper">
          <div className="app-subtitle">
            This panel shows in real-time the events processed by your connected Woolball node.<br />
            <span style={{ color: '#FFD600' }}>🧶</span> Transform any open tab into an AI computing node!
          </div>
          <div ref={containerRef} className="events-container" />
          <button
            className={`main-action-btn ${running ? 'stop' : 'start'}`}
            onClick={handleButton}
          >
            {running ? 'STOP' : 'START'}
          </button>
          <div className="status-main-text">{statusText}</div>
        </div>
      </div>
    </div>
  );
}

export default App
