import { useRef, useCallback } from 'react';
import { useBlobContext } from '../../../context/BlobContext';

export function useSpeechRecognition(onResult: (transcript: string, isFinal: boolean) => void) {
    const recognitionRef = useRef<any>(null);

    const startSpeechRecognition = useCallback(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                
                recognition.onresult = (event: any) => {
                    let interimTranscript = '';
                    
                    // Handle any new final segments
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            onResult(event.results[i][0].transcript, true);
                        }
                    }

                    // Accumulate ALL current interim segments for a complete "ongoing" sentence
                    for (let i = 0; i < event.results.length; ++i) {
                        if (!event.results[i].isFinal) {
                            interimTranscript += event.results[i][0].transcript;
                        }
                    }

                    if (interimTranscript) {
                        onResult(interimTranscript, false);
                    }
                };

                recognition.onend = () => {
                    // Only restart if the ref still exists (meaning we haven't called stop)
                    if (recognitionRef.current) {
                        recognition.start();
                    }
                };

                recognitionRef.current = recognition;
                recognition.start();
            }
        }
    }, [onResult]);

    const stopSpeechRecognition = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
    }, []);

    return {
        startSpeechRecognition,
        stopSpeechRecognition
    };
}
