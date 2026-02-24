import { useEffect, useRef, useState } from 'react';
import { WebSocketManager } from '../WebSocketManager';
import { registerWebMcpTools, unregisterWebMcpTools } from 'woolball-client';

export function useWebSocketManager() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [connection, setConnection] = useState<'connected' | 'disconnected' | 'loading' | 'error'>('disconnected');
  const [running, setRunning] = useState(false);
  const wsManagerRef = useRef<WebSocketManager | null>(null);
  const [nodeCount, setNodeCount] = useState<number>(1);
  const [activeNodeCount, setActiveNodeCount] = useState<number>(0);
  const [displayedNodeCount, setDisplayedNodeCount] = useState<number>(0);
  const [isNodeCountChanging, setIsNodeCountChanging] = useState<boolean>(false);
  const nodeCountTimerRef = useRef<number | null>(null);

  // Handle smooth node count transitions with debounce
  useEffect(() => {
    if (displayedNodeCount === 0 && activeNodeCount > 0) {
      setDisplayedNodeCount(activeNodeCount);
      return;
    }

    if (nodeCountTimerRef.current !== null) {
      clearTimeout(nodeCountTimerRef.current);
    }

    if (activeNodeCount !== displayedNodeCount) {
      setIsNodeCountChanging(true);

      nodeCountTimerRef.current = window.setTimeout(() => {
        setDisplayedNodeCount(activeNodeCount);
        setIsNodeCountChanging(false);
      }, 1000);
    }

    return () => {
      if (nodeCountTimerRef.current !== null) {
        clearTimeout(nodeCountTimerRef.current);
      }
    };
  }, [activeNodeCount, displayedNodeCount]);

  // WS manager lifecycle
  useEffect(() => {
    if (running && containerRef.current) {
      containerRef.current.innerHTML = '';
      wsManagerRef.current = new WebSocketManager(
        containerRef.current,
        setConnection,
        setActiveNodeCount,
        nodeCount
      );
      registerWebMcpTools();
    }
    if (!running && wsManagerRef.current) {
      stopWebSocketManager();
      unregisterWebMcpTools();
    }

    return () => {
      if (wsManagerRef.current) {
        console.log('Cleaning up WebSocketManager');
        wsManagerRef.current.destroy();
        wsManagerRef.current = null;
        unregisterWebMcpTools();
      }
    };
  }, [running, nodeCount]);

  // Cleanup node count timer on unmount
  useEffect(() => {
    return () => {
      if (nodeCountTimerRef.current !== null) {
        clearTimeout(nodeCountTimerRef.current);
      }
    };
  }, []);

  const stopWebSocketManager = () => {
    if (wsManagerRef.current) {
      console.log('Stopping Woolball service');
      wsManagerRef.current.destroy();
      wsManagerRef.current = null;
    }

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    setConnection('disconnected');
    setActiveNodeCount(0);
    setDisplayedNodeCount(0);
    setIsNodeCountChanging(false);
  };

  const handleButton = () => {
    if (running) {
      console.log('Stopping Woolball service');
      stopWebSocketManager();
      setRunning(false);
    } else {
      console.log(`Starting Woolball service with ${nodeCount} node(s)`);
      setRunning(true);
    }
  };

  const statusText = {
    loading: 'Connecting to server... waiting for tasks',
    connected: 'Connected to Woolball server',
    disconnected: 'You are offline',
    error: 'Connection error'
  }[connection];

  return {
    containerRef,
    connection,
    running,
    nodeCount,
    setNodeCount,
    displayedNodeCount,
    isNodeCountChanging,
    handleButton,
    statusText
  };
}
