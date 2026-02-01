const History = ({ history, showHistory, setShowHistory, restoreVersion }) => {
  if (!showHistory) return null;

  const handleRestore = (code) => {
    // 🛡️ SAFETY CHECK: Prevent accidental code loss
    const confirmRestore = window.confirm("⚠️ Are you sure? This will overwrite your current code with this version.");
    if (confirmRestore) {
      restoreVersion(code);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      width: "320px", // Slightly wider for readability
      height: "100%",
      background: "#1e1e1e",
      borderLeft: "1px solid #333",
      display: "flex",
      flexDirection: "column",
      zIndex: 1100, // Highest priority
      color: "white",
      fontFamily: "'Segoe UI', sans-serif",
      boxShadow: "-5px 0 20px rgba(0,0,0,0.5)"
    }}>
      
      {/* HEADER (Matches Chat Style) */}
      <div style={{ 
          background: "#007acc", 
          padding: "15px", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>📜</span>
            <span style={{ fontWeight: "bold", letterSpacing: "0.5px" }}>Version History</span>
        </div>
        <button 
          onClick={() => setShowHistory(false)} 
          style={{ 
            background: "rgba(255,255,255,0.2)", width: "25px", height: "25px", 
            borderRadius: "50%", color: "white", border: "none", cursor: "pointer", 
            display: "flex", alignItems: "center", justifyContent: "center"
          }}
        >
          ✕
        </button>
      </div>

      {/* LIST AREA */}
      <div style={{ overflowY: "auto", flex: 1, padding: "15px", background: "#252526" }}>
        {history.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "50px", opacity: 0.5 }}>
            <span style={{ fontSize: "40px", marginBottom: "10px" }}>🕰️</span>
            <p style={{ fontSize: "14px" }}>No saved versions yet.</p>
            <p style={{ fontSize: "12px" }}>Click "Save" to create a checkpoint.</p>
          </div>
        ) : (
          history.map((commit, index) => (
            <div 
              key={index} 
              onClick={() => handleRestore(commit.code)}
              style={itemStyle}
              onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#37373d";
                  e.currentTarget.style.transform = "translateX(-2px)";
              }}
              onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#2d2d2d";
                  e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", borderBottom: "1px solid #3c3c3c", paddingBottom: "5px" }}>
                <strong style={{ color: "#4CAF50", fontSize: "13px" }}>v{history.length - index}</strong>
                <span style={{ fontSize: "11px", color: "#aaa" }}>
                  {new Date(commit.timestamp).toLocaleString()} {/* Date & Time */}
                </span>
              </div>
              
              <div style={{ 
                  fontSize: "12px", color: "#ccc", fontFamily: "monospace", 
                  background: "#1e1e1e", padding: "5px", borderRadius: "4px",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" 
              }}>
                {commit.code.substring(0, 50)}...
              </div>

              <div style={{ marginTop: "8px", fontSize: "11px", color: "#007acc", textAlign: "right", fontWeight: "bold" }}>
                ↺ Click to Restore
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- STYLES ---
const itemStyle = {
    background: "#2d2d2d",
    marginBottom: "15px",
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
    border: "1px solid #3c3c3c",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
};

export default History;