import { useCallback } from 'react';
import { useAIContext } from '../../../context/AIContext';
import { getChatStream } from '../../../services/aiService';
import { speak } from '../../../services/ttsService';

export function useChat() {
    const { 
        state, setAiResponse, addAiHistory, setIsProcessing, setTranscript, addTranscriptHistory 
    } = useAIContext();

    const handleSpeechResult = useCallback((transcript: string, isFinal: boolean) => {
        if (isFinal) {
            addTranscriptHistory(transcript);
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
        } else {
            setTranscript(transcript);
        }
    }, [addTranscriptHistory, setIsProcessing, addAiHistory, setAiResponse, setTranscript, state.aiHistory]);

    return {
        handleSpeechResult
    };
}
