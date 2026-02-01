import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown"; // Makes code look like code
import { IoMdSend, IoMdClose } from "react-icons/io"; // Optional: Use icons if you have react-icons installed, otherwise text is fine
// If you don't have react-icons, remove the import and use text "Send" and "X"

const AIChat = ({ showAIChat, setShowAIChat, code }) => {
  const [input, setInput] = useState("");
  const [aiMessages, setAiMessages] = useState([
    { sender: "AI", text: "Hi! I see your code. Ask me to explain or fix it! 🤖" }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null); // To auto-scroll

  // 1. DYNAMIC URL (Fixes the Deployment Error)
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // 2. AUTO-SCROLL to bottom when new message arrives
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [aiMessages]);

  const sendToAI = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "You", text: input };
    setAiMessages(prev => [...prev, userMsg]);
    setLoading(true);
    const currentInput = input;
    setInput("");

    try {
      const response = await fetch(`${BACKEND_URL}/ask-ai`, { // FIX: Use dynamic URL
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: currentInput, code: code })
      });

      const data = await response.json();
      setAiMessages(prev => [...prev, { sender: "AI", text: data.result }]);
    } catch (error) {
      setAiMessages(prev => [...prev, { sender: "AI", text: "⚠️ Error connecting to AI Brain." }]);
    }
    setLoading(false);
  };

  if (!showAIChat) return null;

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>🤖</span>
            <span style={{ fontWeight: "bold", letterSpacing: "0.5px" }}>AI Assistant</span>
        </div>
        <button onClick={() => setShowAIChat(false)} style={styles.closeBtn}>✕</button>
      </div>

      {/* MESSAGES AREA */}
      <div style={styles.messagesArea}>
        {aiMessages.map((msg, index) => (
          <div key={index} style={{ 
              display: "flex", 
              justifyContent: msg.sender === "You" ? "flex-end" : "flex-start", 
              marginBottom: "15px" 
          }}>
            <div style={{
                ...styles.bubble,
                background: msg.sender === "You" ? "#007acc" : "#333", // Blue for user, Dark for AI
                color: "white",
                borderBottomRightRadius: msg.sender === "You" ? "2px" : "12px",
                borderBottomLeftRadius: msg.sender === "You" ? "12px" : "2px",
            }}>
              {/* RENDER MARKDOWN (Bold text, Code blocks) */}
              <ReactMarkdown 
                components={{
                    code({node, inline, className, children, ...props}) {
                        return !inline ? (
                            <div style={styles.codeBlock}>
                                {String(children).replace(/\n$/, '')}
                            </div>
                        ) : (
                            <code style={styles.inlineCode} {...props}>
                                {children}
                            </code>
                        )
                    }
                }}
              >
                  {msg.text}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        
        {loading && (
            <div style={{ display: "flex", gap: "5px", marginLeft: "10px", marginBottom: "10px" }}>
                <div style={styles.typingDot}></div>
                <div style={styles.typingDot}></div>
                <div style={styles.typingDot}></div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div style={styles.inputArea}>
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your code..." 
          onKeyDown={(e) => e.key === 'Enter' && sendToAI()}
          style={styles.input}
          disabled={loading}
        />
        <button onClick={sendToAI} style={styles.sendBtn} disabled={loading}>
            {loading ? "..." : "➤"}
        </button>
      </div>
    </div>
  );
};

// --- STYLES OBJECT (Cleaner & Professional) ---
const styles = {
    container: {
        position: "fixed", bottom: "90px", left: "60px",
        width: "380px", height: "550px",
        background: "#1e1e1e", 
        border: "1px solid #333",
        display: "flex", flexDirection: "column", zIndex: 1000,
        boxShadow: "0px 8px 24px rgba(0,0,0,0.6)", 
        borderRadius: "12px",
        fontFamily: "'Segoe UI', sans-serif",
        overflow: "hidden"
    },
    header: {
        background: "linear-gradient(90deg, #6200ea 0%, #3700b3 100%)", // Professional Gradient
        padding: "15px", 
        display: "flex", justifyContent: "space-between", alignItems: "center",
        color: "white",
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
    },
    closeBtn: {
        background: "rgba(255,255,255,0.2)", border: "none", 
        color: "white", cursor: "pointer", 
        width: "25px", height: "25px", borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "12px"
    },
    messagesArea: {
        flex: 1, padding: "15px", overflowY: "auto", 
        background: "#252526",
        display: "flex", flexDirection: "column"
    },
    bubble: {
        padding: "10px 14px", 
        borderRadius: "12px", 
        maxWidth: "85%",
        fontSize: "13px",
        lineHeight: "1.5",
        boxShadow: "0 1px 2px rgba(0,0,0,0.3)"
    },
    codeBlock: {
        background: "#111", 
        padding: "8px", 
        borderRadius: "6px", 
        fontFamily: "monospace", 
        fontSize: "12px",
        margin: "5px 0",
        whiteSpace: "pre-wrap",
        overflowX: "auto"
    },
    inlineCode: {
        background: "rgba(255,255,255,0.1)",
        padding: "2px 4px",
        borderRadius: "4px",
        fontFamily: "monospace"
    },
    inputArea: {
        padding: "10px", 
        borderTop: "1px solid #333", 
        background: "#1e1e1e",
        display: "flex", gap: "10px"
    },
    input: {
        flex: 1, padding: "10px", 
        background: "#333", border: "1px solid #444", 
        color: "white", borderRadius: "6px", outline: "none",
        fontSize: "13px"
    },
    sendBtn: {
        background: "#007acc", color: "white", border: "none", 
        padding: "0 15px", borderRadius: "6px", cursor: "pointer",
        fontWeight: "bold", fontSize: "16px",
        transition: "background 0.2s"
    },
    typingDot: {
        width: "6px", height: "6px", background: "#888", borderRadius: "50%",
        animation: "pulse 1s infinite"
    }
};

export default AIChat;