
import { Bell, Menu } from "lucide-react";
import Logo from "./Logo";

function Topbar({ onMenu, onNavigate, user }) {
  const displayName = user?.name?.trim();
  const email = user?.email || "";

  const initials = displayName
    ? displayName
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : email
        ? email.slice(0, 2).toUpperCase()
        : "U";

  return (
    <header className="topbar">
      <button
        className="mobile-menu"
        onClick={onMenu}
        aria-label="Open menu"
      >
        <Menu size={21} />
      </button>

      <div className="mobile-logo">
        <Logo />
      </div>

      <div className="topbar-spacer"></div>

      <button
        className="icon-button"
        onClick={() =>
          alert("Notifications will be added later.")
        }
        aria-label="Notifications"
      >
        <Bell size={18} />
      </button>

      <button
        className="avatar"
        onClick={() => onNavigate("profile")}
        aria-label="Open profile"
      >
        {initials}
      </button>
    </header>
  );
}

export default Topbar;
