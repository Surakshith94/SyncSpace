const express = require('express');
const http = require('http');
const {Server} = require("socket.io");
const cors = require('cors');
const {exec} = require('child_process'); // to run terminal commands if needed
const fs = require('fs'); // to handle file operations if needed


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
    // data is now an object: { room: "99", userId: "abc-123" }
    socket.join(data.room);
    console.log(`User ${socket.id} joined room ${data.room} with Video ID: ${data.userId}`);

    //Brodcast to other users in the room that a new user has joined
    socket.to(data.room).emit("user-connected", data.userId);
  
  });

  // 2.user sends a message to a specific room
  socket.on("send_message", (data) => {
    // to(data.room) means only send to people in that room
    socket.to(data.room).emit("receive_message", data);
  });
  //user.wants to run code 
  socket.on("run_code", (data) => {
    // Here you can implement code execution logic
    // For security reasons, be very careful with executing arbitrary code
    const {code, room} = data;

    //A.save code to a temporary file called test.py
    fs.writeFileSync('test.py', code);

    //B.run the file using python
    exec('python test.py', (error, stdout, stderr) => {
      //C.check for errors
      if (error) {
        //send error back to room
        io.to(room).emit("receive_output",stderr);
      }
      else {
        //send output back to room
        io.to(room).emit("receive_output", stdout);
      }
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });

});
server.listen(5000, () => {
  console.log("SERVER RUNNING");      
}
);
