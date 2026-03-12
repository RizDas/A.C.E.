'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type Position = { x: number; y: number } | null;

export interface HUDElementState {
  position: Position;
  dragMode: boolean;
}

export interface UIState {
  terminal: HUDElementState;
  llmTerminal: HUDElementState;
  statusTerminal: HUDElementState;
}

type UIContextType = {
  ui: UIState;
  setTerminalPosition: (p: Position) => void;
  setTerminalDragMode: (d: boolean) => void;
  setLlmTerminalPosition: (p: Position) => void;
  setLlmTerminalDragMode: (d: boolean) => void;
  setStatusTerminalPosition: (p: Position) => void;
  setStatusTerminalDragMode: (d: boolean) => void;
};

const defaultUI: UIState = {
  terminal: { position: null, dragMode: false },
  llmTerminal: { position: null, dragMode: false },
  statusTerminal: { position: null, dragMode: false },
};

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [ui, setUI] = useState<UIState>(defaultUI);

  const setTerminalPosition = (pos: Position) => setUI(u => ({ ...u, terminal: { ...u.terminal, position: pos } }));
  const setTerminalDragMode = (dm: boolean) => setUI(u => ({ ...u, terminal: { ...u.terminal, dragMode: dm } }));
  
  const setLlmTerminalPosition = (pos: Position) => setUI(u => ({ ...u, llmTerminal: { ...u.llmTerminal, position: pos } }));
  const setLlmTerminalDragMode = (dm: boolean) => setUI(u => ({ ...u, llmTerminal: { ...u.llmTerminal, dragMode: dm } }));
  
  const setStatusTerminalPosition = (pos: Position) => setUI(u => ({ ...u, statusTerminal: { ...u.statusTerminal, position: pos } }));
  const setStatusTerminalDragMode = (dm: boolean) => setUI(u => ({ ...u, statusTerminal: { ...u.statusTerminal, dragMode: dm } }));

  return (
    <UIContext.Provider value={{ 
      ui,
      setTerminalPosition, setTerminalDragMode,
      setLlmTerminalPosition, setLlmTerminalDragMode,
      setStatusTerminalPosition, setStatusTerminalDragMode
    }}>
      {children}
    </UIContext.Provider>
  );
}

export const useUIContext = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUIContext must be used within a UIProvider');
  return context;
};
