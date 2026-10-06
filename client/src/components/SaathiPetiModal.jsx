import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, X, ShieldAlert, Sparkles } from 'lucide-react';
import { PinPad } from './PinPad';
import { authApi } from '../utils/api';
import { getTranslation } from '../utils/translations';
import { parseSpokenPin } from '../utils/constants';

export function SaathiPetiModal({
  isOpen,
  onClose,
  currentLanguage,
  voiceEngine
}) {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  if (!isOpen) return null;

  const handlePinSubmit = async (enteredPin) => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await authApi.unlockPeti(enteredPin);
      const { unlock_token } = res.data;

      // Store unlock token for 5 minutes
      sessionStorage.setItem('gramsaathi_unlock_token', unlock_token);

      if (voiceEngine && voiceEngine.speak) {
        voiceEngine.speak('Saathi Peti unlocked successfully.', currentLanguage);
      }

      onClose();
      navigate('/saathi-peti');
    } catch (err) {
      const resp = err.response?.data;
      if (err.response?.status === 429) {
        setLockoutSeconds(resp?.lockoutSeconds || 300);
        setErrorMsg(resp?.message || 'Locked out for 5 minutes due to wrong PIN attempts.');
        if (voiceEngine && voiceEngine.speak) {
          voiceEngine.speak('Vault locked for 5 minutes.', currentLanguage);
        }
      } else {
        const msg = resp?.message || 'Incorrect PIN for Saathi Peti.';
        setErrorMsg(msg);
        setPin('');
        if (voiceEngine && voiceEngine.speak) {
          voiceEngine.speak(msg, currentLanguage);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVoicePinStart = () => {
    if (!voiceEngine) return;
    voiceEngine.startListening({
      langOverride: currentLanguage,
      onResult: (text) => {
        const parsed = parseSpokenPin(text);
        if (parsed) {
          setPin(parsed);
          if (parsed.length === 4) {
            voiceEngine.stopListening();
            handlePinSubmit(parsed);
          }
        }
      }
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="peti-modal-title"
    >
      <div className="relative w-full max-w-md bg-slate-900 border-4 border-amber-400 rounded-3xl p-6 shadow-2xl overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-amber-400"
          aria-label="Close Peti Unlock"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 id="peti-modal-title" className="text-2xl font-black text-amber-400">
              {getTranslation(currentLanguage, 'unlockVaultTitle')}
            </h2>
            <p className="text-xs text-slate-300 font-semibold">
              {getTranslation(currentLanguage, 'secretVoiceCommandPrompt')}
            </p>
          </div>
        </div>

        <p className="text-sm text-center text-slate-200 mb-6 font-medium">
          {getTranslation(currentLanguage, 'unlockVaultPrompt')}
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border-2 border-red-500 text-red-200 text-sm font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* Tactile PinPad */}
        <PinPad
          pin={pin}
          setPin={setPin}
          onComplete={handlePinSubmit}
          currentLanguage={currentLanguage}
          speak={voiceEngine?.speak}
          isListening={voiceEngine?.isListening}
          startListeningPin={handleVoicePinStart}
          stopListeningPin={voiceEngine?.stopListening}
          disabled={loading}
          lockoutSeconds={lockoutSeconds}
        />

        {loading && (
          <div className="mt-4 text-center text-amber-400 font-black animate-pulse">
            Verifying PIN...
          </div>
        )}

      </div>
    </div>
  );
}
