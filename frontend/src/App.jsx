import { useEffect , useState} from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000"); // Connect to the backend server

function App() {
  // 1. "message" is what you are typing right now.
  const [message, setMessage] = useState("");

  const [messageReceived, setMessageReceived] = useState("");
  // 2. "messageReceived" is what the other person sent you
  
  const sendMessage = () => {
    socket.emit("send_message", { message }); // Emit the message to the server
  }
  useEffect(() => {
    // This keeps the ear open for messages coming FROM the Backend
    socket.on("receive_message", (data) => {
      setMessageReceived(data.message);
    });
  }, [socket]);

  return (
    <div style={{ padding: "50px" }}>
      <h1>Simul-Project</h1>
      
      <input 
        placeholder="Type something..." 
        onChange={(event) => {
          setMessage(event.target.value);
        }}
      />
      <button onClick={sendMessage}> Send Message </button>

      <h3>Message from other user:</h3>
      <p style={{color: "red", fontSize: "24px"}}>{messageReceived}</p>
    </div>
  );
}

export default App;