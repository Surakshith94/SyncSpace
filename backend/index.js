const express = require('express');
const http = require('http');
const {Server} = require("socket.io");
const cors = require('cors');
const {exec} = require('child_process'); // to run terminal commands if needed
const fs = require('fs'); // to handle file operations if needed
const mongoose = require('mongoose'); 
const { GoogleGenerativeAI } = require("@google/generative-ai");

const dotenv =  require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/simulcode_db';
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // allow JSON data

// 3. Setup CORS (Allow Frontend to talk to Backend)
app.use(cors({
    origin: ["http://localhost:5173", FRONTEND_URL], // Allow local + deployed URL
    methods: ["GET", "POST"]
}));

mongoose.connect(MONGODB_URI).then(() => console.log("MongoDB Connected")).catch(err => console.error("MongoDB Error",err));

let model;
if(process.env.API_KEY){
  const genAI = new GoogleGenerativeAI(process.env.API_KEY)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
}else {
    console.warn("⚠️  Warning: API_KEY is missing. AI features will not work.");
}

// Delete the "commit" blueprint
const CommitSchema = new mongoose.Schema({
  room:String,
  code: String,
  timestamp: { type: Date, default: Date.now},
  author: String //who saved it?
});

const Commit = mongoose.model('Commit',CommitSchema);


const server = http.createServer(app); // we wrap express inside raw HTTP server

const io = new Server (server, {
  cors: {
    origin: ["http://localhost:5173",FRONTEND_URL], // Allow requests from this origin
    methods: ["GET", "POST"]
  }
}); //We are explicitly telling the server, "Trust the Frontend that lives on port 5173."

app.get('/', (req,res) => {
  res.send('Hello World!');
}) 

//ai route
app.post('/ask-ai', async (req, res) => {
  const { prompt, code } = req.body;

  try {
        const result = await model.generateContent(`
            You are an expert coding assistant.
            Here is the user's code:
            ${code}

            User Question: ${prompt}

            Answer nicely and briefly.
        `);
        const response = await result.response;
        const text = response.text();
        res.json({ result: text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ result: "AI Error: Failed to generate response." });
    }
});

// NEW API route to get history(Load old commits)
app.get('/history/:room', async (req, res) => {
  try{
    const commits = await Commit.find({ room: req.params.room }).sort({ timestamp: -1});
    res.json(commits);
  }catch(err){
    res.status(500).json({ error: "Failed to fetch history"});
  }
});

const roomUsers = {};
const roomWriters = {}; // track who is writing in each room
const roomCode = {}; // Server memory for code

io.on('connection',(socket) => {
  console.log(`User connected: ${socket.id}`);

  //1. user wants to join a room
  socket.on("join_room", (data) => {
    const { room, userId } = data;
    socket.join(room);

    if(!roomUsers[room]) roomUsers[room] = [];
    roomUsers[room].push({ socketId: socket.id, peerId: userId});

    // 1. SYNC CODE: If there is code in memory, send it to the new joiner
        if (roomCode[room]) {
            socket.emit("receive_message", { message: roomCode[room] });
        }
    
    // If no writer exists (first user), make THIS user the writer
    if (!roomWriters[room]) {
        roomWriters[room] = socket.id;
        //tell everyone
        io.to(room).emit("update_writer", socket.id);
    }else{
      socket.emit("update_writer", roomWriters[room]);
    }
    
    //send existing users to the new guy
    const existingUsers = roomUsers[room].filter(u => u.socketId !== socket.id);
    socket.emit("all_users", existingUsers);

    //Tell others
    socket.to(room).emit("user_joined",userId);
  });

  // 2.user sends a message to a specific room
  socket.on("send_message", (data) => {
    //update server memort whenever someone types
    roomCode[data.room] = data.message;
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

  // chat message listnere
  socket.on("send_chat", (data) => {
    const { room, message, sender } = data;
    // broadcast toeveryone in the room (except the sender)
    socket.to(room).emit("receive_chat", { message, sender });
  });

  //white board
    socket.on("draw",(data) => {
      //broadcast drawing data to everyone else in the room
      socket.to(data.room).emit("on_draw",data);
    });

    // NEW: Add this to fix the "Connecting Lines" glitch
  socket.on("start_draw", (data) => {
    socket.to(data.room).emit("start_draw", data);
  });


  //user.wants to run code 
  socket.on("run_code", (data) => {
    // Here you can implement code execution logic
    // For security reasons, be very careful with executing arbitrary code
    const {code, room, language } = data;
    const timestamp = Date.now(); //use timestamp to avoid file conflicts
    let command = ""
    let filename = "";

    //determine fileextension & command
    if(language === "python"){
      filename = `test-${timestamp}.py`;
      command = `python ${filename}`;
    }
    else if(language === "javascript"){
      filename = `test-${timestamp}.js`;
      command = `node ${filename}`;
    }
    else if(language === "cpp"){
      filename = `test-${timestamp}.cpp`;
      // Compile to 'out.exe' then run it
      // Note: This requires g++ installed on your PC
      command = `g++ ${filename} -o out-${timestamp} && out-${timestamp}`;
    }
    else if(language === "java"){
      // Java is tricky: Class name must match filename. 
      // We will force a wrapper class or just assume simple snippets.
      // For simplicity, we save as "Main.java" (Concurrency issue warning!)
      filename = `Main.java`; 
      command = `javac ${filename} && java Main`;
    }

    //A.save code to a temporary file 
    fs.writeFileSync(filename, code);

    //B.run the file using python
    exec(command, (error, stdout, stderr) => {
      //C.check for errors
      if (error) {
        //send error back to room
        io.to(room).emit("receive_output",stderr || error.message);
      }
      else {
        //send output back to room
        io.to(room).emit("receive_output", stdout);
      }
      // 2. Cleanup (Delete file AND the executable if C++)
      try { 
          fs.unlinkSync(filename); 
          if(language === "cpp") fs.unlinkSync(`out-${timestamp}.exe`);
          if(language === "java") fs.unlinkSync(`Main.class`);
      } catch (e) {}
    });
  });

  //4. handle "take control" (switch writer)
  socket.on("request_writer",(data) => {
    const {room } = data;
    // Broadcast to the WHOLE room (including the sender): "the new writer is this user")
    roomWriters[room] = socket.id; //update server memory
    io.in(room).emit("update_writer", socket.id);
  });

  socket.on('disconnect', () => {
    for (const room in roomUsers) {
        const index = roomUsers[room].findIndex(u => u.socketId === socket.id);
        if (index !== -1) {
            const user = roomUsers[room][index];
            roomUsers[room].splice(index, 1);
            io.to(room).emit("user_disconnected", user.peerId);
            // If the room is empty, clear the memory to save RAM
                if (roomUsers[room].length === 0) {
                    delete roomCode[room];
                    delete roomWriters[room];
                } else if (roomWriters[room] === socket.id) {
                    delete roomWriters[room];
                }
            break;
        }
    }
  });

});
server.listen(PORT, () => {
  console.log("SERVER RUNNING");      
}
);
