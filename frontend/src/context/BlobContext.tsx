'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type BlobColor = {
  deep: string;
  mid: string;
  bright: string;
};

export type Position = { x: number; y: number } | null;

export interface BlobSettings {
  color: BlobColor;
  size: number;
  position: Position;
  dragMode: boolean;
}

type BlobContextType = {
  settings: BlobSettings;
  setColor: (c: BlobColor) => void;
  setSize: (s: number) => void;
  setPosition: (p: Position) => void;
  setDragMode: (d: boolean) => void;
};

const defaultSettings: BlobSettings = {
  color: { deep: '#001433', mid: '#0084ff', bright: '#00ffe1' },
  size: 420,
  position: null,
  dragMode: false,
};

const BlobContext = createContext<BlobContextType | undefined>(undefined);

export function BlobProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BlobSettings>(defaultSettings);

  const setColor = (color: BlobColor) => setSettings(s => ({ ...s, color }));
  const setSize = (size: number) => setSettings(s => ({ ...s, size }));
  const setPosition = (position: Position) => setSettings(s => ({ ...s, position }));
  const setDragMode = (dragMode: boolean) => setSettings(s => ({ ...s, dragMode }));

  return (
    <BlobContext.Provider value={{ 
      settings,
      setColor, setSize, setPosition, setDragMode
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
