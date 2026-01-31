import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidv4();
    navigate(`/editor/${id}`); // Redirect to random room
  };

  const joinRoom = () => {
    if (!roomId) return;
    navigate(`/editor/${roomId}`); // Redirect to specific room
  };

  const handleEnter = (e) => {
    if (e.key === "Enter") joinRoom();
  };

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#1e1e1e", // Dark Theme
      color: "white",
      fontFamily: "sans-serif"
    }}>
      <div style={{
        background: "#252526",
        padding: "40px",
        borderRadius: "10px",
        width: "400px",
        textAlign: "center",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        border: "1px solid #333"
      }}>
        <h1 style={{ marginBottom: "20px", color: "#007acc" }}>🚀 SyncSpace</h1>
        <p style={{ color: "#ccc", marginBottom: "30px" }}>Real-time Code, Chat & Video.</p>

        <div style={{ marginBottom: "20px" }}>
          <input
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyUp={handleEnter}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "5px",
              border: "1px solid #444",
              background: "#333",
              color: "white",
              marginBottom: "10px",
              outline: "none",
              boxSizing: "border-box" // Fixes padding width issue
            }}
          />
          <button 
            onClick={joinRoom}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "5px",
              border: "none",
              background: "#4CAF50",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "0.3s"
            }}
          >
            Join Room
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", margin: "20px 0", color: "#666" }}>
            <div style={{ height: "1px", width: "40%", background: "#444" }}></div>
            <span>OR</span>
            <div style={{ height: "1px", width: "40%", background: "#444" }}></div>
        </div>

        <button 
          onClick={createNewRoom}
          style={{
            background: "transparent",
            color: "#007acc",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
            fontSize: "14px"
          }}
        >
          Generate Unique Room ID &rarr;
        </button>
      </div>
    </div>
  );
};

export default Home;