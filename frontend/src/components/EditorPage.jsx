import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import Peer from "peerjs"; //import the video tool
import Chat from "./Chat";
import Whiteboard from "./Whiteboard";
import CodeEditor from "./CodeEditor";
import VideoRoom from "./VideoRoom";
import History from "./History";
import AIChat from "./AIChat";
import { useParams } from "react-router-dom"; 
import toast from "react-hot-toast";

const socket = io("http://localhost:5000"); // Connect to the backend server

function EditorPage() {
  const { roomId } = useParams(); // get id from URL

  const [code, setCode] = useState("#Start typing your code here..."); // 2. "code" stores the text in the editor

  const [output, setOutput] = useState(""); // to store output from code execution

  const [room, setRoom] = useState(roomId);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  // create a ref to hold stream 
  const streamRef = useRef(null);

  const [showAIChat, setShowAIChat] = useState(false);

  const [peerInstance, setPeerInstance] = useState(null); // to hold PeerJS instance
  const [myPeerId, setMyPeerId] = useState(""); // to store my own Peer ID

  // we store array of video streams: [{id: "abc", stream:...},{id:"def",stream:...}..]
  const [peers, setPeers] = useState([]);

  const [language, setLanguage] = useState("python"); // default python

  //to take control of editor
  const [writerId, setWriterId] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // for history
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false); //tp toggle sidebar

  // keep track of our own stream so we don't have to ask for camera twice
  const [currentStream, setCurrentStream] = useState(null);

  // chat state
  const [message, setMessage] = useState([]); // store al the chat message
  const [newMessage, setNewMessage] = useState(""); // stores the text you are typing
  const [showChat, setShowChat] = useState(false); // toggle chat sidebar

  //whiteboard state
  const [showBoard, setShowBoard] = useState(false);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // medio controll - camera
  const toggleCamera = () => {
    if (currentStream) {
      const videoTrack = currentStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled; // Toggle on/off
      setIsCameraOn(videoTrack.enabled) //update state
    }
  };

  const toggleMic = () => {
    if (currentStream) {
      const audioTrack = currentStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled; // Toggle Mute/Unmute
      setIsMicOn(audioTrack.enabled); // update State
    }
  };

  const saveCode = () => {
    socket.emit("save_code", { room, code });
    // optional: refresh history immediatly after saving
    getHistory();
    toast.success("code saved successfully!");
  };

  const joinRoom = () => {
    if (room !== "" && myPeerId !== "") {
      // send both room number and my Peer ID to the backend
      socket.emit("join_room", { room, userId: myPeerId });
    } // Join a specific room
  };

  // Helper function to add a new peer to our list
  const addPeer = (id, stream) => {
    setPeers((prevPeers) => {
      //check if we already have this person to avoid duplicates
      if (prevPeers.find((p) => p.id === id)) return prevPeers;
      return [...prevPeers, { id, stream }];
    });
  };

  // 3. when you type in the editor, update "code"
  const handleEditorChange = (value) => {
    setCode(value);
    socket.emit("send_message", { message: value, room }); // Send code changes to the backend
  };

  const runCode = () => {
    socket.emit("run_code", { code, room, language }); // Send code to backend for execution
  };

  const requestControl = () => {
    socket.emit("request_writer", { room });
  };

  //fetch history from backend
  const getHistory = async () => {
    if (!room) return;
    try {
      const res = await fetch(`http://localhost:5000/history/${room}`);
      const data = await res.json();
      // SAFETY CHECK: Only update if it is actually a list (Array)
      if (Array.isArray(data)) {
        setHistory(data);
        setShowHistory(true);
      } else {
        console.error("Error fetching history:", data);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  //start drawing
  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);

    // tell partner to lift their pen and move to this spot
    socket.emit("start_draw",{ room, offsetX, offsetY });
  };

  //stop drawing
  const endDrawing = () => {
    ctxRef.current.closePath();
    setIsDrawing(false);
  };

  // Draw & Send to Socket
  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;

    // Draw on MY screen
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();

    // Send to PARTNER
    socket.emit("draw", { room, offsetX, offsetY });
  };

  // restore an old version
  const restoreHistory = async (oldCode) => {
    setCode(oldCode);
    socket.emit("send_message", { message: oldCode, room }); // tell everyone we reverted
    setShowHistory(false); // Close sidebar
  };

  // FIX: Update room state when URL changes
  useEffect(() => {
    if (roomId) {
      setRoom(roomId);
    }
  }, [roomId]);

  // FIX: Auto-join when Room ID and Peer ID are ready
  useEffect(() => {
    if (room && myPeerId) {
      socket.emit("join_room", { room, userId: myPeerId });
    }
  }, [room, myPeerId]);


  // 1. SETUP CAMERA (Run this immediately!)
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        // Save the stream to state so we can use it for calls later
        setCurrentStream(stream);
        streamRef.current = stream; // save to Ref for PeerJS
      })
      .catch((err) => {
        console.error("Error accessing camera:", err);
      });
  }, []); // Empty array = run once on load

  // 1. Setup PeerJS (With Cleanup to stop "Ghosts")
  useEffect(() => {
    const peer = new Peer();

    peer.on("open", (id) => {
      setMyPeerId(id);
      console.log("My Peer ID is: " + id);
    });

    peer.on("call", (call) => {
      //answer with the stream we stores in the ref
      const stream = streamRef.current;
      if(stream){
        call.answer(stream);
        call.on("stream", (userVideoStream) => {
          addPeer(call.peer, userVideoStream);
        });
      }
    });

    setPeerInstance(peer);

    // FIX 1: Cleanup function (Destroys the old phone if the app restarts)
    return () => {
      peer.destroy();
    };
  }, []); 

  //initialize canvas when opened
  useEffect(() => {
    if (showBoard && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth * 0.8; // 80% width
      canvas.height = window.innerHeight * 0.8;

      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 5;
      ctxRef.current = ctx;
    }
  }, [showBoard]);

  useEffect(() => {
    // This keeps the ear open for messages coming FROM the Backend
    socket.on("receive_message", (data) => {
      setCode(data.message); //4. update "messageReceived" when a message is received
    });

    socket.on("code_saved", (data) => {
      console.log("A version was saved at", data.timestamp);
    });

    // Listener updatae who is allowed to type
    socket.on("update_writer", (writerId) => {
      setWriterId(writerId);
      console.log("New Writter is:", writerId);
    });

    socket.on("receive_output", (data) => {
      setOutput(data); // Update output when received from backend
    });

    socket.on("receive_chat", (data) => {
      setMessage((prev) => [...prev, data]);
      setShowChat(true); //auto-open chat if someone messages
    });

    // LISTEN FOR DRAWING
    socket.on("on_draw", (data) => {
      if (!ctxRef.current) return;
      // Draw what the partner sent
      // Note: This is a simple implementation (lines might look dotty on slow connections)
      ctxRef.current.lineTo(data.offsetX, data.offsetY);
      ctxRef.current.stroke();
    });

    // 2. LISTEN FOR START (App.jsx - Inside useEffect)
    socket.on("start_draw", (data) => {
        if (!ctxRef.current) return;
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(data.offsetX, data.offsetY);
    });

    socket.on("user_joined", (userId) => {
      console.log("New User Connected: " + userId);
      toast.success("A partner joined the room! 🚀");
      const stream = streamRef.current;
      // Get my video/audio stream
      if (peerInstance && stream) {
        // Call the new user with our existing stream
        const call = peerInstance.call(userId, stream);

        call.on("stream", (userVideoStream) => {
          // Show their video in the userVideo box
          addPeer(userId, userVideoStream);
        });
      }
    });

    // Add this inside the useEffect where you listen to socket events
    socket.on("user_disconnected", (userId) => {
        toast.error("A partner left the room.");
    });

    return () => {
      socket.off("receive_message");
      socket.off("receive_output");
      socket.off("user-joined");
      socket.off("update_writer");
      socket.off("code_saved");
      socket.off("receive_chat");
      socket.off("on_draw");
      socket.off("start_draw");
      socket.off("user_disconnected");
    };
  }, [peerInstance]);

  return (
    <div style={{ height: "100vh", display: "flex", background: "#1e1e1e", color: "white", fontFamily: "sans-serif", overflow: "hidden" }}>
      
      {/* 1. ACTIVITY BAR (Far Left - Icons Only) */}
      <div style={{ width: "50px", background: "#333", display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0", borderRight: "1px solid #444", zIndex: 5 }}>
         <div title="Explorer/Video" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ cursor: "pointer", marginBottom: "20px", opacity: sidebarOpen ? 1 : 0.5, fontSize: "24px" }}>
            📝
         </div>
         <div title="Chat" onClick={() => setShowChat(!showChat)} style={{ cursor: "pointer", marginBottom: "20px", fontSize: "24px" }}>
            💬
         </div>
         <div title="History" onClick={getHistory} style={{ cursor: "pointer", marginBottom: "20px", fontSize: "24px" }}>
            📜
         </div>
         <div title="Whiteboard" onClick={() => setShowBoard(!showBoard)} style={{ cursor: "pointer", marginBottom: "20px", fontSize: "24px" }}>
            🎨
         </div>
         <div title="AI Assistant" onClick={() => setShowAIChat(!showAIChat)} style={{ cursor: "pointer", marginBottom: "20px", fontSize: "24px" }}>🤖</div>
      </div>

      {/* 2. SIDEBAR PANEL (Collapsible - Video & Controls) */}
      {sidebarOpen && (
        <div style={{ width: "20%", minWidth: "250px", background: "#252526", borderRight: "1px solid #111", display: "flex", flexDirection: "column" }}>
            {/* COPY ROOM ID FEATURE */}
<div 
    onClick={() => {
        navigator.clipboard.writeText(room);
        toast.success("Room ID copied to clipboard!");
    }}
    style={{ 
        padding: "10px", 
        background: "#333", 
        fontWeight: "bold", 
        fontSize: "12px", 
        letterSpacing: "1px", 
        cursor: "pointer", // Hand cursor
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
    }}
    title="Click to Copy Room ID"
>
    <span>EXPLORER: ROOM {room?.substring(0,8)}...</span>
    <span style={{ fontSize: "14px" }}>📋</span>
</div>
            
            {/* Room ID Input */}
            <div style={{ padding: "10px" }}>
                <div style={{ display: "flex", gap: "5px" }}>
                    <input 
                        placeholder="Room ID" 
                        onChange={(e) => setRoom(e.target.value)}
                        style={{ width: "100%", padding: "5px", background: "#3c3c3c", border: "1px solid #555", color: "white", outline: "none" }} 
                    />
                    <button onClick={joinRoom} style={{ background: "#0e639c", color: "white", border: "none", cursor: "pointer", padding: "0 10px" }}>Join</button>
                </div>
            </div>

            {/* Video Area */}
            <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
                <VideoRoom 
                    stream={currentStream} 
                    peers={peers} 
                    toggleCamera={toggleCamera} 
                    toggleMic={toggleMic} 
                    isMicOn={isMicOn}
                    isCameraOn={isCameraOn}
                />
            </div>
        </div>
      )}

      {/* 3. MAIN EDITOR AREA (Takes remaining space) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: sidebarOpen ? "80%" : "calc(100% - 50px)" }}>
         
         {/* File Tabs (Visual Only) */}
         <div style={{ display: "flex", background: "#252526", height: "35px", alignItems: "flex-end" }}>
            <div style={{ padding: "8px 15px", background: "#1e1e1e", borderTop: "2px solid #007acc", fontSize: "13px", display: "flex", alignItems: "center", cursor: "pointer", color: "white" }}>
                <span style={{ marginRight: "5px" }}>
                    {language === "python" ? "🐍" : language === "javascript" ? "🟨" : language === "cpp" ? "⚙️" : "☕"}
                </span> 
                main.{language === "python" ? "py" : language === "javascript" ? "js" : language === "cpp" ? "cpp" : "java"}
                <span style={{ marginLeft: "10px", fontSize: "12px", color: "#ccc" }}>✕</span>
            </div>
         </div>

         {/* The Code Editor Component */}
         <div style={{ flex: 1, position: "relative" }}>
             <CodeEditor 
                code={code} 
                handleEditorChange={handleEditorChange}
                language={language}
                setLanguage={setLanguage}
                writerId={writerId}
                socketId={socket.id}
                requestControl={requestControl}
                runCode={runCode}
                saveCode={saveCode}
             />
         </div>

         {/* Simple Output Panel */}
         <div style={{ height: "150px", background: "#1e1e1e", borderTop: "1px solid #333", display: "flex", flexDirection: "column" }}>
             <div style={{ padding: "5px 15px", fontSize: "11px", fontWeight: "bold", borderBottom: "1px solid #333", background: "#252526", color: "#ccc" }}>
                OUTPUT
             </div>
             <pre style={{ padding: "10px 15px", margin: 0, fontFamily: "Consolas, monospace", color: "#ccc", flex: 1, overflowY: "auto", fontSize: "13px" }}>
                {output || "Run code to see result..."}
             </pre>
         </div>
      </div>

      {/* 4. OVERLAYS (Chat, Whiteboard, History) */}
      <Chat 
        room={room} 
        socket={socket} 
        messages={message} 
        setMessage={setMessage} 
        showChat={showChat} 
        setShowChat={setShowChat} 
      />
      
      <Whiteboard 
        canvasRef={canvasRef} 
        ctxRef={ctxRef} 
        showBoard={showBoard} 
        setShowBoard={setShowBoard} 
        startDrawing={startDrawing} 
        endDrawing={endDrawing} 
        draw={draw} 
      />
      
      <History 
        history={history} 
        showHistory={showHistory} 
        setShowHistory={setShowHistory} 
        restoreVersion={restoreHistory} 
      />

      <AIChat showAIChat={showAIChat} setShowAIChat={setShowAIChat} code={code} />

    </div>
  );
  
}


export default EditorPage;
