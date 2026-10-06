import { useState, useEffect, useRef, useCallback } from 'react';

// Browser compatibility fallback for SpeechRecognition
const SpeechRecognition = typeof window !== 'undefined' 
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
  : null;

export function useVoiceEngine(currentLanguage = 'en-IN') {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState(null);

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const activeUtteranceRef = useRef(null);

  // Stop TTS immediately whenever the user taps anywhere on the screen
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      try {
        synthRef.current.cancel();
      } catch (e) {
        console.warn('SpeechSynthesis cancel error:', e);
      }
    }
    setIsSpeaking(false);
  }, []);

  // Set up screen-tap listener to pause TTS
  useEffect(() => {
    const handleScreenTap = (e) => {
      // If user tapped a button intended to start speech, don't cancel instantly
      if (e.target.closest('[data-voice-control]')) {
        return;
      }
      if (synthRef.current && synthRef.current.speaking) {
        stopSpeaking();
      }
    };

    window.addEventListener('pointerdown', handleScreenTap);
    return () => {
      window.removeEventListener('pointerdown', handleScreenTap);
    };
  }, [stopSpeaking]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  /**
   * Speak text via SpeechSynthesis with language locale
   */
  const speak = useCallback((text, langOverride = null, onEndCallback = null) => {
    if (!synthRef.current || !text) return;

    // Cancel any previous utterance
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const lang = langOverride || currentLanguage || 'en-IN';
    utterance.lang = lang;
    utterance.rate = 0.95; // Slightly slower for elderly/low-literacy clarity
    utterance.pitch = 1.0;

    // Pick best matching voice if available
    const voices = synthRef.current.getVoices();
    const langPrefix = lang.split('-')[0];
    const matchedVoice = voices.find(v => v.lang === lang || v.lang.startsWith(langPrefix));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      activeUtteranceRef.current = utterance;
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      activeUtteranceRef.current = null;
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = (e) => {
      console.warn('TTS playback error:', e);
      setIsSpeaking(false);
      activeUtteranceRef.current = null;
    };

    try {
      synthRef.current.speak(utterance);
    } catch (e) {
      console.error('Speech synthesis speak failure:', e);
      setIsSpeaking(false);
    }
  }, [currentLanguage]);

  /**
   * Start Speech-To-Text with auto-stop on silence
   */
  const startListening = useCallback(({ onResult, onSilence, langOverride } = {}) => {
    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please use Chrome/Edge or type below.');
      return;
    }

    // Stop speaking if currently speaking
    stopSpeaking();

    // Stop any existing recognition instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    const recognition = new SpeechRecognition();
    recognition.lang = langOverride || currentLanguage || 'en-IN';
    recognition.continuous = false; // Auto finishes when speech pauses
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    setTranscript('');
    setSpeechError(null);

    const resetSilenceTimer = (currentText) => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      // Auto-stop after 2.5 seconds of silence after words are detected
      silenceTimerRef.current = setTimeout(() => {
        try {
          recognition.stop();
        } catch (e) {}
        if (onSilence && currentText) {
          onSilence(currentText);
        }
      }, 2500);
    };

    recognition.onstart = () => {
      setIsListening(true);
      // Timeout if user taps mic but stays completely silent for 6 seconds
      silenceTimerRef.current = setTimeout(() => {
        try {
          recognition.stop();
        } catch (e) {}
      }, 6000);
    };

    recognition.onresult = (event) => {
      let finalStr = '';
      let interimStr = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalStr += item[0].transcript;
        } else {
          interimStr += item[0].transcript;
        }
      }

      const currentText = (finalStr || interimStr).trim();
      setTranscript(currentText);
      resetSilenceTimer(currentText);

      if (onResult && currentText) {
        onResult(currentText, Boolean(finalStr));
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setSpeechError('Microphone permission was denied. Please allow microphone access in browser settings.');
      } else if (event.error !== 'no-speech') {
        setSpeechError(`Voice recognition: ${event.error}`);
      }
      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setIsListening(false);
    }
  }, [currentLanguage, stopSpeaking]);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    setTranscript,
    isSpeaking,
    speechError,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    hasSpeechSupport: Boolean(SpeechRecognition)
  };
}
