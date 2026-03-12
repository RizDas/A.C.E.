'use client';

import { useEffect, useRef, useState, useCallback, PointerEvent as ReactPointerEvent } from 'react';
import * as THREE from 'three';
import { useBlobContext } from '../../../context/BlobContext';
import { useAIContext } from '../../../context/AIContext';
import { useUIContext } from '../../../context/UIContext';
import { useBlobAudio } from '../hooks/useBlobAudio';
import { useSpeechRecognition } from '../../chat/hooks/useSpeechRecognition';
import { useChat } from '../../chat/hooks/useChat';
import * as shaders from '../shaders/blobShaders';

// ─── Types ────────────────────────────────────────────────────────────────────
type BlobState = 'idle' | 'listening' | 'speaking' | 'processing';

export default function Blob() {
    const mountRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const animFrameRef = useRef<number>(0);
    const clockRef = useRef(new THREE.Clock());

    // Material refs
    const plasmaMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
    const particleMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
    const mainGroupRef = useRef<THREE.Group | null>(null);
    const plasmaMeshRef = useRef<THREE.Mesh | null>(null);

    const { settings, setPosition } = useBlobContext();
    const { clearTranscript, _toggleTrigger } = useAIContext();
    const { color, size, position, dragMode } = settings;

    const [blobState, setBlobState] = useState<BlobState>('idle');
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const { startMic, stopMic, getAudioLevel, micAllowed, micError } = useBlobAudio();
    const { handleSpeechResult } = useChat();
    const { startSpeechRecognition, stopSpeechRecognition } = useSpeechRecognition(handleSpeechResult);

    const toggleActivation = useCallback(async () => {
        if (micAllowed) {
            stopMic();
            stopSpeechRecognition();
            setBlobState('idle');
            clearTranscript();
            if (plasmaMaterialRef.current) plasmaMaterialRef.current.uniforms.uState.value = 0;
        } else {
            const success = await startMic();
            if (success) {
                startSpeechRecognition();
                setBlobState('listening');
                if (plasmaMaterialRef.current) plasmaMaterialRef.current.uniforms.uState.value = 1;
            }
        }
    }, [micAllowed, startMic, stopMic, startSpeechRecognition, stopSpeechRecognition, clearTranscript]);

    // Listen for external toggle requests
    const lastTrigger = useRef(_toggleTrigger);
    useEffect(() => {
        if (_toggleTrigger !== lastTrigger.current) {
            lastTrigger.current = _toggleTrigger;
            toggleActivation();
        }
    }, [_toggleTrigger, toggleActivation]);

    // ── Three.js Init ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!mountRef.current) return;
        const container = mountRef.current;
        const W = container.clientWidth;
        const H = container.clientHeight;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 100);
        camera.position.z = 3.2;
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.9;
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const mainGroup = new THREE.Group();
        scene.add(mainGroup);
        mainGroupRef.current = mainGroup;

        const pointLight = new THREE.PointLight(0x0088ff, 2.0, 10);
        mainGroup.add(pointLight);

        const shellGeo = new THREE.SphereGeometry(1.0, 64, 64);
        const shellBackMat = new THREE.ShaderMaterial({
            vertexShader: shaders.shellVertexShader,
            fragmentShader: shaders.shellFragmentShader,
            uniforms: { uColor: { value: new THREE.Color(0x000055) }, uOpacity: { value: 0.3 } },
            transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false,
        });
        const shellFrontMat = new THREE.ShaderMaterial({
            vertexShader: shaders.shellVertexShader,
            fragmentShader: shaders.shellFragmentShader,
            uniforms: { uColor: { value: new THREE.Color(0x0066ff) }, uOpacity: { value: 0.41 } },
            transparent: true, blending: THREE.AdditiveBlending, side: THREE.FrontSide, depthWrite: false,
        });

        mainGroup.add(new THREE.Mesh(shellGeo, shellBackMat));
        mainGroup.add(new THREE.Mesh(shellGeo, shellFrontMat));

        const plasmaGeo = new THREE.SphereGeometry(0.998, 128, 128);
        const plasmaMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uScale: { value: 0.1404 },
                uBrightness: { value: 1.31 },
                uThreshold: { value: 0.072 },
                uColorDeep: { value: new THREE.Color(color.deep) },
                uColorMid: { value: new THREE.Color(color.mid) },
                uColorBright: { value: new THREE.Color(color.bright) },
                uAudioLevel: { value: 0 },
                uState: { value: 0 },
            },
            vertexShader: shaders.plasmaVertexShader,
            fragmentShader: shaders.plasmaFragmentShader,
            transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
        });
        plasmaMaterialRef.current = plasmaMat;
        const plasmaMesh = new THREE.Mesh(plasmaGeo, plasmaMat);
        plasmaMeshRef.current = plasmaMesh;
        mainGroup.add(plasmaMesh);

        const pCount = 600;
        const pPos = new Float32Array(pCount * 3);
        const pSizes = new Float32Array(pCount);
        for (let i = 0; i < pCount; i++) {
            const r = 0.95 * Math.cbrt(Math.random());
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            pPos[i * 3 + 2] = r * Math.cos(phi);
            pSizes[i] = Math.random();
        }
        const pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        pGeo.setAttribute('aSize', new THREE.BufferAttribute(pSizes, 1));
        const pMat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uAudioLevel: { value: 0 }, uColor: { value: new THREE.Color(0xffffff) } },
            vertexShader: shaders.particleVertexShader,
            fragmentShader: shaders.particleFragmentShader,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
        });
        particleMaterialRef.current = pMat;
        mainGroup.add(new THREE.Points(pGeo, pMat));

        const animate = () => {
            animFrameRef.current = requestAnimationFrame(animate);
            const t = clockRef.current.getElapsedTime();
            const audioLevel = getAudioLevel();

            const targetScale = 1.0 + audioLevel * 2.2;
            const currentScale = mainGroup.scale.x;
            mainGroup.scale.setScalar(currentScale + (targetScale - currentScale) * 0.08);

            mainGroup.rotation.x += 0.002 * (1.0 + audioLevel * 3.0);
            mainGroup.rotation.y += 0.005 * (1.0 + audioLevel * 3.0);

            if (plasmaMaterialRef.current) {
                plasmaMaterialRef.current.uniforms.uTime.value = t * (0.78 + audioLevel * 1.5);
                plasmaMaterialRef.current.uniforms.uAudioLevel.value = audioLevel;
            }
            if (plasmaMeshRef.current) plasmaMeshRef.current.rotation.y = t * 0.08;
            if (particleMaterialRef.current) {
                particleMaterialRef.current.uniforms.uTime.value = t;
                particleMaterialRef.current.uniforms.uAudioLevel.value = audioLevel;
            }
            renderer.render(scene, camera);
        };
        animate();

        const onResize = () => {
            if (!container) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        };
        window.addEventListener('resize', onResize);

        return () => {
            window.removeEventListener('resize', onResize);
            cancelAnimationFrame(animFrameRef.current);
            renderer.dispose();
            if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (plasmaMaterialRef.current) {
            plasmaMaterialRef.current.uniforms.uColorDeep.value.set(color.deep);
            plasmaMaterialRef.current.uniforms.uColorMid.value.set(color.mid);
            plasmaMaterialRef.current.uniforms.uColorBright.value.set(color.bright);
        }
    }, [color]);

    const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (!dragMode) return;
        setIsDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
        const rect = e.currentTarget.getBoundingClientRect();
        dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (!isDragging || !dragMode) return;
        setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };

    const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const blobStyle: React.CSSProperties = {
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        cursor: dragMode ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
        zIndex: dragMode ? 100 : 0,
        touchAction: 'none',
        ...(position ? { left: position.x, top: position.y } : { bottom: 0, right: 0 }),
    };

    return (
        <div style={{ width: '100vw', height: '100vh', background: 'transparent', fontFamily: '"DM Sans", sans-serif', position: 'relative', overflow: 'hidden' }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400&display=swap');`}</style>
            <div ref={mountRef} style={blobStyle} onClick={() => !dragMode && toggleActivation()} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} />
            {micError && <div style={{ marginTop: '12px', color: 'rgba(255,80,80,0.8)', fontSize: '12px', maxWidth: '300px', textAlign: 'center' }}>{micError}</div>}
        </div>
    );
}