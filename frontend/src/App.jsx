import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";
import Peer from "peerjs"; //import the video tool
import Chat from "./components/Chat";
import Whiteboard from "./components/Whiteboard";
import CodeEditor from "./components/CodeEditor";
import VideoRoom from "./components/VideoRoom";
import History from "./components/History";

const socket = io("http://localhost:5000"); // Connect to the backend server

function App() {
  const [code, setCode] = useState("#Start typing your code here..."); // 2. "code" stores the text in the editor

  const [output, setOutput] = useState(""); // to store output from code execution

  const [room, setRoom] = useState("");

  // This variable will hold the reference to the HTML video box
  const myVideo = useRef();
  const [peerInstance, setPeerInstance] = useState(null); // to hold PeerJS instance
  const [myPeerId, setMyPeerId] = useState(""); // to store my own Peer ID

  // we store array of video streams: [{id: "abc", stream:...},{id:"def",stream:...}..]
  const [peers, setPeers] = useState([]);

  const [language, setLanguage] = useState("python"); // default python

  //to take control of editor
  const [writerId, setWriterId] = useState("");

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
    }
  };

  const toggleMic = () => {
    if (currentStream) {
      const audioTrack = currentStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled; // Toggle Mute/Unmute
    }
  };

  const saveCode = () => {
    socket.emit("save_code", { room, code });
    // optional: refresh history immediatly after saving
    getHistory();
    alert("Code Committed/Saved to Database!");
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


  // 1. SETUP CAMERA (Run this immediately!)
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        // Show my face immediately
        if (myVideo.current) {
          myVideo.current.srcObject = stream;
        }
        // Save the stream to state so we can use it for calls later
        setCurrentStream(stream);
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
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          // Answer with the stream we already captured (currentStream)
          if (currentStream) {
            call.answer(currentStream);

            call.on("stream", (userVideoStream) => {
              addPeer(call.peer, userVideoStream);
            });
          }
        });
    });

    setPeerInstance(peer);

    // FIX 1: Cleanup function (Destroys the old phone if the app restarts)
    return () => {
      peer.destroy();
    };
  }, [currentStream]); //re-run if currentStream changes

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

    socket.on("user-connected", (userId) => {
      console.log("New User Connected: " + userId);
      // Get my video/audio stream
      if (peerInstance && currentStream) {
        // Call the new user with our existing stream
        const call = peerInstance.call(userId, currentStream);

        call.on("stream", (userVideoStream) => {
          // Show their video in the userVideo box
          addPeer(userId, userVideoStream);
        });
      }
    });

    return () => {
      socket.off("receive_message");
      socket.off("receive_output");
      socket.off("user-connected");
      socket.off("update_writer");
      socket.off("code_saved");
      socket.off("receive_chat");
      socket.off("on_draw");
      socket.off("start_draw");
    };
  }, [socket, peerInstance, currentStream]);

  return (
    <div style={{ height: "100vh", display: "flex", background: "#1e1e1e", color: "white", fontFamily: "sans-serif", overflow: "hidden" }}>
      
      {/* 1. LEFT SIDEBAR (Video & Controls) - 20% width */}
      <div style={{ width: "20%", borderRight: "1px solid #333", padding: "10px", display: "flex", flexDirection: "column" }}>
        
        {/* Room Header */}
        <div style={{ marginBottom: "20px", textAlign: "center" }}>
           <h2 style={{ margin: 0, color: "#007acc" }}>SimulCode</h2>
           <p style={{ fontSize: "12px", color: "#888" }}>Room: {room || "Not Joined"}</p>
           
           <div style={{ display: "flex", gap: "5px", marginTop: "10px" }}>
              <input 
                placeholder="ID..." 
                onChange={(e) => setRoom(e.target.value)}
                style={{ width: "60%", padding: "5px", background: "#333", border: "none", color: "white" }} 
              />
              <button onClick={joinRoom} style={{ flex: 1, background: "#444", color: "white", border: "none", cursor: "pointer" }}>Join</button>
           </div>
        </div>

        {/* Video Component */}
        <VideoRoom 
            myVideo={myVideo} 
            peers={peers} 
            toggleCamera={toggleCamera} 
            toggleMic={toggleMic} 
        />

        <History 
    history={history}
    showHistory={showHistory}
    setShowHistory={setShowHistory}
    restoreVersion={restoreHistory} 
/>

        {/* Extra Tools */}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "5px" }}>
            <button onClick={() => setShowChat(!showChat)} style={{ padding: "10px", background: "#333", color: "white", border: "none", cursor: "pointer" }}>💬 Chat</button>
            <button onClick={() => setShowBoard(!showBoard)} style={{ padding: "10px", background: "#333", color: "white", border: "none", cursor: "pointer" }}>🎨 Whiteboard</button>
            <button onClick={getHistory} style={{ padding: "10px", background: "#333", color: "white", border: "none", cursor: "pointer" }}>📜 History</button>
        </div>
      </div>

      {/* 2. MIDDLE (Code Editor) - 50% width */}
      <div style={{ width: "50%", borderRight: "1px solid #333" }}>
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

      {/* 3. RIGHT SIDEBAR (Output) - 30% width */}
      <div style={{ width: "30%", background: "#1e1e1e", display: "flex", flexDirection: "column" }}>
         <div style={{ padding: "10px", background: "#252526", borderBottom: "1px solid #333", fontWeight: "bold" }}>
            🖥️ Terminal Output
         </div>
         <pre style={{ padding: "15px", color: "#d4d4d4", fontFamily: "monospace", overflow: "auto", flex: 1 }}>
            {output || "Run code to see output..."}
         </pre>
      </div>

      {/* Overlays */}
      <Chat room={room} socket={socket} messages={message} setMessage={setMessage} showChat={showChat} setShowChat={setShowChat} />
      <Whiteboard canvasRef={canvasRef} ctxRef={ctxRef} showBoard={showBoard} setShowBoard={setShowBoard} startDrawing={startDrawing} endDrawing={endDrawing} draw={draw} />
      {/* (You can style the History Sidebar similarly later) */}

    </div>
  );
}


export default App;
