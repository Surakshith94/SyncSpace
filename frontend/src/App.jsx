import { useEffect , useState, useRef} from "react";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";

const socket = io("http://localhost:5000"); // Connect to the backend server

function App() {
  const [code, setCode] = useState("#Start typing your code here...");// 2. "code" stores the text in the editor

  const [output, setOutput] = useState(""); // to store output from code execution
  
  const [room, setRoom] = useState("");

  // This variable will hold the reference to the HTML video box
  const myVideo = useRef();

  const joinRoom = () => {
    if(room !== ""){
      socket.emit("join_room", room);
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

  useEffect(() => {
    // This keeps the ear open for messages coming FROM the Backend
    socket.on("receive_message", (data) => {
      setCode(data.message); //4. update "messageReceived" when a message is received
    });

    socket.on("receive_output", (data) => {
      setOutput(data); // Update output when received from backend
    });

    //1. Ask for permission to access the camera and mic
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
  // 2.If user says yes, show their own video in the video box
      if (myVideo.current) {
        myVideo.current.srcObject = stream;
      }
    })
    .catch((err) => console.error("Error accessing media devices.", err));
  }, [socket]);

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
          {/* "muted" is important so you don't hear your own echo! */}
          <video playsInline muted ref={myVideo} autoPlay style={{ width: "300px" }} />
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