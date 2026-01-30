import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";
import Peer from "peerjs"; //import the video tool

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
    };
  }, [socket, peerInstance, currentStream]);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Simul-Code</h1>

      {/* Room Controls */}
      <div style={{ marginBottom: "20px" }}>
        <input
          placeholder="Room Number..."
          onChange={(event) => {
            setRoom(event.target.value);
          }}
        />
        <button onClick={joinRoom}> Join Room </button>

        {/* Added Buttons to use your Toggle Functions */}
        <button onClick={toggleCamera} style={{ marginLeft: "10px" }}>
          Toggle Cam
        </button>
        <button onClick={toggleMic} style={{ marginLeft: "10px" }}>
          Toggle Mic
        </button>
      </div>

      {/* Video Grid Section */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        {/* My Video */}
        <div style={{ width: "200px", border: "2px solid green" }}>
          <video
            ref={myVideo}
            autoPlay
            muted
            playsInline
            style={{ width: "100%" }}
          />
        </div>

        {/* Friend Videos (Loop) */}
        {peers.map((peer) => (
          // FIXED: This Component is now defined at the bottom!
          <VideoComponent key={peer.id} stream={peer.stream} />
        ))}
      </div>

      {/* Editor & Output Section */}
      <div style={{ display: "flex", gap: "20px" }}>
        {/* Left Side: Editor + Switch Control */}
        <div style={{ width: "60%" }}>
          {/* Switch Control */}
          <div style={{ marginBottom: "10px" }}>
            {socket.id === writerId ? (
              <span style={{ color: "#4CAF50", fontWeight: "bold" }}>
                {" "}
                ✏️ You are writing...{" "}
              </span>
            ) : (
              <button
                onClick={requestControl}
                style={{
                  background: "#2196F3",
                  color: "white",
                  padding: "8px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ✋ Take Control
              </button>
            )}

            {/* History Button */}
            <button
              onClick={getHistory}
              style={{
                cursor: "pointer",
                background: "#607D8B",
                color: "white",
                border: "none",
                padding: "5px",
              }}
            >
              {" "}
              📜 View History{" "}
            </button>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ marginRight: "10px", fontWeight: "bold" }}>
              Language:
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ padding: "5px" }}
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++ (Requires g++)</option>
              <option value="java">Java (Requires JDK)</option>
            </select>
          </div>

          <Editor
            height="50vh"
            defaultLanguage={language}
            theme="vs-dark"
            value={code}
            onChange={handleEditorChange}
            options={{ readOnly: socket.id !== writerId }}
          />
          <br />
          <button
            onClick={runCode}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
            }}
          >
            Run Code
          </button>
          <button
            onClick={saveCode}
            style={{
              marginTop: "10px",
              marginLeft: "10px",
              padding: "10px",
              background: "#FF9800",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            💾 Commit / Save
          </button>
        </div>

        {/* Right Side: Output */}
        <div
          style={{
            width: "40%",
            height: "50vh",
            background: "#1e1e1e",
            color: "white",
            padding: "10px",
            overflowY: "auto",
          }}
        >
          <h3>Output:</h3>
          <pre>{output}</pre>
        </div>
      </div>

      {/* NEW: HISTORY SIDEBAR (Only visible when showHistory is true) */}
      {showHistory && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "300px",
            height: "100%",
            background: "white",
            borderLeft: "2px solid black",
            padding: "20px",
            boxShadow: "-5px 0 15px rgba(0,0,0,0.3)",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2>Version History</h2>
            <button onClick={() => setShowHistory(false)}>X</button>
          </div>
          <hr />
          <div style={{ overflowY: "auto", height: "90%" }}>
            {history.length === 0 ? <p>No history found.</p> : null}

            {history.map((commit, index) => (
              <div
                key={index}
                style={{
                  borderBottom: "1px solid #ccc",
                  padding: "10px",
                  cursor: "pointer",
                  background: "#f9f9f9",
                  marginBottom: "5px",
                }}
                onClick={() => restoreHistory(commit.code)}
              >
                <strong>
                  {new Date(commit.timestamp).toLocaleTimeString()}
                </strong>
                <p style={{ fontSize: "12px", color: "gray" }}>
                  {commit.code.substring(0, 30)}...
                </p>
                <small>Click to Restore</small>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// FIXED: Added the missing helper component here
const VideoComponent = ({ stream }) => {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div style={{ border: "2px solid red", padding: "5px", width: "200px" }}>
      <h4>Partner</h4>
      <video ref={videoRef} autoPlay playsInline style={{ width: "100%" }} />
    </div>
  );
};

export default App;
