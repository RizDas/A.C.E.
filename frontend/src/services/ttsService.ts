/**
 * TTS Service for A.C.E – Adaptive Cognitive Engine
 *
 * Fixes the well-known Chrome bug where speechSynthesis.getVoices() returns []
 * until the browser has asynchronously fetched voices from its remote servers.
 *
 * Strategy:
 *   1. Pre-cache voices via the `voiceschanged` event at module load time.
 *   2. Fire a silent warm-up utterance on the first user interaction so Chrome
 *      "unlocks" audio playback (autoplay policy).
 *   3. Retry once if the first speak() call fails (another Chrome quirk).
 */

// ── Voice cache ──────────────────────────────────────────────────────────────

let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesReady = false;

function refreshVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  cachedVoices = window.speechSynthesis.getVoices();
  if (cachedVoices.length > 0) {
    voicesReady = true;
    console.log(
      `[A.C.E TTS] ${cachedVoices.length} voices loaded.`,
      cachedVoices.map((v) => `${v.name} (${v.lang})`).slice(0, 8)
    );
  }
}

// Eagerly try once (works in Firefox / Edge where voices are sync)
if (typeof window !== 'undefined' && window.speechSynthesis) {
  refreshVoices();

  // Chrome fires this event when the voice list is ready
  window.speechSynthesis.onvoiceschanged = () => {
    refreshVoices();
  };
}

// ── Audio unlock (autoplay policy) ───────────────────────────────────────────

let audioUnlocked = false;

function unlockAudio() {
  if (audioUnlocked) return;
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Fire a silent utterance to satisfy Chrome's autoplay policy
  const silent = new SpeechSynthesisUtterance('');
  silent.volume = 0;
  silent.rate = 10; // finish instantly
  window.speechSynthesis.speak(silent);
  audioUnlocked = true;
  console.log('[A.C.E TTS] Audio unlocked via user gesture.');
}

// Attach to common user-gesture events so the unlock runs early
if (typeof window !== 'undefined') {
  const gestureEvents = ['click', 'touchstart', 'keydown'] as const;
  const handler = () => {
    unlockAudio();
    // Also refresh voices in case they weren't ready before
    if (!voicesReady) refreshVoices();
    gestureEvents.forEach((evt) => window.removeEventListener(evt, handler));
  };
  gestureEvents.forEach((evt) => window.addEventListener(evt, handler, { once: false }));
}

// ── Voice selection ──────────────────────────────────────────────────────────

function pickVoice(): SpeechSynthesisVoice | null {
  // Try a live fetch in case cached list is stale
  if (!voicesReady || cachedVoices.length === 0) {
    refreshVoices();
  }

  const voices = cachedVoices;
  if (voices.length === 0) return null;

  // Priority list – first match wins (deep male voices preferred)
  const priorities = [
    // #1 pick: Microsoft Thomas – deep, natural male voice
    (v: SpeechSynthesisVoice) => /Thomas/i.test(v.name) && v.lang.startsWith('en'),
    // Other strong male neural voices on Windows
    (v: SpeechSynthesisVoice) => /Microsoft.*Guy.*Online/i.test(v.name) && v.lang.startsWith('en'),
    (v: SpeechSynthesisVoice) => /Microsoft.*Ryan.*Online/i.test(v.name) && v.lang.startsWith('en'),
    (v: SpeechSynthesisVoice) => /Microsoft.*Christopher.*Online/i.test(v.name) && v.lang.startsWith('en'),
    (v: SpeechSynthesisVoice) => /Microsoft.*Eric.*Online/i.test(v.name) && v.lang.startsWith('en'),
    (v: SpeechSynthesisVoice) => /Microsoft.*Steffan.*Online/i.test(v.name) && v.lang.startsWith('en'),
    // Any Microsoft Online Natural male-sounding voice
    (v: SpeechSynthesisVoice) => /Microsoft.*Online.*Natural/i.test(v.name) && !/Aria|Jenny|Sara|Michelle|Emma|Ava|Ana|Cora|Jane|Nancy|Sonia|Libby|Maisie|Leah|Holly/i.test(v.name) && v.lang.startsWith('en'),
    // Windows built-in male voices (non-neural fallbacks)
    (v: SpeechSynthesisVoice) => v.name.includes('Microsoft David'),
    (v: SpeechSynthesisVoice) => v.name.includes('Microsoft Mark'),
    // Google male voices (Chrome)
    (v: SpeechSynthesisVoice) => /Google US English Male/i.test(v.name),
    (v: SpeechSynthesisVoice) => /Google UK English Male/i.test(v.name),
    // macOS male voices
    (v: SpeechSynthesisVoice) => v.name.includes('Daniel') && v.lang.startsWith('en'),
    (v: SpeechSynthesisVoice) => v.name.includes('Alex') && v.lang.startsWith('en'),
    // Any English voice as last resort
    (v: SpeechSynthesisVoice) => v.lang.startsWith('en'),
  ];

  for (const test of priorities) {
    const match = voices.find(test);
    if (match) return match;
  }

  // Absolute fallback
  return voices[0];
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Speak the given text aloud.  Cancels any in-progress speech first.
 * @param text    The text to speak
 * @param onEnd   Optional callback fired when speech finishes (or on error)
 */
export function speak(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('[A.C.E TTS] speechSynthesis not available in this environment.');
    onEnd?.();
    return;
  }

  if (!text || text.trim().length === 0) {
    console.warn('[A.C.E TTS] Empty text, skipping.');
    onEnd?.();
    return;
  }

  // Cancel any queued / in-progress speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  const voice = pickVoice();
  if (voice) {
    utterance.voice = voice;
    console.log(`[A.C.E TTS] Using voice: ${voice.name} (${voice.lang})`);
  } else {
    console.warn('[A.C.E TTS] No voices available – using browser default.');
  }

  utterance.rate = 1.05;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // ── Event handlers ──
  utterance.onstart = () => {
    console.log('[A.C.E TTS] Speech started.');
  };

  utterance.onend = () => {
    console.log('[A.C.E TTS] Speech ended.');
    onEnd?.();
  };

  utterance.onerror = (event) => {
    // "interrupted" fires when we cancel() before a new speak – harmless
    if (event.error === 'interrupted' || event.error === 'canceled') {
      return;
    }
    console.error('[A.C.E TTS] Speech error:', event.error);
    onEnd?.();
  };

  // ── Chrome long-text bug workaround ──
  // Chrome pauses speech after ~15 s of continuous output.  Periodically
  // calling resume() keeps it alive.
  const keepAlive = setInterval(() => {
    if (!window.speechSynthesis.speaking) {
      clearInterval(keepAlive);
      return;
    }
    window.speechSynthesis.pause();
    window.speechSynthesis.resume();
  }, 10_000);

  utterance.onend = () => {
    clearInterval(keepAlive);
    console.log('[A.C.E TTS] Speech ended.');
    onEnd?.();
  };

  utterance.onerror = (event) => {
    clearInterval(keepAlive);
    if (event.error === 'interrupted' || event.error === 'canceled') return;
    console.error('[A.C.E TTS] Speech error:', event.error);
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
  console.log(`[A.C.E TTS] Queued: "${text.substring(0, 60)}…"`);

  // ── Retry safety net ──
  // If nothing has started speaking after 500 ms, cancel and retry once.
  setTimeout(() => {
    if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
      console.warn('[A.C.E TTS] First attempt may have failed – retrying…');
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }, 500);
}

/**
 * Immediately stop any in-progress speech.
 */
export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
