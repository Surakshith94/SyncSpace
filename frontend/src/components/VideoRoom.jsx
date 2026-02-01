import { useEffect, useRef } from "react";

const VideoRoom = ({ stream, peers, toggleCamera, toggleMic, isMicOn, isCameraOn }) => {
  const localVideoRef = useRef();

  // FIX: Force video to play when stream is ready
  useEffect(() => {
    const video = localVideoRef.current;
    if (video && stream) {
      video.srcObject = stream;
      video.play().catch((e) => console.error("Error playing video:", e));
    }
  }, [stream]);

  return (
    <div style={{ 
      display: "flex", flexDirection: "column", gap: "10px", 
      background: "#252526", padding: "10px", borderRadius: "8px", 
      height: "100%", overflowY: "auto" 
    }}>
      
      {/* HEADER */}
      <h3 style={{ 
        color: "#ccc", margin: "0 0 5px 0", fontSize: "12px", 
        textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #333", paddingBottom: "5px"
      }}>
        🎥 Team ({peers.length + 1})
      </h3>

      {/* CONTROLS */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "5px" }}>
        <button 
            onClick={toggleCamera} 
            style={{
              ...btnStyle, 
              background: isCameraOn ? "#3c3c3c" : "#d9534f",
              border: isCameraOn ? "1px solid #555" : "none"
            }} 
            title="Toggle Camera"
        >
            {isCameraOn ? "📷 On" : "📷 Off"}
        </button>
        <button 
            onClick={toggleMic} 
            style={{
              ...btnStyle, 
              background: isMicOn ? "#3c3c3c" : "#d9534f",
              border: isMicOn ? "1px solid #555" : "none"
            }} 
            title="Toggle Microphone"
        >
            {isMicOn ? "🎤 On" : "🔇 Off"}
        </button>
      </div>

      {/* MY VIDEO */}
      <div style={videoContainerStyle}>
        <video ref={localVideoRef} muted playsInline style={videoStyle} />
        <span style={nameTagStyle}>You {isMicOn ? "" : "(Muted)"}</span>
      </div>

      {/* PEER VIDEOS */}
      {peers.length === 0 ? (
        <div style={{ padding: "20px", textAlign: "center", color: "#666", fontSize: "12px", border: "1px dashed #444", borderRadius: "8px" }}>
           Waiting for others... <br/>
           <span style={{ fontSize: "20px", display: "block", marginTop: "5px" }}>⏳</span>
        </div>
      ) : (
        peers.map((peer) => (
          <VideoComponent key={peer.id} stream={peer.stream} />
        ))
      )}
    </div>
  );
};

const VideoComponent = ({ stream }) => {
  const videoRef = useRef();
  
  // FIX: Force remote video to play
  useEffect(() => {
    const video = videoRef.current;
    if (video && stream) {
        video.srcObject = stream;
        video.play().catch((e) => console.error("Remote video error:", e));
    }
  }, [stream]);

  return (
    <div style={videoContainerStyle}>
      <video ref={videoRef} playsInline style={videoStyle} />
      <span style={nameTagStyle}>Partner</span>
    </div>
  );
};

// --- STYLES ---
const videoContainerStyle = {
  position: "relative", width: "100%", borderRadius: "8px", overflow: "hidden", 
  border: "1px solid #3c3c3c", marginBottom: "10px", background: "black",
  aspectRatio: "16/9"
};

const videoStyle = { 
  width: "100%", height: "100%", 
  display: "block", objectFit: "cover", 
  transform: "scaleX(-1)"
};

const nameTagStyle = { 
  position: "absolute", bottom: "8px", left: "8px", 
  background: "rgba(0,0,0,0.6)", color: "white", 
  padding: "3px 8px", fontSize: "11px", borderRadius: "4px",
  backdropFilter: "blur(2px)"
};

const btnStyle = { 
  flex: 1, color: "white", padding: "8px", 
  borderRadius: "4px", cursor: "pointer", 
  fontSize: "12px", fontWeight: "bold",
  transition: "all 0.2s"
};

export default VideoRoom;