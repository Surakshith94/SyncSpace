import { useState } from "react";

const Chat = ({ room, socket, messages, setMessage, showChat, setShowChat }) => {
  const [newMessage, setNewMessage] = useState("");

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
        bottom: "80px", // Moved up slightly
        right: "20px",
        width: "350px",
        height: "500px",
        background: "#1e1e1e", // VS Code Sidebar Dark
        border: "1px solid #333",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        boxShadow: "-5px 5px 20px rgba(0,0,0,0.5)",
        color: "white",
        fontFamily: "Consolas, 'Courier New', monospace"
      }}
    >
      {/* Header */}
      <div style={{ background: "#007acc", padding: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: "bold" }}>💬 Group Chat</span>
        <button 
          onClick={() => setShowChat(false)} 
          style={{ background: "transparent", color: "white", border: "none", cursor: "pointer", fontSize: "16px" }}
        >
          ✕
        </button>
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, padding: "15px", overflowY: "auto", background: "#252526" }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: "15px", textAlign: msg.sender === "Me" ? "right" : "left" }}>
            <div style={{ fontSize: "11px", color: "#888", marginBottom: "2px" }}>
                {msg.sender === "Me" ? "You" : "Partner"}
            </div>
            <span style={{ 
                background: msg.sender === "Me" ? "#0e639c" : "#3c3c3c", // VS Code Blue vs Gray
                color: "white", 
                padding: "8px 12px", 
                borderRadius: "6px", 
                display: "inline-block",
                maxWidth: "80%",
                wordWrap: "break-word"
            }}>
              {msg.message}
            </span>
          </div>
        ))}
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
            padding: "8px", 
            background: "#3c3c3c", 
            border: "1px solid #555", 
            color: "white",
            outline: "none",
            borderRadius: "4px"
          }}
        />
        <button 
          onClick={sendMessage} 
          style={{ 
            marginLeft: "8px", 
            background: "#0e639c", 
            color: "white", 
            border: "none", 
            padding: "0 15px",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;