const History = ({ history, showHistory, setShowHistory, restoreVersion }) => {
  if (!showHistory) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      width: "300px",
      height: "100%",
      background: "#1e1e1e", // Dark background
      borderLeft: "1px solid #333",
      display: "flex",
      flexDirection: "column",
      zIndex: 1100, // Higher than everything else
      color: "white",
      fontFamily: "sans-serif",
      boxShadow: "-5px 0 15px rgba(0,0,0,0.5)"
    }}>
      {/* Header */}
      <div style={{ padding: "15px", borderBottom: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#252526" }}>
        <span style={{ fontWeight: "bold", fontSize: "14px" }}>📜 Version History</span>
        <button 
          onClick={() => setShowHistory(false)} 
          style={{ background: "transparent", border: "none", color: "#ccc", cursor: "pointer", fontSize: "16px" }}
        >
          ✕
        </button>
      </div>

      {/* List */}
      <div style={{ overflowY: "auto", flex: 1, padding: "10px" }}>
        {history.length === 0 ? (
          <p style={{ color: "#888", textAlign: "center", fontSize: "12px", marginTop: "20px" }}>No commits yet.</p>
        ) : (
          history.map((commit, index) => (
            <div 
              key={index} 
              onClick={() => restoreVersion(commit.code)}
              style={{
                background: "#2d2d2d",
                marginBottom: "10px",
                padding: "10px",
                borderRadius: "5px",
                cursor: "pointer",
                border: "1px solid #3c3c3c",
                transition: "0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "#37373d"}
              onMouseOut={(e) => e.currentTarget.style.background = "#2d2d2d"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <strong style={{ color: "#4CAF50", fontSize: "12px" }}>Saved Version</strong>
                <span style={{ fontSize: "10px", color: "#888" }}>
                  {new Date(commit.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "#ccc", fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {commit.code.substring(0, 40)}...
              </div>
              <div style={{ marginTop: "5px", fontSize: "10px", color: "#007acc", textAlign: "right" }}>
                Click to Restore
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default History;