import { useState } from "react";
import Editor from "@monaco-editor/react";
import toast from "react-hot-toast";

const CodeEditor = ({ 
  code, handleEditorChange, language, setLanguage, 
  writerId, socketId, requestControl, runCode, saveCode 
}) => {
  const [copyText, setCopyText] = useState("📋 Copy");

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopyText("✅ Copied!");
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopyText("📋 Copy"), 2000);
  };

  const isLocked = socketId !== writerId;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#1e1e1e" }}>
      
      {/* TOOLBAR */}
      <div style={{ 
        display: "flex", justifyContent: "space-between", alignItems: "center", 
        padding: "10px 15px", background: "#252526", borderBottom: "1px solid #111" 
      }}>
        
        {/* LEFT: Language & Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            style={{ 
              background: "#3c3c3c", color: "white", padding: "6px 10px", 
              border: "1px solid #555", borderRadius: "4px", outline: "none", cursor: "pointer", fontSize: "13px"
            }}
          >
            <option value="python">🐍 Python</option>
            <option value="javascript">🟨 JavaScript</option>
            <option value="cpp">⚙️ C++</option>
            <option value="java">☕ Java</option>
          </select>

          {/* Writer Status Indicator */}
          {!isLocked ? (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#4CAF50", fontSize: "12px", background: "rgba(76, 175, 80, 0.1)", padding: "4px 8px", borderRadius: "4px" }}>
                <span>✏️</span> 
                <span style={{ fontWeight: "bold" }}>Editing</span>
            </div>
          ) : (
             <button onClick={requestControl} style={requestBtnStyle} title="Click to ask for edit access">
                ✋ Request Access
             </button>
          )}

        </div>

        {/* RIGHT: Actions */}
        <div style={{ display: "flex", gap: "8px" }}>
           <button onClick={handleCopy} style={secondaryBtnStyle}>{copyText}</button>
           <button onClick={saveCode} style={secondaryBtnStyle}>💾 Save</button>
           <button onClick={runCode} style={runBtnStyle}>▶ Run</button>
        </div>
      </div>

      {/* EDITOR AREA */}
      <div style={{ flex: 1, position: "relative" }}>
        
        {/* READ ONLY OVERLAY (Optional Visual Cue) */}
        {isLocked && (
            <div style={{
                position: "absolute", top: "10px", right: "20px", zIndex: 10,
                background: "rgba(255,0,0,0.2)", border: "1px solid rgba(255,0,0,0.4)",
                color: "#ff9999", padding: "4px 8px", borderRadius: "4px", fontSize: "11px",
                pointerEvents: "none" 
            }}>
                🔒 Read Only Mode
            </div>
        )}

        <Editor
            height="100%"
            defaultLanguage={language}
            language={language}
            theme="vs-dark"
            value={code}
            onChange={handleEditorChange}
            options={{ 
              readOnly: isLocked,
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 15 }
            }}
        />
      </div>
    </div>
  );
};

// --- STYLES ---
const requestBtnStyle = {
  background: "#d9534f", color: "white", border: "none", 
  padding: "6px 12px", borderRadius: "4px", cursor: "pointer", 
  fontSize: "12px", fontWeight: "bold",
  transition: "background 0.2s"
};

const runBtnStyle = {
  background: "#4CAF50", color: "white", border: "none", 
  padding: "6px 20px", borderRadius: "4px", cursor: "pointer", 
  fontWeight: "bold", fontSize: "13px", letterSpacing: "0.5px"
};

const secondaryBtnStyle = {
  background: "#0e639c", color: "white", border: "none", 
  padding: "6px 12px", borderRadius: "4px", cursor: "pointer", 
  fontSize: "13px"
};

export default CodeEditor;