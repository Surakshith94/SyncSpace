<div align="center">

  <h1>🚀 SyncSpace</h1>
  
  <p>
    <strong>Real-time Collaboration Suite for Developers</strong>
  </p>

  <p>
    <a href="https://sync-space.vercel.app"><b>View Live Demo</b></a> •
    <a href="https://github.com/Surakshith94/SyncSpace"><b>GitHub Repository</b></a> •
    <a href="https://syncspace-p0ud.onrender.com"><b>Backend API Status</b></a>
  </p>
  
  ![License](https://img.shields.io/badge/License-MIT-blue.svg)
  ![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)
  ![Node](https://img.shields.io/badge/Node.js-18.x-339933?logo=node.js&logoColor=white)
  ![Socket.io](https://img.shields.io/badge/Socket.io-RealTime-010101?logo=socket.io&logoColor=white)
  ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)

</div>

<br />

---

## 📖 Table of Contents
- [About the Project](#-about-the-project)
- [Architecture](#-architecture)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Important Links](#-important-links)
- [Author](#-author)

---

## 🧐 About the Project

**SyncSpace** is an all-in-one collaboration platform designed to streamline remote development. Built by a MERN stack developer, it eliminates the need to switch between multiple apps by combining a code editor, video conferencing, and a whiteboard into a single, cohesive environment. 

Whether you are debugging with a peer, teaching a concept, or brainstorming architecture, SyncSpace keeps your team in sync.

---

## 🏗️ Architecture



The application uses a hybrid communication model:
* **WebRTC (PeerJS):** Used for Peer-to-Peer (P2P) Video and Audio streaming to reduce server bandwidth and latency.
* **WebSockets (Socket.io):** Used for real-time code synchronization, whiteboard drawing, and chat messaging via the Node.js backend.

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| **💻 Collaborative Editor** | Real-time code syncing with syntax highlighting for Python, JS, C++, and Java. Includes a strict "Writer/Viewer" control system. |
| **🎥 Video & Audio** | Integrated P2P video calls using WebRTC (PeerJS) with Google/Twilio STUN servers for reliable connections. |
| **🤖 AI Pair Programmer** | Built-in **Gemini 1.5 Flash AI** assistant to debug code, explain logic, and suggest improvements. |
| **🎨 Whiteboard** | Interactive canvas for drawing diagrams and brainstorming ideas visually. |
| **▶️ Live Execution** | Secure server-side code execution engine to run scripts and return terminal output instantly. |
| **📜 Version Control** | Auto-save functionality with a MongoDB-backed history rollback feature to restore previous code versions. |
| **💬 Group Chat** | Persistent text chat for sharing resources and quick updates. |

---

## 🛠 Tech Stack

### **Frontend (Vercel)**
* **Framework:** React.js (Vite)
* **Editor Engine:** Monaco Editor (`@monaco-editor/react`)
* **Real-time:** `socket.io-client`, `peerjs`
* **Routing & UI:** `react-router-dom`, `react-hot-toast`

### **Backend (Render)**
* **Environment:** Node.js & Express.js
* **Database:** MongoDB Atlas (Mongoose)
* **Real-time:** `socket.io`
* **AI Integration:** `@google/generative-ai`
* **Execution:** Child Process (`exec`)

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
* Node.js (v16 or higher)
* MongoDB Atlas Account
* Google Gemini API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/Surakshith94/SyncSpace.git](https://github.com/Surakshith94/SyncSpace.git)
    cd SyncSpace
    ```

2.  **Setup Backend**
    ```bash
    cd backend
    npm install
    ```

3.  **Setup Frontend**
    ```bash
    cd ../frontend
    npm install
    ```

4.  **Run Locally**
    * Terminal 1 (Backend): `cd backend && npm start`
    * Terminal 2 (Frontend): `cd frontend && npm run dev`

---

## 🔐 Environment Variables

Create a `.env` file in both the `backend` and `frontend` directories using these templates.

**Backend (`backend/.env`)**
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.ne1uey5.mongodb.net/?appName=Cluster0
API_KEY=your_gemini_api_key
FRONTEND_URL=[https://sync-space.vercel.app](https://sync-space.vercel.app)

*(Note: Ensure your MongoDB password contains no special characters like `@` or `:` unless URL-encoded).*

**Frontend (rontend/.env)**
`env
VITE_BACKEND_URL=[https://syncspace-p0ud.onrender.com](https://syncspace-p0ud.onrender.com)
?? Important Links
Live Application: https://sync-space.vercel.app

Backend API URL: https://syncspace-p0ud.onrender.com

GitHub Repository: https://github.com/Surakshith94/SyncSpace

👨‍💻 Author
Surakshith

GitHub: @Surakshith94

LinkedIn: https://www.linkedin.com/in/surakshith-acharya-294870329/

<div align="center">
<sub>Built with ❤️ by Surakshith. SyncSpace © 2026</sub>
</div>
