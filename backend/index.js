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

  //1. user wants to join a room
  socket.on("join_room", (data) => {
    socket.join(data);
    console.log(`User with ID: ${socket.id} joined room: ${data}`);
  
  });

  // 2.user sends a message to a specific room
  socket.on("send_message", (data) => {
    // to(data.room) means only send to people in that room
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(5000, () => {
  console.log("SERVER RUNNING");      
}
)