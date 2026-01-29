const express = require('express');
const http = require('http');
const {Server} = require("socket.io");
const cors = require('cors');
const {exec} = require('child_process'); // to run terminal commands if needed
const fs = require('fs'); // to handle file operations if needed
const mongoose = require('mongoose'); 
const { timeStamp } = require('console');


const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // allow JSON data

mongoose.connect('mongodb://127.0.0.1:27017/simulcode_db').then(() => console.log("MongoDB Connected")).catch(err => console.error("MongoDB Error",err));

// Delete the "commit" blueprint
const CommitSchema = new mongoose.Schema({
  room:String,
  code: String,
  timeStamp: { type: Date, default: Date.now},
  author: String //who saved it?
});

const Commit = mongoose.model('Commit',CommitSchema);

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

// NEW API route to get history(Load old commits)
app.get('/history/:room', async (req, res) => {
  try{
    const commits = await Commit.find({ room: req.params.room }.sort({ timestamp: -1}));
    res.join(commits);
  }catch(err){
    res.status(500).json({ error: "Failed to fetch history"});
  }
});

const roomUsers = {};

io.on('connection',(socket) => {
  console.log(`User connected: ${socket.id}`);

  //1. user wants to join a room
  socket.on("join_room", (data) => {
    const { room, userId } = data;
    socket.join(room);

    if(!roomUsers[room]) roomUsers[room] = [];
    roomUsers[room].push({ socketId: socket.id, peerId: userId});
    
    //send existing users to the new guy
    const existingUsers = roomUsers[room].filter(u => u.socketId !== socket.id);
    socket.emit("all_users", existingUsers);

    //Tell others
    socket.to(room).emit("user_joined",userId);
  });

  // 2.user sends a message to a specific room
  socket.on("send_message", (data) => {
    // to(data.room) means only send to people in that room
    socket.to(data.room).emit("receive_message", data);
  });

  // 3. LISTEN FOR "SAVE" (COMMIT)
  socket.on("save_code", async (data) => {
    const { room, code } = data;
    
    // Save to Database
    try {
        const newCommit = new Commit({ room, code, author: socket.id });
        await newCommit.save();
        console.log(`💾 Code saved for room ${room}`);
        
        // Tell everyone: "Version Saved!"
        io.to(room).emit("code_saved", { timestamp: new Date() });
    } catch (err) {
        console.error("Save failed:", err);
    }
  });


  //user.wants to run code 
  socket.on("run_code", (data) => {
    // Here you can implement code execution logic
    // For security reasons, be very careful with executing arbitrary code
    const {code, room} = data;
    const filename = `test-${socket.id}.py`;

    //A.save code to a temporary file 
    fs.writeFileSync(filename, code);

    //B.run the file using python
    exec(`python ${filename}`, (error, stdout, stderr) => {
      //C.check for errors
      if (error) {
        //send error back to room
        io.to(room).emit("receive_output",stderr);
      }
      else {
        //send output back to room
        io.to(room).emit("receive_output", stdout);
      }
      try{ fs.unlinkSync(filename); } catch (e) {}
    });
  });

  //4. handle "take control" (switch writer)
  socket.on("request_writer",(data) => {
    const {room } = data;
    // Broadcast to the WHOLE room (including the sender): "the new writer is this user")
    io.in(room).emit("update_writer", socket.id);
  });

  socket.on('disconnect', () => {
    for (const room in roomUsers) {
        const index = roomUsers[room].findIndex(u => u.socketId === socket.id);
        if (index !== -1) {
            const user = roomUsers[room][index];
            roomUsers[room].splice(index, 1);
            io.to(room).emit("user_disconnected", user.peerId);
            break;
        }
    }
  });

});
server.listen(5000, () => {
  console.log("SERVER RUNNING");      
}
);
