import { useCallback } from 'react';
import { useAIContext } from '../../../context/AIContext';
import { getChatStream } from '../../../services/aiService';
import { speak } from '../../../services/ttsService';
import { resolveAndOpenIntents, resolveAndCloseTabs } from '../../../services/urlService';

/**
 * Detects an intent to OPEN one or more URLs/sites.
 * e.g. "open YouTube", "launch Instagram and Discord", "go to Wikipedia"
 */
function isOpenIntent(transcript: string): boolean {
    return /\b(open|launch|navigate to|go to|show me|take me to|pull up|load)\b/i.test(transcript);
}

/**
 * Detects an intent to CLOSE one or more tabs.
 * e.g. "close YouTube", "shut the Instagram tab", "close all tabs"
 */
function isCloseIntent(transcript: string): boolean {
    return /\b(close|shut|exit|kill)\b.{0,30}?\b(tab|window|youtube|instagram|discord|facebook|spotify|netflix|reddit|github|twitter|wikipedia|twitch|amazon|gmail|outlook|maps|linkedin|tiktok|discord|whatsapp|telegram|pinterest)\b/i.test(transcript)
        || /\bclose (all|every(thing)?)\b/i.test(transcript);
}

export function useChat() {
    const { 
        state, setAiResponse, addAiHistory, setIsProcessing, setTranscript, addTranscriptHistory, setIsAwake
    } = useAIContext();

    const handleSpeechResult = useCallback((transcript: string, isFinal: boolean) => {
        if (isFinal) {
            addTranscriptHistory(transcript);
            
            const wakeWordRegex = /\b(ace|joker|king|spades|astro|astrophere|astro pics)\b/i;
            const sleepWordRegex = /\b(thank you|thanks|shut down|sleep|goodbye|stop|that'?s all|bye|turn off|hibernate|later)\b/i;
            
            let shouldProcess = state.isAwake;
            
            if (!state.isAwake && wakeWordRegex.test(transcript)) {
                setIsAwake(true);
                shouldProcess = true;
            } else if (state.isAwake && sleepWordRegex.test(transcript)) {
                setIsAwake(false);
                shouldProcess = true; 
            }

            if (shouldProcess) {
                setIsProcessing(true);
                addAiHistory('user', transcript);

                // --- Close-tab intent (check before open so "close YouTube" doesn't also open) ---
                if (isCloseIntent(transcript)) {
                    resolveAndCloseTabs(transcript).then((closed) => {
                        if (closed.length > 0) {
                            console.log(`[A.C.E] Closed tabs: ${closed.join(', ')}`);
                        }
                    });
                }
                // --- Open-Intent: resolve and open/launch all mentioned sites/apps in parallel ---
                else if (isOpenIntent(transcript)) {
                    resolveAndOpenIntents(transcript, state.aiHistory).then((opened) => {
                        if (opened.length > 0) {
                            console.log(`[A.C.E] Opened/Launched: ${opened.map(u => u.label).join(', ')}`);
                        }
                    });
                }

                // Chat stream always runs (ACE speaks a natural verbal confirmation)
                getChatStream(
                    transcript,
                    state.aiHistory,
                    (chunk) => {
                        setAiResponse((prev: string) => prev + chunk);
                    },
                    (fullText: string) => {
                        addAiHistory('assistant', fullText);
                        setIsProcessing(false);
                        speak(fullText);
                    }
                );
            }
        } else {
            setTranscript(transcript);
        }
    }, [addTranscriptHistory, setIsProcessing, addAiHistory, setAiResponse, setTranscript, state.aiHistory, state.isAwake, setIsAwake]);

    return {
        handleSpeechResult
    };
}
