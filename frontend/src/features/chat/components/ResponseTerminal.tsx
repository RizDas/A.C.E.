'use client';

import { useBlobContext } from '../../../context/BlobContext';
import { useEffect, useRef, useState } from 'react';

export default function ResponseTerminal() {
  const { app, ui, setLlmTerminalPosition } = useBlobContext();
  const { aiResponse, aiHistory, isProcessing } = app;
  const { position: llmTerminalPosition, dragMode: llmTerminalDragMode } = ui.llmTerminal;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiHistory, aiResponse]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!llmTerminalDragMode) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);

    const rect = e.currentTarget.getBoundingClientRect();
    // Track distance from the BOTTOM of the viewport
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: window.innerHeight - e.clientY - (window.innerHeight - rect.bottom),
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !llmTerminalDragMode) return;
    
    const newX = e.clientX - dragOffset.current.x;
    const newBottom = window.innerHeight - e.clientY - dragOffset.current.y;
    
    setLlmTerminalPosition({ x: newX, y: newBottom });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    width: '400px',
    maxHeight: '160px',
    cursor: llmTerminalDragMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
    pointerEvents: llmTerminalDragMode ? 'all' : (aiHistory.length > 0 || aiResponse ? 'all' : 'none'),
    zIndex: 51,
    opacity: (aiHistory.length > 0 || aiResponse || llmTerminalDragMode) ? 1 : 0,
    transition: 'opacity 0.4s ease, transform 0.4s ease',
    // Use bottom anchoring so it expands upwards
    ...(llmTerminalPosition 
      ? { left: llmTerminalPosition.x, bottom: llmTerminalPosition.y, top: 'auto' } 
      : { bottom: '40px', left: '460px' }), // Side-by-side with TranscriptTerminal (40 + 400 + 20)
  };

  return (
    <div 
      className="terminal-container response-terminal" 
      style={containerStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <style>{`
        .response-terminal {
          background: rgba(10, 0, 20, 0.45);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(180, 0, 255, 0.2);
          border-radius: 8px;
          padding: 16px;
          font-family: 'Space Grotesk', monospace;
          color: #d400ff;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), inset 0 0 16px rgba(180, 0, 255, 0.05);
          touch-action: none;
        }

        .terminal-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
          opacity: 0.7;
        }

        .terminal-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #d400ff;
          box-shadow: 0 0 8px #d400ff;
        }

        .terminal-title {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        .terminal-content {
          overflow-y: auto;
          flex-grow: 1;
          font-size: 13px;
          line-height: 1.6;
          scrollbar-width: none;
        }

        .terminal-content::-webkit-scrollbar {
          display: none;
        }

        .terminal-line {
          margin-bottom: 4px;
          opacity: 0.8;
          animation: terminalFadeIn 0.3s ease-out forwards;
        }

        .terminal-line.active {
          opacity: 1;
          color: #fff;
          text-shadow: 0 0 8px rgba(180, 0, 255, 0.5);
        }

        .terminal-cursor {
          display: inline-block;
          width: 8px;
          height: 14px;
          background: #d400ff;
          vertical-align: middle;
          margin-left: 4px;
          animation: blink 1s step-end infinite;
        }

        @keyframes terminalFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 0.8; transform: translateY(0); }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .terminal-scanline {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            rgba(18, 16, 16, 0) 50%,
            rgba(0, 0, 0, 0.1) 50%
          );
          background-size: 100% 4px;
          pointer-events: none;
          opacity: 0.1;
        }
      `}</style>

      <div className="terminal-scanline" />
      
      <div className="terminal-header">
        <div className="terminal-dot" />
        <span className="terminal-title">A.C.E Core Response</span>
        {isProcessing && <span className="terminal-title" style={{ marginLeft: 'auto', opacity: 0.5, animation: 'pulse 1.2s infinite' }}>Processing...</span>}
      </div>

      <div className="terminal-content" ref={scrollRef}>
        {aiHistory.map((line: string, i: number) => (
          <div key={i} className="terminal-line">{`# ${line}`}</div>
        ))}
        {aiResponse && (
          <div className="terminal-line active">
            {`# ${aiResponse}`}
            <span className="terminal-cursor" />
          </div>
        )}
        {!aiResponse && aiHistory.length === 0 && llmTerminalDragMode && (
          <div className="terminal-line opacity-40">
            Neural link established. Ready for response.
          </div>
        )}
      </div>
    </div>
  );
}
