import { useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000"); // Connect to the backend server

function App() {

  useEffect(() => {
    //this code will when the app starts
    console.log("Connecting to socket server...");
  }, []);

  return (
    <div style={{padding: "20px"}} >
      <h1>Socket.io Frontend</h1>
      <p>Check the console for connection status.</p>
    </div>
  );
}

export default App;