import {
  LayoutGrid,
  Shirt,
  Sparkles,
  Plus,
  LogOut,
  ChevronDown,
  X,
  Bookmark,
} from "lucide-react";

function Sidebar({
  active,
  onNavigate,
  open,
  onClose,
  user,
  onLogout,
}) {
  const navItems = [
    {
      id: "dashboard",
      label: "Overview",
      icon: LayoutGrid,
    },
    {
      id: "wardrobe",
      label: "My wardrobe",
      icon: Shirt,
    },
    {
      id: "outfits",
      label: "Outfit ideas",
      icon: Sparkles,
    },
    {
        id: "saved-outfits",
        label: "Saved Outfits",
        icon: Bookmark,
        },
  ];

  const displayName = user?.name?.trim() || "My Account";
  const email = user?.email || "";

  const initials = displayName !== "My Account"
    ? displayName
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : email
        ? email.slice(0, 2).toUpperCase()
        : "U";

  function handleLogout() {
    const confirmed = window.confirm(
      "Are you sure you want to log out?"
    );

    if (!confirmed) {
      return;
    }

    if (onLogout) {
      onLogout();
    }
  }

  function handleProfile() {
    onNavigate("profile");
    onClose();
  }

  return (
    <aside
      className={`sidebar ${
        open ? "sidebar-open" : ""
      }`}
    >
      {/* Sidebar Header */}
      <div className="sidebar-head">
        <div
          className="logo"
          onClick={() => {
            onNavigate("dashboard");
            onClose();
          }}
        >
          <span className="logo-mark">
            <Shirt size={17} />
          </span>

          <span>mywardrobe</span>
        </div>

        <button
          className="close-menu"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={19} />
        </button>
      </div>

      {/* Workspace */}
      <div className="sidebar-label">
        Workspace
      </div>

      <nav className="nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              className={`nav-item ${
                active === item.id ? "active" : ""
              }`}
              onClick={() => {
                onNavigate(item.id);
                onClose();
              }}
            >
              <Icon size={18} strokeWidth={1.8} />

              <span>{item.label}</span>

              {item.id === "outfits" && (
                <span className="new-pill">
                  AI
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Your Account */}
      <div className="sidebar-bottom">
        <div className="sidebar-label">
          Your account
        </div>

        {/* Add Clothing */}
        <button
          className={`nav-item ${
            active === "add" ? "active" : ""
          }`}
          onClick={() => {
            onNavigate("add");
            onClose();
          }}
        >
          <Plus size={18} />

          <span>Add clothing</span>
        </button>

        {/* Dynamic Profile */}
        <div className="profile-mini">
          <div className="avatar">
            {initials}
          </div>

          <div className="profile-mini-info">
            <strong>{displayName}</strong>

            <span>
              {email || "Personal wardrobe"}
            </span>
          </div>

          <button
            className="profile-arrow"
            onClick={handleProfile}
            aria-label="Open profile settings"
          >
            <ChevronDown size={16} />
          </button>
        </div>

        {/* Logout */}
        <button
          className="logout"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
