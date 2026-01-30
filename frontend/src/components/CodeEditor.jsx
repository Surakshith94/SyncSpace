import Editor from "@monaco-editor/react";

const CodeEditor = ({ 
  code, handleEditorChange, language, setLanguage, 
  writerId, socketId, requestControl, runCode, saveCode 
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#1e1e1e" }}>
      
      {/* Top Toolbar */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        padding: "10px", 
        background: "#333", 
        borderBottom: "1px solid #111" 
      }}>
        
        {/* Language Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            style={{ 
              background: "#1e1e1e", color: "white", padding: "5px", 
              border: "1px solid #555", borderRadius: "4px", outline: "none" 
            }}
          >
            <option value="python">🐍 Python</option>
            <option value="javascript">🟨 JavaScript</option>
            <option value="cpp">⚙️ C++</option>
            <option value="java">☕ Java</option>
          </select>

          {/* Writer Status */}
          {socketId === writerId ? (
            <span style={{ color: "#4CAF50", fontSize: "12px", fontWeight: "bold" }}>✏️ You are editing</span>
          ) : (
             <button onClick={requestControl} style={controlBtnStyle}>✋ Request Access</button>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
           <button onClick={runCode} style={{...actionBtnStyle, background: "#4CAF50"}}>▶ Run</button>
           <button onClick={saveCode} style={{...actionBtnStyle, background: "#007acc"}}>💾 Save</button>
        </div>
      </div>

      {/* Editor Area */}
      <div style={{ flex: 1 }}>
        <Editor
            height="100%"
            defaultLanguage={language}
            language={language} // IMPORTANT: Pass language here dynamically
            theme="vs-dark"
            value={code}
            onChange={handleEditorChange}
            options={{ 
              readOnly: socketId !== writerId,
              minimap: { enabled: false },
              fontSize: 14
            }}
        />
      </div>
    </div>
  );
};

const controlBtnStyle = {
  background: "#E91E63", color: "white", border: "none", 
  padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px"
};

const actionBtnStyle = {
  color: "white", border: "none", 
  padding: "6px 15px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold"
};

export default CodeEditor;