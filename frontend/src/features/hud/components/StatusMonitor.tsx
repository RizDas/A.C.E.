'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useBlobContext } from '../../../context/BlobContext';

export default function StatusMonitor() {
  const { settings, ui, app, setStatusTerminalPosition, toggleMic } = useBlobContext();
  const { color } = settings;
  const { position: statusTerminalPosition, dragMode: statusTerminalDragMode } = ui.statusTerminal;
  const { isMicActive, hasMicPermission, isApiConnected, isProcessing } = app;

  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!statusTerminalDragMode) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);

    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !statusTerminalDragMode) return;
    setStatusTerminalPosition({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: statusTerminalPosition?.y ?? '50%',
    left: statusTerminalPosition?.x ?? '40px',
    transform: statusTerminalPosition ? 'none' : 'translateY(-50%)',
    width: '240px',
    zIndex: 1000,
    cursor: statusTerminalDragMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
    userSelect: 'none',
    touchAction: 'none',
  };

  const StatusItem = ({ label, active, warning }: { label: string; active: boolean; warning?: boolean }) => (
    <div className="status-item">
      <div className="status-info">
        <span className="status-label">{label}</span>
        <span className={`status-value ${active ? 'online' : warning ? 'warning' : 'offline'}`}>
          {active ? 'ONLINE' : warning ? 'ERROR' : 'OFFLINE'}
        </span>
      </div>
      <div className="status-bar-bg">
        <div 
          className={`status-bar-fill ${active ? 'active' : ''}`} 
          style={{ width: active ? '100%' : '5%', background: active ? color.bright : 'rgba(255,255,255,0.05)' }}
        />
      </div>
    </div>
  );

  return (
    <div 
      style={containerStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <style>{`
        .status-card {
          background: rgba(10, 10, 15, 0.9);
          backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-left: 2px solid ${color.bright};
          padding: 18px;
          position: relative;
          font-family: 'Space Grotesk', sans-serif;
        }

        /* Subtle Matte Grid Pattern */
        .status-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: 
            radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 0);
          background-size: 12px 12px;
          pointer-events: none;
        }

        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .status-title {
          font-size: 9px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
          font-weight: 700;
        }

        .status-indicator-matte {
          width: 4px;
          height: 12px;
          background: ${isMicActive ? color.bright : 'rgba(255,255,255,0.1)'};
          transition: background 0.3s;
        }

        .status-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 24px;
        }

        .status-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .status-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-label {
          font-size: 9px;
          color: rgba(255, 255, 255, 0.3);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .status-value {
          font-size: 8px;
          font-weight: 600;
          letter-spacing: 0.12em;
          font-family: monospace;
        }

        .status-value.online { color: ${color.bright}; }
        .status-value.warning { color: #ff3333; }
        .status-value.offline { color: rgba(255, 255, 255, 0.15); }

        .status-bar-bg {
          height: 1px;
          background: rgba(255, 255, 255, 0.05);
          width: 100%;
        }

        .status-bar-fill {
          height: 100%;
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .activate-btn {
          width: 100%;
          padding: 12px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.6);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 10px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }

        .activate-btn:hover {
          border-color: ${isMicActive ? '#ff3333' : color.bright};
          color: #fff;
          background: rgba(255, 255, 255, 0.02);
        }

        .activate-btn.active {
          border-color: #ff3333;
          color: #ff3333;
        }

        .processing-line {
          position: absolute;
          bottom: 0; left: 0; width: 0%;
          height: 1px;
          background: ${color.bright};
          transition: width 0.3s;
        }

        .is-processing .processing-line {
          width: 100%;
          animation: load-matte 2s ease-in-out infinite;
        }

        @keyframes load-matte {
          0% { left: 0; width: 0; }
          50% { left: 0; width: 100%; }
          100% { left: 100%; width: 0; }
        }
      `}</style>

      <div className={`status-card ${isProcessing ? 'is-processing' : ''}`}>
        <div className="status-header">
          <span className="status-title">System Diagnostics</span>
          <div className="status-indicator-matte" />
        </div>

        <div className="status-list">
          <StatusItem label="Neural Link (A.C.E)" active={isApiConnected} />
          <StatusItem label="Audio Uplink" active={isMicActive} />
          <StatusItem label="Bio-Permissions" active={hasMicPermission} />
          <StatusItem label="API Endpoint" active={isApiConnected} />
          <StatusItem label="Core System" active={true} />
        </div>

        <button 
          className={`activate-btn ${isMicActive ? 'active' : ''}`} 
          onClick={() => toggleMic()}
        >
          {isMicActive ? 'TERMINATE LINK' : 'INITIALIZE LINK'}
        </button>

        <div className="processing-line" />
      </div>
    </div>
  );
}
