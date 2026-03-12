'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIState {
  aiResponse: string;
  aiHistory: ChatMessage[];
  isProcessing: boolean;
  isMicActive: boolean;
  hasMicPermission: boolean;
  isApiConnected: boolean;
  currentTranscript: string;
  transcriptHistory: string[];
}

type AIContextType = {
  state: AIState;
  setAiResponse: (t: string | ((prev: string) => string)) => void;
  addAiHistory: (role: 'user' | 'assistant', content: string) => void;
  setIsProcessing: (b: boolean) => void;
  setMicActive: (b: boolean) => void;
  setMicPermission: (b: boolean) => void;
  setApiConnected: (b: boolean) => void;
  setTranscript: (t: string) => void;
  addTranscriptHistory: (t: string) => void;
  clearTranscript: () => void;
  clearAiHistory: () => void;
  toggleMic: () => void;
  _toggleTrigger: number;
};

const defaultState: AIState = {
  aiResponse: '',
  aiHistory: [],
  isProcessing: false,
  isMicActive: false,
  hasMicPermission: false,
  isApiConnected: true,
  currentTranscript: '',
  transcriptHistory: [],
};

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AIState>(defaultState);
  const [toggleTrigger, setToggleTrigger] = useState(0);

  const setAiResponse = (aiResponse: string | ((prev: string) => string)) => 
    setState(s => ({ ...s, aiResponse: typeof aiResponse === 'function' ? aiResponse(s.aiResponse) : aiResponse }));
  
  const addAiHistory = (role: 'user' | 'assistant', content: string) => setState(s => ({
    ...s,
    aiHistory: [...s.aiHistory.slice(-19), { role, content }],
    aiResponse: role === 'assistant' ? '' : s.aiResponse
  }));

  const setIsProcessing = (isProcessing: boolean) => setState(s => ({ ...s, isProcessing }));
  const setMicActive = (isMicActive: boolean) => setState(s => ({ ...s, isMicActive }));
  const setMicPermission = (hasMicPermission: boolean) => setState(s => ({ ...s, hasMicPermission }));
  const setApiConnected = (isApiConnected: boolean) => setState(s => ({ ...s, isApiConnected }));
  const setTranscript = (currentTranscript: string) => setState(s => ({ ...s, currentTranscript }));
  
  const addTranscriptHistory = (text: string) => setState(s => ({
    ...s,
    transcriptHistory: [...s.transcriptHistory.slice(-10), text],
    currentTranscript: ''
  }));

  const clearTranscript = () => setState(s => ({ ...s, currentTranscript: '', transcriptHistory: [] }));
  const clearAiHistory = () => setState(s => ({ ...s, aiHistory: [], aiResponse: '' }));
  const toggleMic = () => setToggleTrigger(prev => prev + 1);

  return (
    <AIContext.Provider value={{ 
      state,
      setAiResponse, addAiHistory, setIsProcessing,
      setMicActive, setMicPermission, setApiConnected,
      setTranscript, addTranscriptHistory, clearTranscript,
      clearAiHistory, toggleMic, _toggleTrigger: toggleTrigger 
    }}>
      {children}
    </AIContext.Provider>
  );
}

export const useAIContext = () => {
  const context = useContext(AIContext);
  if (!context) throw new Error('useAIContext must be used within an AIProvider');
  return context;
};
