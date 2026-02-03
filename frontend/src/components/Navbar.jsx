function Navbar({ actionLabel, onAction }) {
  return (
    <nav className="main-navbar">
      <div className="navbar-container">
        <div className="navbar-actions">
          {actionLabel && onAction && (
            <button className="secondary-button" type="button" onClick={onAction}>
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
