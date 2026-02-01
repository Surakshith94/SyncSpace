import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Home = () => {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidv4();
    toast.success("Created a new room!");
    navigate(`/editor/${id}`);
  };

  const joinRoom = () => {
    if (!roomId) {
        toast.error("Please enter a Room ID");
        return;
    }
    navigate(`/editor/${roomId}`);
  };

  const handleEnter = (e) => {
    if (e.key === "Enter") joinRoom();
  };

  return (
    <div style={{
      height: "100vh",
      width: "100vw", // <--- ADDED THIS: Forces full screen width
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#1e1e1e",
      color: "white",
      fontFamily: "'Segoe UI', sans-serif",
      position: "fixed", // <--- OPTIONAL: Ensures it sits on top of everything
      top: 0,
      left: 0
    }}>
      <div style={{
        background: "#252526",
        padding: "40px",
        borderRadius: "12px",
        width: "400px",
        textAlign: "center",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        border: "1px solid #333",
        animation: "fadeIn 0.5s ease-in-out"
      }}>
        <div style={{ fontSize: "50px", marginBottom: "10px" }}>🚀</div>
        <h1 style={{ marginBottom: "10px", color: "#007acc", fontSize: "28px", letterSpacing: "1px" }}>SyncSpace</h1>
        <p style={{ color: "#888", marginBottom: "30px", fontSize: "14px" }}>
            Real-time Collaboration for Developers.<br/>
            Code, Chat, Video & AI.
        </p>

        <div style={{ marginBottom: "20px" }}>
          <input
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyUp={handleEnter}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "6px",
              border: "1px solid #444",
              background: "#333",
              color: "white",
              marginBottom: "15px",
              outline: "none",
              fontSize: "15px",
              boxSizing: "border-box",
              transition: "border 0.2s"
            }}
          />
          <button 
            onClick={joinRoom}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "6px",
              border: "none",
              background: "linear-gradient(90deg, #007acc 0%, #005fa3 100%)",
              color: "white",
              fontWeight: "bold",
              fontSize: "16px",
              cursor: "pointer",
              transition: "transform 0.1s"
            }}
          >
            Join Room
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", margin: "20px 0", color: "#666", fontSize: "12px" }}>
            <div style={{ height: "1px", width: "40%", background: "#444" }}></div>
            <span>OR</span>
            <div style={{ height: "1px", width: "40%", background: "#444" }}></div>
        </div>

        <button 
          onClick={createNewRoom}
          style={{
            background: "transparent",
            color: "#4CAF50",
            border: "1px solid #4CAF50",
            padding: "8px 15px",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            transition: "background 0.3s"
          }}
          onMouseEnter={(e) => e.target.style.background = "rgba(76, 175, 80, 0.1)"}
          onMouseLeave={(e) => e.target.style.background = "transparent"}
        >
          ✨ Generate Unique Room ID
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Home;