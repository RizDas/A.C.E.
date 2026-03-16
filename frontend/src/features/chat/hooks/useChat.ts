import { useCallback } from 'react';
import { useAIContext } from '../../../context/AIContext';
import { getChatStream } from '../../../services/aiService';
import { speak } from '../../../services/ttsService';
import { resolveAndOpenUrl } from '../../../services/urlService';

/**
 * Detects whether the user's transcript is an intent to open a URL/site/page.
 * Examples: "open YouTube", "launch Spotify", "go to Facebook",
 *           "open quantum computing on Wikipedia", "navigate to GitHub"
 */
function isOpenIntent(transcript: string): boolean {
    const openIntentRegex =
        /\b(open|launch|navigate to|go to|show me|take me to|pull up|load)\b.{1,60}?(\bon\b.{1,30}?(wikipedia|wiki|youtube|google|reddit|twitter|x\.com|instagram|facebook|github|spotify|netflix|amazon|twitch|pinterest|linkedin|tiktok|discord|whatsapp|telegram|maps|gmail|outlook|yahoo)|(?:https?:\/\/\S+))?/i;

    // Also catch: "open that thing on Wikipedia", "open Facebook", "launch YouTube"
    const simpleOpenRegex =
        /\b(open|launch|navigate to|go to|pull up|load)\b\s+\S+/i;

    return openIntentRegex.test(transcript) || simpleOpenRegex.test(transcript);
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

                // --- URL-opening intent ---
                // Fire in parallel: resolve + open the URL while the chat stream
                // also runs so ACE can verbally confirm what it opened.
                if (isOpenIntent(transcript)) {
                    resolveAndOpenUrl(transcript).then((result) => {
                        if (result) {
                            // Speak a quick confirmation in addition to whatever the LLM says
                            console.log(`[A.C.E] Opened: ${result.label} → ${result.url}`);
                        }
                    });
                }

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

