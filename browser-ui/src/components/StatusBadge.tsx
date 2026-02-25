interface StatusBadgeProps {
  connection: 'connected' | 'disconnected' | 'loading' | 'error';
  statusText: string;
  displayedNodeCount: number;
  isNodeCountChanging: boolean;
}

export function StatusBadge({ connection, statusText, displayedNodeCount, isNodeCountChanging }: StatusBadgeProps) {
  return (
    <div className="status-main-text">
      <span className={`status-badge status-${connection} ${isNodeCountChanging ? 'node-count-changing' : ''}`}>
        {connection === 'connected'
          ? `Connected to Woolball server${displayedNodeCount > 0 ? ` • ${displayedNodeCount} active node${displayedNodeCount !== 1 ? 's' : ''}` : ''}`
          : statusText}
      </span>
    </div>
  );
}
