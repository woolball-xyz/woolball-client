import { useEffect, useRef } from 'react';
import { WebSocketManager } from './WebSocketManager';
import './App.css';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
     new WebSocketManager(containerRef.current);
    }
  }, []);

  return (
    <div className="app-container">
      <h1>Woolball Events</h1>
      <div ref={containerRef} className="events-container" />
    </div>
  );
}

export default App
