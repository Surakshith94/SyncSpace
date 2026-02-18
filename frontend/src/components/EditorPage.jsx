import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import Peer from "peerjs";
import Chat from "./Chat";
import Whiteboard from "./Whiteboard";
import CodeEditor from "./CodeEditor";
import VideoRoom from "./VideoRoom";
import History from "./History";
import AIChat from "./AIChat";
import { useParams, useNavigate } from "react-router-dom"; // Added useNavigate
import toast from "react-hot-toast";

// Dynamic URL handling
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const socket = io(BACKEND_URL);

function EditorPage() {
  const { roomId } = useParams();
  const navigate = useNavigate(); // For Home Button

  // STATE
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [room, setRoom] = useState(roomId);
  const [language, setLanguage] = useState("python");
  const [writerId, setWriterId] = useState("");

  const [history, setHistory] = useState([]);

  // Add this line with your other states
  const [socketId, setSocketId] = useState(socket.id);

  //track real user
  const [connectedUsers, setConnectedUsers] = useState([]);
  
  // UI STATE
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  // VIDEO STATE
  const [peers, setPeers] = useState([]);
  const [myPeerId, setMyPeerId] = useState("");
  const [peerInstance, setPeerInstance] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  
  // REFS
  const streamRef = useRef(null); 
  const [currentStream, setCurrentStream] = useState(null); // Triggers UI render
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // CHAT STATE
  const [message, setMessage] = useState([]);

  // --- 1. MEDIA CONTROLS (Fixed) ---
  const toggleCamera = () => {
    // 1. Get the real stream from Ref
    const stream = streamRef.current; 
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      // 2. Toggle the hardware
      videoTrack.enabled = !videoTrack.enabled;
      // 3. Update the UI state
      setIsCameraOn(videoTrack.enabled);
    }
  };

  const toggleMic = () => {
    const stream = streamRef.current;
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  };

  const goHome = () => {
    // Disconnect peer before leaving to avoid ghosts
    if (peerInstance) peerInstance.destroy();
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop()); // Turn off camera light
    }
    navigate("/");
  };

  // --- 2. SOCKET ACTIONS ---
  const saveCode = () => {
    socket.emit("save_code", { room, code });
    getHistory();
    toast.success("Code saved to History! 💾");
  };

  const joinRoom = () => {
    if (room && myPeerId) {
      socket.emit("join_room", { room, userId: myPeerId });
    }
  };

  const addPeer = (id, stream) => {
    setPeers((prev) => {
      if (prev.find((p) => p.id === id)) return prev;
      return [...prev, { id, stream }];
    });
  };

  const handleEditorChange = (value) => {
    if(socketId !== writerId) return;
    setCode(value);
    socket.emit("send_message", { message: value, room });
  };

  const runCode = () => socket.emit("run_code", { code, room, language });
  const requestControl = () => socket.emit("request_writer", { room });

  const getHistory = async () => {
    if (!room) return;
    try {
      const res = await fetch(`${BACKEND_URL}/history/${room}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistory(data);
        setShowHistory(true);
      }
    } catch (err) { console.error("History Error", err); }
  };

  const restoreHistory = (oldCode) => {
    setCode(oldCode);
    socket.emit("send_message", { message: oldCode, room });
    setShowHistory(false);
    toast.success("Version Restored");
  };

  // --- 3. WHITEBOARD LOGIC ---
  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    socket.emit("start_draw",{ room, offsetX, offsetY });
  };

  const endDrawing = () => {
    ctxRef.current.closePath();
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
    socket.emit("draw", { room, offsetX, offsetY });
  };

  // --- 4. USE EFFECTS ---

  useEffect(() => {
    if (roomId) setRoom(roomId);
  }, [roomId]);

  useEffect(() => {
    if (room && myPeerId) {
      socket.emit("join_room", { room, userId: myPeerId });
    }
  }, [room, myPeerId]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ 
    video: { 
        width: { ideal: 640 }, // Lower resolution (480p/360p is faster)
        height: { ideal: 480 },
        frameRate: { ideal: 15, max: 20 } // Lower FPS = Less lag
    }, 
    audio: {
        echoCancellation: true, // Helps with audio feedback
        noiseSuppression: true
    } 
})
      .then((stream) => {
        setCurrentStream(stream);
        streamRef.current = stream;
      })
      .catch((err) => console.error("Camera Error:", err));
  }, []);

  // Add this useEffect to capture the ID when connection finishes
useEffect(() => {
    // If already connected, set it immediately
    if (socket.connected) {
        setSocketId(socket.id);
    }

    // Listen for the "connect" event (for slower connections)
    const onConnect = () => {
        setSocketId(socket.id);
    };

    socket.on("connect", onConnect);

    return () => {
        socket.off("connect", onConnect);
    };
}, []);

  useEffect(() => {
    const peer = new Peer(undefined, {
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" }
        ]
      }
    });
    peer.on('error', (err) => {
        console.error("PeerJS Error:", err);
        toast.error("Video Connection Failed: " + err.type);
    });
    peer.on("open", (id) => setMyPeerId(id));
    
    peer.on("call", (call) => {
      const stream = streamRef.current;
      if (stream) {
        call.answer(stream);
        call.on("stream", (userVideoStream) => addPeer(call.peer, userVideoStream));
      }
    });

    setPeerInstance(peer);
    return () => peer.destroy();
  }, []);

  useEffect(() => {
    if (showBoard && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth * 0.8;
      canvas.height = window.innerHeight * 0.8;
      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 5;
      ctxRef.current = ctx;
    }
  }, [showBoard]);

  // FIX: Socket Listeners with proper cleanup to prevent double notifications
  useEffect(() => {
    // Define listeners
    const handleReceiveMessage = (data) => {
      if(socketId == writerId) return;
      setCode(data.message);
    }
    const handleCodeSaved = (data) => console.log("Saved", data.timestamp);
    const handleUpdateWriter = (writerId) => setWriterId(writerId);
    const handleReceiveOutput = (data) => setOutput(data);
    const handleReceiveChat = (data) => {
        setMessage((prev) => [...prev, data]);
        setShowChat(true);
        toast("New Message 💬", { icon: '📩', style: { borderRadius: '10px', background: '#333', color: '#fff' } });
    };
    const handleUserJoined = (userId) => {
      toast.success("A partner joined the room! 🚀");
      setConnectedUsers((prev) => [...prev, userId]); // update count;
      const stream = streamRef.current;
      if (peerInstance && stream) {
        const call = peerInstance.call(userId, stream);
        call.on("stream", (userVideoStream) => addPeer(userId, userVideoStream));
      }
    };

    // 2. NEW: Handle Existing Users (I just joined, I call THEM)
    const handleAllUsers = (users) => {
        setConnectedUsers(users); //set Initial count
        const stream = streamRef.current;
        if (!stream || !peerInstance) return;
        
        users.forEach(user => {
            // Call every user already in the room
            const call = peerInstance.call(user.peerId, stream);
            call.on("stream", (userVideoStream) => addPeer(user.peerId, userVideoStream));
        });
    };

    const handleUserDisconnected = (userId) => {
        toast.error("A partner left the room.");
        setPeers(prev => prev.filter(p => p.id !== userId)); 
    };
    const handleOnDraw = (data) => {
        if (!ctxRef.current) return;
        ctxRef.current.lineTo(data.offsetX, data.offsetY);
        ctxRef.current.stroke();
    };
    const handleStartDraw = (data) => {
        if (!ctxRef.current) return;
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(data.offsetX, data.offsetY);
    };

    // Attach listeners
    socket.on("receive_message", handleReceiveMessage);
    socket.on("code_saved", handleCodeSaved);
    socket.on("update_writer", handleUpdateWriter);
    socket.on("receive_output", handleReceiveOutput);
    socket.on("receive_chat", handleReceiveChat);
    socket.on("user_joined", handleUserJoined);
    socket.on("all_users", handleAllUsers); // <--- VITAL FIX
    socket.on("user_disconnected", handleUserDisconnected);
    socket.on("on_draw", handleOnDraw);
    socket.on("start_draw", handleStartDraw);

    // CLEANUP: Remove listeners when component unmounts (Fixes Double Toast)
    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("code_saved", handleCodeSaved);
      socket.off("update_writer", handleUpdateWriter);
      socket.off("receive_output", handleReceiveOutput);
      socket.off("receive_chat", handleReceiveChat);
      socket.off("user_joined", handleUserJoined);
      socket.off("all_users", handleAllUsers);
      socket.off("user_disconnected", handleUserDisconnected);
      socket.off("on_draw", handleOnDraw);
      socket.off("start_draw", handleStartDraw);
    };
  }, [peerInstance]);

  return (
    <div style={{ height: "100vh", display: "flex", background: "#1e1e1e", color: "white", fontFamily: "sans-serif", overflow: "hidden" }}>
      
      {/* 1. ACTIVITY BAR */}
      <div style={{ width: "50px", background: "#333", display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0", borderRight: "1px solid #444", zIndex: 5 }}>
         {/* HOME BUTTON */}
         <div title="Go Home" onClick={goHome} style={{ cursor: "pointer", marginBottom: "25px", fontSize: "24px", color: "#e06c75" }}>🏠</div>
         
         <div title="Explorer" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ cursor: "pointer", marginBottom: "25px", opacity: sidebarOpen ? 1 : 0.5, fontSize: "24px" }}>📝</div>
         <div title="AI Assistant" onClick={() => setShowAIChat(!showAIChat)} style={{ cursor: "pointer", marginBottom: "25px", fontSize: "24px" }}>🤖</div>
         <div title="Chat" onClick={() => setShowChat(!showChat)} style={{ cursor: "pointer", marginBottom: "25px", fontSize: "24px" }}>💬</div>
         <div title="History" onClick={getHistory} style={{ cursor: "pointer", marginBottom: "25px", fontSize: "24px" }}>📜</div>
         <div title="Whiteboard" onClick={() => setShowBoard(!showBoard)} style={{ cursor: "pointer", marginBottom: "25px", fontSize: "24px" }}>🎨</div>
      </div>

      {/* 2. SIDEBAR PANEL */}
      {sidebarOpen && (
        <div style={{ width: "20%", minWidth: "250px", background: "#252526", borderRight: "1px solid #111", display: "flex", flexDirection: "column" }}>
            <div 
                onClick={() => {
                    navigator.clipboard.writeText(room);
                    toast.success("Room ID copied!");
                }}
                style={{ padding: "10px", background: "#333", fontWeight: "bold", fontSize: "12px", letterSpacing: "1px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                title="Click to Copy"
            >
                <span>EXPLORER: {room?.substring(0,8)}...</span>
                <span style={{ fontSize: "14px" }}>📋</span>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
                <VideoRoom 
                    stream={currentStream} 
                    peers={peers} 
                    toggleCamera={toggleCamera} 
                    toggleMic={toggleMic} 
                    isMicOn={isMicOn}
                    isCameraOn={isCameraOn}
                    userCount={connectedUsers.length + 1}
                />
            </div>
        </div>
      )}

      {/* 3. EDITOR & OUTPUT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: sidebarOpen ? "80%" : "calc(100% - 50px)" }}>
         <div style={{ display: "flex", background: "#252526", height: "35px", alignItems: "flex-end" }}>
            <div style={{ padding: "8px 15px", background: "#1e1e1e", borderTop: "2px solid #007acc", fontSize: "13px", display: "flex", alignItems: "center", cursor: "pointer", color: "white" }}>
                <span style={{ marginRight: "5px" }}>{language === "python" ? "🐍" : language === "javascript" ? "🟨" : language === "cpp" ? "⚙️" : "☕"}</span> 
                main.{language === "python" ? "py" : language === "javascript" ? "js" : language === "cpp" ? "cpp" : "java"}
                <span style={{ marginLeft: "10px", fontSize: "12px", color: "#ccc" }}>✕</span>
            </div>
         </div>

         <div style={{ flex: 1, position: "relative" }}>
             <CodeEditor 
                code={code} 
                handleEditorChange={handleEditorChange}
                language={language}
                setLanguage={setLanguage}
                writerId={writerId}
                socketId={socketId}
                requestControl={requestControl}
                runCode={runCode}
                saveCode={saveCode}
             />
         </div>

         <div style={{ height: "150px", background: "#1e1e1e", borderTop: "1px solid #333", display: "flex", flexDirection: "column" }}>
             <div style={{ padding: "5px 15px", fontSize: "11px", fontWeight: "bold", borderBottom: "1px solid #333", background: "#252526", color: "#ccc" }}>OUTPUT</div>
             <pre style={{ padding: "10px 15px", margin: 0, fontFamily: "Consolas, monospace", color: "#ccc", flex: 1, overflowY: "auto", fontSize: "13px" }}>
                {output || "Run code to see result..."}
             </pre>
         </div>
      </div>

      <Chat room={room} socket={socket} messages={message} setMessage={setMessage} showChat={showChat} setShowChat={setShowChat} />
      <Whiteboard canvasRef={canvasRef} ctxRef={ctxRef} showBoard={showBoard} setShowBoard={setShowBoard} startDrawing={startDrawing} endDrawing={endDrawing} draw={draw} />
      <History history={history} showHistory={showHistory} setShowHistory={setShowHistory} restoreVersion={restoreHistory} />
      <AIChat showAIChat={showAIChat} setShowAIChat={setShowAIChat} code={code} />

    </div>
  );
}

export default EditorPage;