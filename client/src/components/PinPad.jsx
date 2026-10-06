import React, { useEffect } from 'react';
import { Delete, Mic, Volume2 } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { parseSpokenPin } from '../utils/constants';

export function PinPad({
  pin = '',
  setPin,
  onComplete,
  currentLanguage = 'en-IN',
  speak,
  isListening = false,
  startListeningPin,
  stopListeningPin,
  disabled = false,
  lockoutSeconds = 0
}) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'DEL'];

  const handleDigitPress = (digit) => {
    if (disabled || lockoutSeconds > 0) return;

    if (digit === 'C') {
      setPin('');
      if (speak) speak('PIN cleared', currentLanguage);
      return;
    }

    if (digit === 'DEL') {
      const updated = pin.slice(0, -1);
      setPin(updated);
      if (speak) {
        speak(updated.length > 0 ? `${updated.length} digits` : 'Empty', currentLanguage);
      }
      return;
    }

    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);

      // Audio readback confirmation
      if (speak) {
        const readbackFn = getTranslation(currentLanguage, 'pinReadback');
        const readbackText = typeof readbackFn === 'function' ? readbackFn(nextPin.length) : `${nextPin.length} digits entered`;
        speak(readbackText, currentLanguage);
      }

      if (nextPin.length === 4 && onComplete) {
        onComplete(nextPin);
      }
    }
  };

  // Listen to keyboard numpad inputs as well
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (disabled || lockoutSeconds > 0) return;
      if (/^[0-9]$/.test(e.key)) {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDigitPress('DEL');
      } else if (e.key === 'Escape') {
        handleDigitPress('C');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, disabled, lockoutSeconds]);

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center">
      
      {/* Lockout Warning */}
      {lockoutSeconds > 0 && (
        <div className="w-full mb-4 p-3 bg-red-950/80 border-2 border-red-500 rounded-2xl text-center text-red-200 animate-pulse">
          <p className="font-black text-sm uppercase tracking-wide">Lockout Active (3 Wrong Attempts)</p>
          <p className="text-xl font-black text-red-400 mt-1">
            Wait {Math.floor(lockoutSeconds / 60)}m {lockoutSeconds % 60}s
          </p>
        </div>
      )}

      {/* 4-PIN Circles / Dots */}
      <div 
        className="flex items-center justify-center gap-4 mb-6"
        aria-label={`PIN display: ${pin.length} of 4 digits entered`}
      >
        {[0, 1, 2, 3].map((index) => {
          const filled = index < pin.length;
          return (
            <div
              key={index}
              className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-2xl font-black transition-all border-4 ${
                filled
                  ? 'bg-amber-500 border-amber-300 text-black shadow-lg scale-105'
                  : 'bg-slate-900 border-slate-700 text-slate-500'
              }`}
            >
              {filled ? '●' : '—'}
            </div>
          );
        })}
      </div>

      {/* Voice PIN Input Button */}
      <div className="w-full mb-5">
        <button
          type="button"
          data-voice-control="true"
          onClick={isListening ? stopListeningPin : startListeningPin}
          disabled={disabled || lockoutSeconds > 0}
          className={`w-full py-4 px-6 rounded-2xl font-black text-lg md:text-xl flex items-center justify-center gap-3 shadow-lg border-3 transition-all ${
            isListening
              ? 'bg-red-600 text-white border-white animate-pulse'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black border-amber-300'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={isListening ? 'Listening for 4 digits' : 'Speak your 4-digit PIN'}
        >
          <Mic className={`w-7 h-7 ${isListening ? 'animate-bounce' : ''}`} />
          <span>
            {isListening
              ? getTranslation(currentLanguage, 'listeningPin')
              : getTranslation(currentLanguage, 'speakPin')}
          </span>
        </button>
      </div>

      {/* Tactile 3x4 Numpad Grid */}
      <div className="grid grid-cols-3 gap-3 w-full" role="group" aria-label="PIN Numpad">
        {digits.map((digit) => {
          const isClear = digit === 'C';
          const isDel = digit === 'DEL';
          
          let btnClass = 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 text-2xl md:text-3xl';
          if (isClear) btnClass = 'bg-red-950/60 hover:bg-red-900 text-red-300 border-red-800 text-lg';
          if (isDel) btnClass = 'bg-amber-950/60 hover:bg-amber-900 text-amber-300 border-amber-800 text-lg';

          return (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              disabled={disabled || lockoutSeconds > 0}
              className={`h-16 md:h-18 rounded-2xl font-black border-3 flex items-center justify-center active:scale-95 transition-transform shadow-md focus:outline-none focus:ring-4 focus:ring-amber-400 ${btnClass} disabled:opacity-40 disabled:cursor-not-allowed`}
              aria-label={isClear ? 'Clear PIN' : isDel ? 'Delete last digit' : `Digit ${digit}`}
            >
              {isDel ? <Delete className="w-6 h-6" /> : digit}
            </button>
          );
        })}
      </div>

    </div>
  );
}
