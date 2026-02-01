import { useState, useEffect, useRef } from "react";

const Chat = ({ room, socket, messages, setMessage, showChat, setShowChat }) => {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null); // Ref for auto-scroll

  // AUTO-SCROLL to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showChat]); // Run when messages update or when chat opens

  const sendMessage = () => {
    if (newMessage.trim() === "") return;
    const msgData = { room, message: newMessage, sender: "Me" };
    
    // Update local list
    setMessage((prev) => [...prev, msgData]);
    // Send to server
    socket.emit("send_chat", { room, message: newMessage, sender: "Partner" });
    setNewMessage("");
  };

  const handleEnterKey = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  if (!showChat) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "90px", // Align with other overlays
        right: "80px", // Moved left so it doesn't cover scrollbars
        width: "350px",
        height: "500px",
        background: "#1e1e1e", // VS Code Sidebar Dark
        border: "1px solid #333",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        boxShadow: "0 4px 20px rgba(0,0,0,0.6)", // Better Shadow
        color: "white",
        fontFamily: "Consolas, 'Courier New', monospace",
        borderRadius: "8px", // Rounded corners
        overflow: "hidden"
      }}
    >
      {/* Header */}
      <div style={{ background: "#007acc", padding: "10px 15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>💬</span>
            <span style={{ fontWeight: "bold", fontSize: "14px" }}>Group Chat</span>
        </div>
        <button 
          onClick={() => setShowChat(false)} 
          style={{ background: "rgba(255,255,255,0.2)", width: "24px", height: "24px", borderRadius: "50%", color: "white", border: "none", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          ✕
        </button>
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, padding: "15px", overflowY: "auto", background: "#252526" }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: "15px", textAlign: msg.sender === "Me" ? "right" : "left" }}>
            <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "4px" }}>
                {msg.sender === "Me" ? "You" : "Partner"}
            </div>
            <span style={{ 
                background: msg.sender === "Me" ? "#0e639c" : "#333", 
                color: "white", 
                padding: "8px 12px", 
                borderRadius: msg.sender === "Me" ? "8px 8px 0 8px" : "8px 8px 8px 0", // Chat bubble shape
                display: "inline-block",
                maxWidth: "85%",
                wordWrap: "break-word",
                border: "1px solid #444",
                fontSize: "13px"
            }}>
              {msg.message}
            </span>
          </div>
        ))}
        {/* Invisible div to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: "10px", borderTop: "1px solid #333", background: "#1e1e1e", display: "flex" }}>
        <input 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleEnterKey}
          placeholder="Type a message..."
          style={{ 
            flex: 1, 
            padding: "10px", 
            background: "#333", 
            border: "1px solid #444", 
            color: "white",
            outline: "none",
            borderRadius: "4px",
            fontSize: "13px"
          }}
        />
        <button 
          onClick={sendMessage} 
          style={{ 
            marginLeft: "8px", 
            background: "#007acc", 
            color: "white", 
            border: "none", 
            padding: "0 15px",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "0.2s"
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default Chat;