
import "./Sidebar.css";

const AVATAR_COLORS = [
  "rgba(59,130,246,0.20)",
  "rgba(168,85,247,0.20)",
  "rgba(34,197,94,0.20)",
  "rgba(234,179,8,0.20)",
  "rgba(244,63,94,0.20)",
  "rgba(14,165,233,0.20)",
];

const Sidebar = ({ isOpen, windows, onRestore, toggleSidebar, participants = [] }) => {
  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");

  const getAvatarColor = (index) => AVATAR_COLORS[index % AVATAR_COLORS.length];

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <button className="sidebar-close" onClick={toggleSidebar}>
        <span className="material-symbols-outlined">close</span>
      </button>

      <div className="sidebar-content">
        {/* ── Windows Section ── */}
        <div>
          <div className="sidebar-section-header">
            <span className="material-symbols-outlined">grid_view</span>
            <span>Windows</span>
          </div>
          <ul>
            {windows.map((data) => (
              <li key={data.id}>
                <button
                  onClick={() => {
                    onRestore(data.id);
                    toggleSidebar();
                  }}
                >
                  <span className="material-symbols-outlined">
                    {data.type === "Code" ? "code" : "description"}
                  </span>
                  {data.title}
                </button>
              </li>
            ))}
            {windows.length === 0 && (
              <li style={{ padding: "8px 12px", color: "#64748b", fontSize: 13 }}>
                No windows yet
              </li>
            )}
          </ul>
        </div>

        {/* ── Participants Section ── */}
        <div>
          <div className="sidebar-section-header">
            <span className="material-symbols-outlined">group</span>
            <span>Participants</span>
          </div>
          <ul className="participants-list">
            {participants.length === 0 && (
              <li className="participant" style={{ color: "#64748b", fontSize: 13 }}>
                No participants
              </li>
            )}
            {participants.map((p, i) => (
              <li key={p.username} className="participant">
                <span
                  className="participant-avatar"
                  style={{ backgroundColor: getAvatarColor(i), color: p.color || "#cbd5e1" }}
                >
                  {getInitial(p.username)}
                </span>
                <span className="participant-name">{p.username}</span>
                <span
                  className="participant-dot"
                  style={{ backgroundColor: p.color || "#22c55e", marginLeft: "auto" }}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
