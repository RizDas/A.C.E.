import { useCallback } from 'react';
import { useAIContext } from '../../../context/AIContext';
import { getChatStream } from '../../../services/aiService';
import { speak } from '../../../services/ttsService';

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
                // We still process the transcript containing the sleep word
                // so the AI can say "goodbye" or acknowledge it.
                shouldProcess = true; 
            }

            if (shouldProcess) {
                setIsProcessing(true);
                addAiHistory('user', transcript);

                getChatStream(
                    transcript,
                    state.aiHistory, // Pass current history
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
