'use client';

import { useBlobContext } from '../../../context/BlobContext';
import { useAIContext } from '../../../context/AIContext';
import { useUIContext } from '../../../context/UIContext';

const BLOB_COLORS = [
  { deep: '#003344', mid: '#0088aa', bright: '#00ffee' }, // Cyan
  { deep: '#220044', mid: '#6600cc', bright: '#b400ff' }, // Purple
  { deep: '#003311', mid: '#00aa44', bright: '#00ff66' }, // Green
  { deep: '#440022', mid: '#cc0066', bright: '#ff0099' }, // Pink
  { deep: '#442200', mid: '#aa6600', bright: '#ffcc00' }, // Gold
  { deep: '#002244', mid: '#0055aa', bright: '#0099ff' }, // Blue
];

export default function SettingsPanel() {
  const { settings, setColor, setSize, setDragMode } = useBlobContext();
  const { ui, setTerminalDragMode, setLlmTerminalDragMode, setStatusTerminalDragMode } = useUIContext();
  
  const { size, color, dragMode } = settings;
  const { dragMode: terminalDragMode } = ui.terminal;
  const { dragMode: llmTerminalDragMode } = ui.llmTerminal;
  const { dragMode: statusTerminalDragMode } = ui.statusTerminal;

  const handleFix = () => setDragMode(false);
  const handleTerminalFix = () => setTerminalDragMode(false);
  const handleLlmTerminalFix = () => setLlmTerminalDragMode(false);
  const handleStatusTerminalFix = () => setStatusTerminalDragMode(false);

  return (
    <div className="settings-panel">
      <style>{`
        .settings-panel {
          position: fixed;
          top: 80px;
          right: 20px;
          width: 380px;
          max-height: 350px;
          background: rgba(8, 8, 12, 0.75);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          padding: 16px;
          color: white;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
          animation: spSlideIn 0.3s ease-out;
          font-family: 'Space Grotesk', sans-serif;
        }

        @keyframes spSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .settings-scroll-area {
          overflow-y: auto;
          flex: 1;
          padding-right: 12px;
          margin-right: -12px;
        }

        .settings-scroll-area::-webkit-scrollbar {
          width: 3px;
        }
        .settings-scroll-area::-webkit-scrollbar-track {
          background: transparent;
        }
        .settings-scroll-area::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }

        .sp-title {
          font-size: 10px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.3);
          margin-bottom: 16px;
          font-weight: 500;
        }

        .sp-section {
          margin-bottom: 20px;
        }

        .sp-label {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 12px;
        }

        .sp-color-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .sp-color-btn {
          height: 40px;
          border-radius: 2px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: transform 0.2s, border-color 0.2s;
        }

        .sp-color-btn:hover {
          transform: scale(1.05);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .sp-color-btn.active {
          border-color: #fff;
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
        }

        .sp-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 2px;
          background: rgba(255, 255, 255, 0.1);
          outline: none;
          margin: 10px 0;
        }

        .sp-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #00ffe1;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(0, 255, 225, 0.5);
        }

        .sp-drag-row {
          display: flex;
          gap: 8px;
        }

        .sp-btn {
          flex: 1;
          height: 34px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 1px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sp-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }

        .sp-btn.active {
          background: rgba(0, 255, 225, 0.1);
          border-color: #00ffe1;
          color: #00ffe1;
        }

        .sp-btn-fix {
          color: #00ffe1;
          border-color: rgba(0, 255, 225, 0.2);
        }

        .sp-hint {
          margin-top: 12px;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.2);
          line-height: 1.5;
          letter-spacing: 0.05em;
        }
      `}</style>
      
      <h2 className="sp-title">HUD Configuration</h2>

      <div className="settings-scroll-area">
        {/* Color Palette */}
        <div className="sp-section">
          <span className="sp-label">Neural Aesthetics</span>
          <div className="sp-color-grid">
            {BLOB_COLORS.map(c => (
              <button
                key={c.deep}
                className={`sp-color-btn${color.deep === c.deep ? ' active' : ''}`}
                style={{ background: `linear-gradient(135deg, ${c.deep} 0%, ${c.mid} 50%, ${c.bright} 100%)` }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        {/* Blob Size */}
        <div className="sp-section">
          <span className="sp-label">Core Pulse Magnitude</span>
          <input
            type="range"
            min="200"
            max="600"
            value={size}
            className="sp-slider"
            onChange={(e) => setSize(Number(e.target.value))}
          />
        </div>

        {/* Blob Position */}
        <div className="sp-section">
          <span className="sp-label">Blob Spatial Anchor</span>
          <div className="sp-drag-row">
            <button
              className={`sp-btn${dragMode ? ' active' : ''}`}
              onClick={() => setDragMode(!dragMode)}
            >
              {dragMode ? 'Dragging' : 'Drag Mode'}
            </button>
            <button
              className="sp-btn sp-btn-fix"
              onClick={handleFix}
              disabled={!dragMode}
              style={{ opacity: dragMode ? 1 : 0.3 }}
            >
              Fix Position
            </button>
          </div>
        </div>

        {/* Transcript Terminal Position */}
        <div className="sp-section">
          <span className="sp-label">Uplink Terminal</span>
          <div className="sp-drag-row">
            <button
              className={`sp-btn${terminalDragMode ? ' active' : ''}`}
              onClick={() => setTerminalDragMode(!terminalDragMode)}
            >
              {terminalDragMode ? 'Dragging' : 'Drag Mode'}
            </button>
            <button
              className="sp-btn sp-btn-fix"
              onClick={handleTerminalFix}
              disabled={!terminalDragMode}
              style={{ opacity: terminalDragMode ? 1 : 0.3 }}
            >
              Fix Position
            </button>
          </div>
        </div>

        {/* LLM Terminal Position */}
        <div className="sp-section">
          <span className="sp-label">Neural Response Terminal</span>
          <div className="sp-drag-row">
            <button
              className={`sp-btn${llmTerminalDragMode ? ' active' : ''}`}
              onClick={() => setLlmTerminalDragMode(!llmTerminalDragMode)}
            >
              {llmTerminalDragMode ? 'Dragging' : 'Drag Mode'}
            </button>
            <button
              className="sp-btn sp-btn-fix"
              onClick={handleLlmTerminalFix}
              disabled={!llmTerminalDragMode}
              style={{ opacity: llmTerminalDragMode ? 1 : 0.3 }}
            >
              Fix Position
            </button>
          </div>
        </div>

        {/* Status Terminal Position */}
        <div className="sp-section">
          <span className="sp-label">Diagnostics Monitor</span>
          <div className="sp-drag-row">
            <button
              className={`sp-btn${statusTerminalDragMode ? ' active' : ''}`}
              onClick={() => setStatusTerminalDragMode(!statusTerminalDragMode)}
            >
              {statusTerminalDragMode ? 'Dragging' : 'Drag Mode'}
            </button>
            <button
              className="sp-btn sp-btn-fix"
              onClick={handleStatusTerminalFix}
              disabled={!statusTerminalDragMode}
              style={{ opacity: statusTerminalDragMode ? 1 : 0.3 }}
            >
              Fix Position
            </button>
          </div>
        </div>

        {(dragMode || terminalDragMode || llmTerminalDragMode || statusTerminalDragMode) && (
          <p className="sp-hint">
            Enable drag mode, reposition the HUD element, then click Fix Position to lock it.
          </p>
        )}
      </div>
    </div>
  );
}
