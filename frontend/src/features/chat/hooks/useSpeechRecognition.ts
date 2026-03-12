import { useRef, useCallback, useEffect } from 'react';

export function useSpeechRecognition(onResult: (transcript: string, isFinal: boolean) => void) {
    const recognitionRef = useRef<any>(null);
    const onResultRef = useRef(onResult);

    // Keep the ref updated with the latest callback
    useEffect(() => {
        onResultRef.current = onResult;
    }, [onResult]);

    const startSpeechRecognition = useCallback(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                
                recognition.onresult = (event: any) => {
                    let interimTranscript = '';
                    
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            onResultRef.current(event.results[i][0].transcript, true);
                        }
                    }

                    for (let i = 0; i < event.results.length; ++i) {
                        if (!event.results[i].isFinal) {
                            interimTranscript += event.results[i][0].transcript;
                        }
                    }

                    if (interimTranscript) {
                        onResultRef.current(interimTranscript, false);
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
