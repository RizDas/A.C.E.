import { useCallback } from 'react';
import { useBlobContext } from '../../../context/BlobContext';
import { getChatStream } from '../../../services/aiService';
import { speak } from '../../../services/ttsService';

export function useChat() {
    const { 
        setAiResponse, addAiHistory, setIsProcessing, setTranscript, addTranscriptHistory 
    } = useBlobContext();

    const handleSpeechResult = useCallback((transcript: string, isFinal: boolean) => {
        if (isFinal) {
            addTranscriptHistory(transcript);
            setIsProcessing(true);

            getChatStream(
                transcript,
                (chunk) => {
                    setAiResponse((prev: string) => prev + chunk);
                },
                (fullText) => {
                    addAiHistory(fullText);
                    setIsProcessing(false);
                    speak(fullText);
                }
            );
        } else {
            setTranscript(transcript);
        }
    }, [addTranscriptHistory, setIsProcessing, setAiResponse, addAiHistory, setTranscript]);

    return {
        handleSpeechResult
    };
}
