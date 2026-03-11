'use client';

import { useBlobContext } from '../../../context/BlobContext';
import { useEffect, useRef, useState } from 'react';

export default function TranscriptTerminal() {
  const { app, ui, setTerminalPosition } = useBlobContext();
  const { currentTranscript, transcriptHistory } = app;
  const { position: terminalPosition, dragMode: terminalDragMode } = ui.terminal;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptHistory, currentTranscript]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!terminalDragMode) return;
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
    if (!isDragging || !terminalDragMode) return;
    
    const newX = e.clientX - dragOffset.current.x;
    const newBottom = window.innerHeight - e.clientY - dragOffset.current.y;
    
    setTerminalPosition({ x: newX, y: newBottom });
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
    cursor: terminalDragMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
    pointerEvents: terminalDragMode ? 'all' : 'none',
    zIndex: 50,
    // Use bottom anchoring so it expands upwards
    ...(terminalPosition 
      ? { left: terminalPosition.x, bottom: terminalPosition.y, top: 'auto' } 
      : { bottom: '40px', left: '40px' }),
  };

  return (
    <div 
      className="terminal-container" 
      style={containerStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <style>{`
        .terminal-container {
          background: rgba(0, 5, 10, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 255, 225, 0.15);
          border-radius: 8px;
          padding: 16px;
          font-family: 'Space Grotesk', monospace;
          color: #00ffe1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), inset 0 0 16px rgba(0, 255, 225, 0.05);
          transition: opacity 0.4s ease, transform 0.4s ease;
          touch-action: none;
        }

        .terminal-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
          opacity: 0.6;
        }

        .terminal-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00ffe1;
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
          text-shadow: 0 0 8px rgba(0, 255, 225, 0.5);
        }

        .terminal-cursor {
          display: inline-block;
          width: 8px;
          height: 14px;
          background: #00ffe1;
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
        <span className="terminal-title">A.C.E Neural Interface</span>
      </div>

      <div className="terminal-content" ref={scrollRef}>
        {transcriptHistory.map((line: string, i: number) => (
          <div key={i} className="terminal-line">{`> ${line}`}</div>
        ))}
        {currentTranscript && (
          <div className="terminal-line active">
            {`> ${currentTranscript}`}
            <span className="terminal-cursor" />
          </div>
        )}
        {!currentTranscript && transcriptHistory.length === 0 && (
          <div className="terminal-line opacity-40">
            Waiting for audio input...
            <span className="terminal-cursor" />
          </div>
        )}
      </div>
    </div>
  );
}
