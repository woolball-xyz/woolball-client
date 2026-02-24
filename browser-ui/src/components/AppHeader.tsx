interface AppHeaderProps {
  connection: 'connected' | 'disconnected' | 'loading' | 'error';
  statusText: string;
  onToggleDrawer: () => void;
}

export function AppHeader({ connection, statusText, onToggleDrawer }: AppHeaderProps) {
  return (
    <header className="app-header">
      <span className={`logo-dot connection-${connection}`} title={statusText} />
      <h1 className="app-title">browser-based <span className="ai-gradient">AI</span> engine</h1>
      <button
        onClick={onToggleDrawer}
        className="drawer-toggle"
        aria-label="Toggle right drawer"
      >
        ☰
      </button>
    </header>
  );
}
