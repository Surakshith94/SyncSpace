import { useEffect, useRef } from "react";

const VideoRoom = ({ stream, peers, toggleCamera, toggleMic, isMicOn, isCameraOn}) => {
  const localVideoRef = useRef(); // Local ref for my video

  // Effect to attach local stream to video tag
  useEffect(() => {
    if (localVideoRef.current && stream) {
      localVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "#252526", padding: "10px", borderRadius: "8px", height: "100%", overflowY: "auto" }}>
      <h3 style={{ color: "white", margin: "0 0 10px 0", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>
        🎥 Team
      </h3>

      {/* CONTROLS (Updated with dynamic styles) */}
      <div style={{ display: "flex", gap: "5px", marginBottom: "10px" }}>
        <button 
            onClick={toggleCamera} 
            style={{...btnStyle, background: isCameraOn ? "#3c3c3c" : "#d9534f"}} // Red if off
        >
            {isCameraOn ? "📷 On" : "📷 Off"}
        </button>
        <button 
            onClick={toggleMic} 
            style={{...btnStyle, background: isMicOn ? "#3c3c3c" : "#d9534f"}} // Red if off
        >
            {isMicOn ? "🎤 On" : "🔇 Off"}
        </button>
      </div>

      <div style={videoContainerStyle}>
        <video ref={localVideoRef} autoPlay muted playsInline style={videoStyle} />
        <span style={nameTagStyle}>You</span>
      </div>

      {peers.map((peer) => (
        <VideoComponent key={peer.id} stream={peer.stream} />
      ))}
    </div>
  );
};

const VideoComponent = ({ stream }) => {
  const videoRef = useRef();
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div style={videoContainerStyle}>
      <video ref={videoRef} autoPlay playsInline style={videoStyle} />
      <span style={nameTagStyle}>Partner</span>
    </div>
  );
};

// Styles (Same as before)
const videoContainerStyle = {
  position: "relative", width: "100%", borderRadius: "8px", overflow: "hidden", 
  border: "2px solid #3c3c3c", marginBottom: "10px", background: "black"
};
const videoStyle = { width: "100%", display: "block", transform: "scaleX(-1)" };
const nameTagStyle = { position: "absolute", bottom: "5px", left: "5px", background: "rgba(0,0,0,0.6)", color: "white", padding: "2px 5px", fontSize: "10px", borderRadius: "4px" };
const btnStyle = { flex: 1, background: "#3c3c3c", color: "white", border: "none", padding: "8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" };

export default VideoRoom;