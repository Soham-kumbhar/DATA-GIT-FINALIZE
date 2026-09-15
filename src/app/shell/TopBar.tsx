export function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand">DATAGIT</div>

        <div className="topbar-divider" />

        <div className="topbar-context">
          DATA ENGINEERING WORKSPACE
        </div>
      </div>

      <div className="topbar-right">
        <span className="topbar-status">LOCAL</span>
      </div>
    </header>
  );
}