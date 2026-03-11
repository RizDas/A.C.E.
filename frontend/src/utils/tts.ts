export function speak(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Try to find a high-quality "humanoid" male voice
  const voices = window.speechSynthesis.getVoices();
  
  // Prioritize specific male voices based on platform
  const preferredVoice = voices.find(v => 
    v.name.includes('Microsoft David') || 
    v.name.includes('Google US English Male') || 
    v.name.includes('Daniel') ||
    v.name.includes('Guy') ||
    v.name.includes('Male') ||
    v.name.includes('Neural') && (v.name.includes('Guy') || v.name.includes('Aria') === false)
  ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  if (onEnd) {
    utterance.onend = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}
