const express = require('express');
const http = require('http');
const {Server} = require("socket.io");
const cors = require('cors');


const app = express();
app.use(cors()); // Enable CORS for all routes

const server = http.createServer(app); // we wrap express inside raw HTTP server

const io = new Server (server, {
  cors: {
    origin: "http://localhost:5173", // Allow requests from this origin
    methods: ["GET", "POST"]
  }
}); //We are explicitly telling the server, "Trust the Frontend that lives on port 5173."

app.get('/', (req,res) => {
  res.send('Hello World!');
})

io.on('connection',(socket) => {
  console.log(`User connected: ${socket.id}`);

  // 1. Listen for the "send_message" event from the Frontend
  socket.on("send_message", (data) => {
    // 2. When we receive a message, we emit it to all connected clients
    socket.broadcast.emit("receive_message", data);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(5000, () => {
  console.log("SERVER RUNNING");      
}
)