import { useEffect } from "react";

const Whiteboard = ({ canvasRef, ctxRef, showBoard, setShowBoard, startDrawing, endDrawing, draw }) => {
  
  useEffect(() => {
    if (showBoard && canvasRef.current) {
      const canvas = canvasRef.current;
      // Make it fit the window nicely
      canvas.width = window.innerWidth * 0.9; 
      canvas.height = window.innerHeight * 0.8;

      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.strokeStyle = "#ffffff"; // White pen for dark mode
      ctx.lineWidth = 4;
      ctxRef.current = ctx;
    }
  }, [showBoard]);

  if (!showBoard) return null;

  return (
    <div style={{
        position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
        background: "rgba(0,0,0,0.85)", // Darker overlay
        display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000
    }}>
        <div style={{ background: "#1e1e1e", padding: "10px", borderRadius: "8px", position: "relative", border: "1px solid #444", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", color: "#ccc" }}>
                 <span style={{ fontWeight: "bold" }}>🎨 Canvas</span>
                 <button 
                    onClick={() => setShowBoard(false)} 
                    style={{ background: "#d9534f", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}
                >
                    Close Board
                </button>
            </div>
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={endDrawing}
                onMouseMove={draw}
                style={{ border: "1px solid #444", background: "#252526", cursor: "crosshair", display: "block" }}
            />
        </div>
    </div>
  );
};

export default Whiteboard;