'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type BlobColor = {
  deep: string;
  mid: string;
  bright: string;
};

export type Position = { x: number; y: number } | null;

export interface UIState {
  terminal: { position: Position; dragMode: boolean };
  llmTerminal: { position: Position; dragMode: boolean };
  statusTerminal: { position: Position; dragMode: boolean };
}

export interface BlobSettings {
  color: BlobColor;
  size: number;
  position: Position;
  dragMode: boolean;
}

export interface AppState {
  aiResponse: string;
  aiHistory: string[];
  isProcessing: boolean;
  isMicActive: boolean;
  hasMicPermission: boolean;
  isApiConnected: boolean;
  currentTranscript: string;
  transcriptHistory: string[];
}

type BlobContextType = {
  settings: BlobSettings;
  ui: UIState;
  app: AppState;
  setColor: (c: BlobColor) => void;
  setSize: (s: number) => void;
  setPosition: (p: Position) => void;
  setDragMode: (d: boolean) => void;
  setTerminalPosition: (p: Position) => void;
  setTerminalDragMode: (d: boolean) => void;
  setLlmTerminalPosition: (p: Position) => void;
  setLlmTerminalDragMode: (d: boolean) => void;
  setStatusTerminalPosition: (p: Position) => void;
  setStatusTerminalDragMode: (d: boolean) => void;
  setAiResponse: (t: string | ((prev: string) => string)) => void;
  addAiHistory: (t: string) => void;
  setIsProcessing: (b: boolean) => void;
  setMicActive: (b: boolean) => void;
  setMicPermission: (b: boolean) => void;
  setApiConnected: (b: boolean) => void;
  setTranscript: (t: string) => void;
  addTranscriptHistory: (t: string) => void;
  clearTranscript: () => void;
  toggleMic: () => void;
  _toggleTrigger: number;
};

const defaultSettings: BlobSettings = {
  color: { deep: '#001433', mid: '#0084ff', bright: '#00ffe1' },
  size: 420,
  position: null,
  dragMode: false,
};

const defaultUI: UIState = {
  terminal: { position: null, dragMode: false },
  llmTerminal: { position: null, dragMode: false },
  statusTerminal: { position: null, dragMode: false },
};

const defaultApp: AppState = {
  aiResponse: '',
  aiHistory: [],
  isProcessing: false,
  isMicActive: false,
  hasMicPermission: false,
  isApiConnected: true,
  currentTranscript: '',
  transcriptHistory: [],
};

const BlobContext = createContext<BlobContextType | undefined>(undefined);

export function BlobProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BlobSettings>(defaultSettings);
  const [ui, setUI] = useState<UIState>(defaultUI);
  const [app, setApp] = useState<AppState>(defaultApp);
  const [toggleTrigger, setToggleTrigger] = useState(0);

  const setColor = (color: BlobColor) => setSettings(s => ({ ...s, color }));
  const setSize = (size: number) => setSettings(s => ({ ...s, size }));
  const setPosition = (position: Position) => setSettings(s => ({ ...s, position }));
  const setDragMode = (dragMode: boolean) => setSettings(s => ({ ...s, dragMode }));

  const setTerminalPosition = (pos: Position) => setUI(u => ({ ...u, terminal: { ...u.terminal, position: pos } }));
  const setTerminalDragMode = (dm: boolean) => setUI(u => ({ ...u, terminal: { ...u.terminal, dragMode: dm } }));
  const setLlmTerminalPosition = (pos: Position) => setUI(u => ({ ...u, llmTerminal: { ...u.llmTerminal, position: pos } }));
  const setLlmTerminalDragMode = (dm: boolean) => setUI(u => ({ ...u, llmTerminal: { ...u.llmTerminal, dragMode: dm } }));
  const setStatusTerminalPosition = (pos: Position) => setUI(u => ({ ...u, statusTerminal: { ...u.statusTerminal, position: pos } }));
  const setStatusTerminalDragMode = (dm: boolean) => setUI(u => ({ ...u, statusTerminal: { ...u.statusTerminal, dragMode: dm } }));

  const setAiResponse = (aiResponse: string | ((prev: string) => string)) => 
    setApp(a => ({ ...a, aiResponse: typeof aiResponse === 'function' ? aiResponse(a.aiResponse) : aiResponse }));
  
  const addAiHistory = (text: string) => setApp(a => ({
    ...a,
    aiHistory: [...a.aiHistory.slice(-10), text],
    aiResponse: ''
  }));

  const setIsProcessing = (isProcessing: boolean) => setApp(a => ({ ...a, isProcessing }));
  const setMicActive = (isMicActive: boolean) => setApp(a => ({ ...a, isMicActive }));
  const setMicPermission = (hasMicPermission: boolean) => setApp(a => ({ ...a, hasMicPermission }));
  const setApiConnected = (isApiConnected: boolean) => setApp(a => ({ ...a, isApiConnected }));
  const setTranscript = (currentTranscript: string) => setApp(a => ({ ...a, currentTranscript }));
  
  const addTranscriptHistory = (text: string) => setApp(a => ({
    ...a,
    transcriptHistory: [...a.transcriptHistory.slice(-10), text],
    currentTranscript: ''
  }));

  const clearTranscript = () => setApp(a => ({ ...a, currentTranscript: '', transcriptHistory: [] }));
  const toggleMic = () => setToggleTrigger(prev => prev + 1);

  return (
    <BlobContext.Provider value={{ 
      settings, ui, app,
      setColor, setSize, setPosition, setDragMode, 
      setTerminalPosition, setTerminalDragMode,
      setLlmTerminalPosition, setLlmTerminalDragMode,
      setStatusTerminalPosition, setStatusTerminalDragMode,
      setAiResponse, addAiHistory, setIsProcessing,
      setMicActive, setMicPermission, setApiConnected,
      setTranscript, addTranscriptHistory, clearTranscript,
      toggleMic, _toggleTrigger: toggleTrigger 
    }}>
      {children}
    </BlobContext.Provider>
  );
}

export const useBlobContext = () => {
  const context = useContext(BlobContext);
  if (!context) throw new Error('useBlobContext must be used within a BlobProvider');
  return context;
};
