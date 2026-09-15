import { Sidebar } from './Sidebar';
import { TerminalBar } from './TerminalBar';
import { TopBar } from './TopBar';
import { AppRouter } from '../router/AppRouter';

export function AppShell() {
  return (
    <div className="app-shell">
      <TopBar />

      <div className="app-body">
        <Sidebar />

        <main className="workspace">
          <div className="workspace-inner">
            <AppRouter />
          </div>
        </main>
      </div>

      <TerminalBar />
    </div>
  );
}