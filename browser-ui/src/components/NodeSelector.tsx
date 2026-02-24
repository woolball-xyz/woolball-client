interface NodeSelectorProps {
  nodeCount: number;
  onNodeCountChange: (updater: (prev: number) => number) => void;
}

export function NodeSelector({ nodeCount, onNodeCountChange }: NodeSelectorProps) {
  return (
    <div className="node-selector-container">
      <h3 className="node-selector-title">Parallel Processing Nodes</h3>
      <div className="node-controls">
        <button
          className="node-control-btn"
          onClick={() => onNodeCountChange(prev => Math.max(1, prev - 1))}
        >
          -
        </button>
        <div className="node-count">
          <span className="node-count-value">{nodeCount}</span>
          <span className="node-count-label">node{nodeCount !== 1 ? 's' : ''}</span>
        </div>
        <button
          className="node-control-btn"
          onClick={() => onNodeCountChange(prev => Math.min(3, prev + 1))}
        >
          +
        </button>
      </div>
      <div className="node-description">
        Each node represents a separate instance running.
        <span className="node-description-icon">🧶</span>
      </div>
    </div>
  );
}
