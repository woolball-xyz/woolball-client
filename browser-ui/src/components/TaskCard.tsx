import { TaskStates } from '../types/tasks';

interface TaskCardProps {
  taskType: keyof TaskStates;
  title: string;
  task: TaskStates[keyof TaskStates];
  models: { value: string; label: string; provider?: string }[];
  copiedTaskType: keyof TaskStates | null;
  running: boolean;
  onStart: () => void;
  onCopyCurl: (taskType: keyof TaskStates) => void;
  onModelChange: <T extends keyof TaskStates>(taskType: T, updates: Partial<TaskStates[T]>) => void;
  formatElapsedTime: (ms: number) => string;
}

export function TaskCard({
  taskType, title, task, models, copiedTaskType, running,
  onStart, onCopyCurl, onModelChange, formatElapsedTime
}: TaskCardProps) {
  return (
    <div className="http-test-card">
      <div className="http-test-top-line">
        <div className="http-test-method">{title.toUpperCase()}</div>
        <span className="http-test-service-name">HTTP REQUEST</span>
      </div>

      <div className="task-controls-row">
        <select
          value={task.model}
          onChange={(e) => {
            const selectedModel = models.find(m => m.value === e.target.value);
            onModelChange(taskType, {
              model: e.target.value,
              ...(selectedModel && 'provider' in selectedModel ? { provider: selectedModel.provider } : {})
            } as Partial<TaskStates[typeof taskType]>);
          }}
          disabled={task.isProcessing}
          className="model-selector"
        >
          {models.map(model => (
            <option key={model.value} value={model.value}>
              {model.label}
            </option>
          ))}
        </select>

        <div className="card-actions">
          <button
            className={`copy-curl-button ${copiedTaskType === taskType ? 'copied' : ''}`}
            onClick={() => onCopyCurl(taskType)}
            aria-label="Copy cURL command to clipboard"
          >
            <span className="copy-icon">
              {copiedTaskType === taskType ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
                </svg>
              )}
            </span>
            <span className="tooltip">Copy cURL</span>
          </button>
          <button
            className={`play-button ${task.isProcessing ? 'processing' : ''}`}
            onClick={onStart}
            aria-label="Run test"
            disabled={task.isProcessing}
          >
            <span className="play-icon">▶</span>
            <span className="tooltip">Run Test</span>
          </button>
        </div>
      </div>

      {task.isProcessing ? (
        <div className="processing-indicator">
          <span className="spinner"></span>
          {task.status}
          <span className="elapsed-time">{formatElapsedTime(task.elapsedTime)}</span>
        </div>
      ) : task.status?.includes("Success") ? (
        <div className="success-message">
          <span className="check-icon">✓</span>
          {task.status}
          <span className="elapsed-time">{formatElapsedTime(task.elapsedTime)}</span>
        </div>
      ) : task.status?.includes("Error") ? (
        <div className="error-message">
          <span className="error-icon">❌</span>
          {task.status}
          <span className="elapsed-time">{formatElapsedTime(task.elapsedTime)}</span>
        </div>
      ) : !running ? (
        <div className="waiting-message">
          <span className="info-icon">ℹ️</span>
          Press START to also be a node
        </div>
      ) : null}
    </div>
  );
}
