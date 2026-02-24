import { useState } from 'react';
import { useGitHubStars } from './hooks/useGitHubStars';
import { useWebSocketManager } from './hooks/useWebSocketManager';
import { useTaskProcessor } from './hooks/useTaskProcessor';
import { AppHeader } from './components/AppHeader';
import { GitHubLink } from './components/GitHubLink';
import { NodeSelector } from './components/NodeSelector';
import { StatusBadge } from './components/StatusBadge';
import { RightDrawer } from './components/RightDrawer';
import { TaskBottomBar } from './components/TaskBottomBar';
import './App.css';

function App() {
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const repoStars = useGitHubStars();
  const ws = useWebSocketManager();
  const tasks = useTaskProcessor();

  return (
    <div className="main-bg central-layout">
      <AppHeader connection={ws.connection} statusText={ws.statusText} onToggleDrawer={() => setRightDrawerOpen(p => !p)} />

      <div className="mobile-links">
        <GitHubLink repoStars={repoStars} />
      </div>

      <div className={`central-content ${ws.running ? 'running' : ''}`}>
        <div className="content-wrapper">
          <div className="main-content-area">
            {ws.running ? (
              <div ref={ws.containerRef} className="events-container" />
            ) : (
              <div className="config-section">
                <NodeSelector nodeCount={ws.nodeCount} onNodeCountChange={ws.setNodeCount} />
              </div>
            )}
          </div>

          <button
            className={`main-action-btn ${ws.running ? 'stop' : 'start'}`}
            onClick={ws.handleButton}
          >
            {ws.running ? 'STOP' : 'START'}
          </button>

          <StatusBadge
            connection={ws.connection}
            statusText={ws.statusText}
            displayedNodeCount={ws.displayedNodeCount}
            isNodeCountChanging={ws.isNodeCountChanging}
          />
        </div>

        <RightDrawer isOpen={rightDrawerOpen} repoStars={repoStars} />
      </div>

      <TaskBottomBar tasks={tasks} running={ws.running} />
    </div>
  );
}

export default App;
