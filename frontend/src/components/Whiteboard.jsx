import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const Whiteboard = ({ canvasRef, ctxRef, showBoard, setShowBoard, startDrawing, endDrawing, draw }) => {
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    if (showBoard && canvasRef.current) {
      const canvas = canvasRef.current;
      // Make it fit 80% of the screen
      canvas.width = window.innerWidth * 0.8; 
      canvas.height = window.innerHeight * 0.8;

      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.strokeStyle = "#ffffff"; 
      ctx.lineWidth = 4;
      ctxRef.current = ctx;
    }
  }, [showBoard]);

  // NEW: Function to clear the board
  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        toast.success("Canvas Cleared");
    }
  };

  // NEW: Function to download drawing
  const saveImage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = "syncspace-drawing.png";
        link.click();
        toast.success("Drawing Downloaded! 🖼️");
    }
  };

  if (!showBoard) return null;

  return (
    <div style={{
        position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
        background: "rgba(0,0,0,0.85)", // Dark overlay
        display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000,
        backdropFilter: "blur(3px)"
    }}>
        <div style={{ 
            background: "#1e1e1e", 
            padding: "15px", 
            borderRadius: "12px", 
            position: "relative", 
            border: "1px solid #333", 
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)" 
        }}>
            
            {/* HEADER TOOLBAR */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", alignItems: "center" }}>
                 <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontWeight: "bold", color: "#fff", fontSize: "18px" }}>🎨 Whiteboard</span>
                    <span style={{ fontSize: "12px", color: "#888", marginLeft: "10px" }}>Draw & Brainstorm</span>
                 </div>
                 
                 <div style={{ display: "flex", gap: "10px" }}>
                     <button onClick={clearBoard} style={secondaryBtnStyle}>🗑️ Clear</button>
                     <button onClick={saveImage} style={secondaryBtnStyle}>⬇️ Save</button>
                     <button onClick={() => setShowBoard(false)} style={closeBtnStyle}>✕ Close</button>
                 </div>
            </div>

            {/* CANVAS AREA */}
            <div style={{ border: "2px solid #333", borderRadius: "8px", overflow: "hidden" }}>
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseUp={endDrawing}
                    onMouseMove={draw}
                    style={{ background: "#252526", cursor: "crosshair", display: "block" }}
                />
            </div>

            <div style={{ textAlign: "center", marginTop: "10px", color: "#666", fontSize: "12px" }}>
                Use your mouse to draw. Changes sync live with partners.
            </div>
        </div>
    </div>
  );
};

// --- STYLES ---
const secondaryBtnStyle = {
    background: "#333", color: "white", border: "1px solid #444", 
    padding: "6px 12px", borderRadius: "6px", cursor: "pointer", 
    fontSize: "13px", transition: "0.2s"
};

const closeBtnStyle = {
    background: "#d9534f", color: "white", border: "none", 
    padding: "6px 12px", borderRadius: "6px", cursor: "pointer", 
    fontSize: "13px", fontWeight: "bold"
};

export default Whiteboard;