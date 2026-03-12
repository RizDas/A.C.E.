import { useRef, useState, useCallback } from 'react';
import { useAIContext } from '../../../context/AIContext';

export function useBlobAudio() {
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const audioDataRef = useRef<Uint8Array>(new Uint8Array(256));
    const smoothedAudioRef = useRef(0);
    const [micAllowed, setMicAllowed] = useState(false);
    const [micError, setMicError] = useState('');

    const { setMicActive, setMicPermission } = useAIContext();

    const startMic = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStreamRef.current = stream;
            setMicAllowed(true);
            setMicPermission(true);
            setMicActive(true);
            setMicError('');

            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = ctx;

            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.8;
            analyserRef.current = analyser;
            audioDataRef.current = new Uint8Array(analyser.frequencyBinCount);

            const source = ctx.createMediaStreamSource(stream);
            source.connect(analyser);

            return true;
        } catch (err: any) {
            console.error('Error accessing microphone:', err);
            setMicError('Microphone access denied. Please allow it in settings.');
            setMicAllowed(false);
            setMicPermission(false);
            setMicActive(false);
            return false;
        }
    }, [setMicActive, setMicPermission]);

    const stopMic = useCallback(() => {
        micStreamRef.current?.getTracks().forEach((t) => t.stop());
        audioContextRef.current?.close();
        micStreamRef.current = null;
        audioContextRef.current = null;
        analyserRef.current = null;
        smoothedAudioRef.current = 0;
        setMicAllowed(false);
        setMicActive(false);
    }, [setMicActive]);

    const getAudioLevel = useCallback(() => {
        if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(audioDataRef.current as any);
            const sum = audioDataRef.current.reduce((a, b) => a + b, 0);
            const raw = sum / (audioDataRef.current.length * 255);
            smoothedAudioRef.current += (raw - smoothedAudioRef.current) * 0.15;
            return smoothedAudioRef.current;
        }
        return 0;
    }, []);

    return {
        startMic,
        stopMic,
        getAudioLevel,
        micAllowed,
        micError,
        setMicError
    };
}
