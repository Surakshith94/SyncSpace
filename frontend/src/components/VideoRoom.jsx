import { useEffect, useRef } from "react";

const VideoRoom = ({ myVideo, peers, toggleCamera, toggleMic }) => {
  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: "10px", 
      background: "#252526", // VS Code Sidebar Gray
      padding: "10px",
      borderRadius: "8px",
      height: "100%",
      overflowY: "auto"
    }}>
      <h3 style={{ color: "white", margin: "0 0 10px 0", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>
        🎥 Team
      </h3>

      {/* Controls */}
      <div style={{ display: "flex", gap: "5px", marginBottom: "10px" }}>
        <button onClick={toggleCamera} style={btnStyle}>📷 Cam</button>
        <button onClick={toggleMic} style={btnStyle}>🎤 Mic</button>
      </div>

      {/* My Video */}
      <div style={videoContainerStyle}>
        <video ref={myVideo} autoPlay muted playsInline style={videoStyle} />
        <span style={nameTagStyle}>You</span>
      </div>

      {/* Peers */}
      {peers.map((peer) => (
        <VideoComponent key={peer.id} stream={peer.stream} />
      ))}
    </div>
  );
};

// Helper Component for Peers
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

// Styles
const videoContainerStyle = {
  position: "relative",
  width: "100%",
  borderRadius: "8px",
  overflow: "hidden",
  border: "2px solid #3c3c3c",
  marginBottom: "10px",
  background: "black"
};

const videoStyle = {
  width: "100%",
  display: "block",
  transform: "scaleX(-1)" // Mirror effect
};

const nameTagStyle = {
  position: "absolute",
  bottom: "5px",
  left: "5px",
  background: "rgba(0,0,0,0.6)",
  color: "white",
  padding: "2px 5px",
  fontSize: "10px",
  borderRadius: "4px"
};

const btnStyle = {
  flex: 1,
  background: "#3c3c3c",
  color: "white",
  border: "none",
  padding: "8px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px"
};

export default VideoRoom;