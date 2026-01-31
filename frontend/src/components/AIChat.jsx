import { useState } from "react";

const AIChat = ({ showAIChat, setShowAIChat, code }) => {
  const [input, setInput] = useState("");
  const [aiMessages, setAiMessages] = useState([
    { sender: "AI", text: "Hi! I see your code. Ask me anything about it. 🤖" }
  ]);
  const [loading, setLoading] = useState(false);

  const sendToAI = async () => {
    if (!input.trim()) return;

    // Add User Message
    const userMsg = { sender: "You", text: input };
    setAiMessages(prev => [...prev, userMsg]);
    setLoading(true);
    const currentInput = input;
    setInput("");

    try {
      const response = await fetch("http://localhost:5000/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: currentInput, code: code }) // Send code too!
      });

      const data = await response.json();
      
      // Add AI Message
      setAiMessages(prev => [...prev, { sender: "AI", text: data.result }]);
    } catch (error) {
      setAiMessages(prev => [...prev, { sender: "AI", text: "Error connecting to Brain." }]);
    }
    setLoading(false);
  };

  if (!showAIChat) return null;

  return (
    <div style={{
        position: "fixed", bottom: "80px", left: "60px", // Left side near sidebar
        width: "400px", height: "500px",
        background: "#1e1e1e", border: "1px solid #9c27b0", // Purple Border
        display: "flex", flexDirection: "column", zIndex: 1000,
        boxShadow: "5px 5px 20px rgba(0,0,0,0.5)", color: "white", borderRadius: "8px"
    }}>
      {/* Header */}
      <div style={{ background: "#7b1fa2", padding: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: "bold" }}>🤖 AI Pair Programmer</span>
        <button onClick={() => setShowAIChat(false)} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer" }}>✕</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: "15px", overflowY: "auto", background: "#252526" }}>
        {aiMessages.map((msg, index) => (
          <div key={index} style={{ marginBottom: "15px", textAlign: msg.sender === "You" ? "right" : "left" }}>
            <div style={{ fontSize: "11px", color: "#ccc", marginBottom: "2px" }}>{msg.sender}</div>
            <div style={{ 
                background: msg.sender === "You" ? "#4a148c" : "#333", 
                padding: "8px 12px", borderRadius: "6px", display: "inline-block", maxWidth: "90%",
                whiteSpace: "pre-wrap", fontSize: "13px"
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && <div style={{ color: "#aaa", fontSize: "12px", fontStyle: "italic" }}>AI is thinking...</div>}
      </div>

      {/* Input */}
      <div style={{ padding: "10px", borderTop: "1px solid #333", display: "flex" }}>
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI to fix bug..." 
          onKeyDown={(e) => e.key === 'Enter' && sendToAI()}
          style={{ flex: 1, padding: "8px", background: "#333", border: "none", color: "white", borderRadius: "4px", outline: "none" }}
        />
        <button onClick={sendToAI} style={{ marginLeft: "8px", background: "#9c27b0", color: "white", border: "none", padding: "0 15px", borderRadius: "4px", cursor: "pointer" }}>Go</button>
      </div>
    </div>
  );
};

export default AIChat;