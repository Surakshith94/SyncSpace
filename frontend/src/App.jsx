import { useEffect , useState, useRef} from "react";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";
import Peer from "peerjs"; //import the video tool

const socket = io("http://localhost:5000"); // Connect to the backend server

function App() {
  const [code, setCode] = useState("#Start typing your code here...");// 2. "code" stores the text in the editor

  const [output, setOutput] = useState(""); // to store output from code execution
  
  const [room, setRoom] = useState("");

  // This variable will hold the reference to the HTML video box
  const myVideo = useRef();
  const userVideo = useRef(); // for the Friend's video face
  const [peerInstance, setPeerInstance] = useState(null); // to hold PeerJS instance
  const [myPeerId, setMyPeerId] = useState(""); // to store my own Peer ID

  // keep track of our own stream so we don't have to ask for camera twice
  const [currentStream, setCurrentStream] = useState(null);

  const joinRoom = () => {
    if(room !== "" && myPeerId !== "") {
      // send both room number and my Peer ID to the backend
      socket.emit("join_room",{ room, userId: myPeerId });
    } // Join a specific room
  }

  // 3. when you type in the editor, update "code"
  const handleEditorChange = (value) => {
    setCode(value);
    socket.emit("send_message", { message: value, room }); // Send code changes to the backend
  };

  const runCode = () => {
    socket.emit("run_code", { code, room }); // Send code to backend for execution
  }

  // 1. SETUP CAMERA (Run this immediately!)
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        // Show my face immediately
        if (myVideo.current) {
            myVideo.current.srcObject = stream;
        }
        // Save the stream to state so we can use it for calls later
        setCurrentStream(stream);
    }).catch((err) => {
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
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        
        // Answer with the stream we already captured (currentStream)
        if (currentStream){
          call.answer(currentStream);

          call.on("stream", (userVideoStream) => {
            if (userVideo.current) {
              userVideo.current.srcObject = userVideoStream;
            }
          });
        }
      });
    });

    setPeerInstance(peer);

    // FIX 1: Cleanup function (Destroys the old phone if the app restarts)
    return () => {
        peer.destroy();
    }
  }, [currentStream]); //re-run if currentStream changes

  useEffect(() => {
    // This keeps the ear open for messages coming FROM the Backend
    socket.on("receive_message", (data) => {
      setCode(data.message); //4. update "messageReceived" when a message is received
    });

    socket.on("receive_output", (data) => {
      setOutput(data); // Update output when received from backend
    });


    socket.on("user-connected", (userId) => {
      console.log("New User Connected: " + userId);
      // Get my video/audio stream
      if(peerInstance && currentStream) {
        // Call the new user with our existing stream
        const call = peerInstance.call(userId, currentStream);

        call.on("stream", (userVideoStream) => {
          // Show their video in the userVideo box
          if (userVideo.current) {
            userVideo.current.srcObject = userVideoStream;
          }
        });
      }
    });

    return () => {
      socket.off("receive_message");
      socket.off("receive_output");
      socket.off("user-connected");
    }
  }, [socket, peerInstance, currentStream]);

  

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Simul-Code</h1>
      
      {/* Room Controls */}
      <div style={{ marginBottom: "20px" }}>
        <input 
          placeholder="Room Number..." 
          onChange={(event) => { setRoom(event.target.value); }}
        />
        <button onClick={joinRoom}> Join Room </button>
      </div>

      {/* Video Box */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        
        {/* My Face */}
        <div style={{ border: "2px solid green", padding: "5px" }}>
          <h4>My Video</h4>
          <video playsInline muted ref={myVideo} autoPlay style={{ width: "300px" }} />
        </div>

        {/* Friend's Face */}
        <div style={{ border: "2px solid red", padding: "5px" }}>
          <h4>Partner Video</h4>
          
          {/* ADD "muted" HERE 👇 */}
          <video playsInline ref={userVideo} autoPlay muted style={{ width: "300px" }} />

        </div>

      </div>

      {/* Code Editor */}
      <div style={{ display: "flex", gap: "20px" }}>
        
        {/* Left Side: The Editor */}
        <div style={{ width: "60%" }}>
          <Editor
            height="50vh"
            defaultLanguage="python" // Changed to Python!
            theme="vs-dark"
            value={code}
            onChange={handleEditorChange}
          />
          <br />
          <button 
             onClick={runCode} 
             style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer", backgroundColor: "#4CAF50", color: "white", border: "none" }}
          >
            Run Code
          </button>
        </div>

        {/* Right Side: The Output Brain */}
        <div style={{ width: "40%", height: "50vh", background: "#1e1e1e", color: "white", padding: "10px", overflowY: "auto" }}>
          <h3>Output:</h3>
          <pre>{output}</pre>
        </div>

      </div>
    </div>
  );
}

export default App;