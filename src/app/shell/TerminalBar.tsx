export function TerminalBar() {
  return (
    <footer className="terminal">
      <div className="terminal-prefix">&gt;</div>

      <div className="terminal-content">
        <span className="terminal-label">DATAGIT</span>
        <span className="terminal-separator">:</span>
        <span className="terminal-text">
          Ready. Select a workspace to begin.
        </span>
      </div>

      <div className="terminal-status">READY</div>
    </footer>
  );
}