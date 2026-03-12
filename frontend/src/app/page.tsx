'use client';

import { useState } from "react";
import Blob from "../features/blob/components/Blob";
import NavBar from "../components/ui/NavBar";
import SettingsPanel from "../features/settings/components/SettingsPanel";
import TranscriptTerminal from "../features/chat/components/TranscriptTerminal";
import ResponseTerminal from "../features/chat/components/ResponseTerminal";
import StatusMonitor from "../features/hud/components/StatusMonitor";
import { BlobProvider } from "../context/BlobContext";
import { AIProvider } from "../context/AIContext";
import { UIProvider } from "../context/UIContext";

export default function Home() {
  const [activeTab, setActiveTab] = useState('Home');

  return (
    <UIProvider>
      <AIProvider>
        <BlobProvider>
          <main className="min-h-screen bg-black overflow-hidden relative">
            <NavBar active={activeTab} onNavigate={setActiveTab} />
            
            <div className="absolute inset-0 z-0">
              <Blob />
            </div>

            <TranscriptTerminal />
            <ResponseTerminal />
            <StatusMonitor />

            {activeTab === 'Settings' && <SettingsPanel />}
          </main>
        </BlobProvider>
      </AIProvider>
    </UIProvider>
  );
}
