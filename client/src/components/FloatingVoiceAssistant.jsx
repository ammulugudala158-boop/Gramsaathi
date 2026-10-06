import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, HelpCircle, X, Compass, FileText, Lock } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { isSaathiPetiTrigger, parseGlobalVoiceCommand } from '../utils/constants';

export function FloatingVoiceAssistant({
  currentLanguage,
  voiceEngine,
  onOpenPetiModal
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [lastHeard, setLastHeard] = useState('');

  const isListening = voiceEngine?.isListening;
  const isSpeaking = voiceEngine?.isSpeaking;

  const handleToggleVoice = () => {
    if (!voiceEngine) return;

    if (isListening) {
      voiceEngine.stopListening();
    } else {
      if (isSpeaking) {
        voiceEngine.stopSpeaking();
      }

      voiceEngine.startListening({
        langOverride: currentLanguage,
        onResult: (text) => {
          setLastHeard(text);

          // Secret Saathi Peti command
          if (isSaathiPetiTrigger(text)) {
            voiceEngine.stopListening();
            if (onOpenPetiModal) onOpenPetiModal();
            return;
          }

          // Global Navigation Commands
          const cmd = parseGlobalVoiceCommand(text);
          if (cmd) {
            if (cmd.type === 'NAVIGATE_DOC_CHECK') {
              voiceEngine.stopListening();
              navigate('/document-check');
              if (voiceEngine?.speak) {
                voiceEngine.speak(getTranslation(currentLanguage, 'documentCheck'), currentLanguage);
              }
              return;
            }
            if (cmd.type === 'HELP') {
              voiceEngine.stopListening();
              const helpMsg = currentLanguage.startsWith('hi')
                ? 'मैं ग्रामसाथी हूँ। आप अपनी उम्र, काम या समस्या बोलकर सरकारी योजनाएं खोज सकते हैं।'
                : currentLanguage.startsWith('te')
                ? 'నేను గ్రామసాథి. మీ వయస్సు, వృత్తి లేదా సమస్యను చెప్పి ప్రభుత్వ పథకాలను కనుగొనవచ్చు.'
                : 'I am GramSaathi. Speak your situation to find matching government schemes.';
              voiceEngine.speak(helpMsg, currentLanguage);
              return;
            }
          }
        }
      });
    }
  };

  const handleReadCurrentScreen = () => {
    if (!voiceEngine?.speak) return;

    let textToRead = '';
    if (location.pathname.includes('/dashboard')) {
      textToRead = currentLanguage.startsWith('hi')
        ? 'आप मुख्य डैशबोर्ड पर हैं। योजनाएं खोजने के लिए माइक बटन दबाएं और अपनी बात बोलें।'
        : currentLanguage.startsWith('te')
        ? 'మీరు ప్రధాన డాష్‌బోర్డులో ఉన్నారు. పథకాలను వెతకడానికి మైక్ నొక్కి మాట్లాడండి.'
        : 'You are on the main dashboard. Tap the microphone and describe your situation to find schemes.';
    } else if (location.pathname.includes('/document-check')) {
      textToRead = currentLanguage.startsWith('hi')
        ? 'दस्तावेज़ फोटो जांच। अपना आधार या राशन कार्ड का फोटो लें ताकि जांच सकें कि यह साफ है।'
        : 'Document photo check. Take a photo of your Aadhaar or Ration Card to check clarity.';
    } else if (location.pathname.includes('/saathi-peti')) {
      textToRead = currentLanguage.startsWith('hi')
        ? 'आपकी गुप्त साथी पेटी। यहाँ आपकी सहेजी हुई योजनाएं 30 दिन तक सुरक्षित रहती हैं।'
        : 'Your private Saathi Peti vault with your saved schemes.';
    } else {
      textToRead = getTranslation(currentLanguage, 'welcomeAudio');
    }

    voiceEngine.speak(textToRead, currentLanguage);
  };

  return (
    <div className="fixed bottom-6 left-6 z-40 print:hidden">
      
      {/* Expanded Help Panel */}
      {expanded && (
        <div className="mb-3 w-72 sm:w-80 bg-slate-900 border-3 border-amber-400 rounded-3xl p-4 shadow-2xl animate-fadeIn text-white">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="font-black text-sm text-amber-400">GramSaathi Voice AI</span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="p-1 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 mb-3 font-medium">
            100% Free Voice Assistant for hands-free and screen-free navigation.
          </p>

          <div className="space-y-2">
            <button
              onClick={handleReadCurrentScreen}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-2 border border-slate-700 text-left"
            >
              <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Read Current Screen Aloud</span>
            </button>

            <button
              onClick={() => navigate('/document-check')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 text-left"
            >
              <FileText className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Check Document Photo</span>
            </button>
          </div>

          {lastHeard && (
            <div className="mt-3 p-2 bg-black/40 rounded-xl border border-white/10 text-2xs text-amber-200">
              <span className="text-slate-400 block">Heard:</span>
              <span className="font-bold">"{lastHeard}"</span>
            </div>
          )}
        </div>
      )}

      {/* Floating Floating Action Pill */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-voice-control="true"
          onClick={handleToggleVoice}
          className={`h-14 px-5 rounded-full font-black text-sm flex items-center gap-3 shadow-2xl border-3 transition-all active:scale-95 focus:outline-none focus:ring-4 focus:ring-amber-400 ${
            isListening
              ? 'bg-red-600 text-white border-white animate-pulse shadow-red-500/50 scale-105'
              : isSpeaking
              ? 'bg-amber-500 text-black border-white animate-bounce'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black border-amber-300 shadow-amber-500/30'
          }`}
          aria-label={isListening ? 'Stop Listening' : 'Tap for Voice Assistant'}
          title="Voice Assistant (Free & Hands-free)"
        >
          {isListening ? (
            <>
              <Mic className="w-6 h-6 animate-bounce" />
              <span>Listening...</span>
            </>
          ) : isSpeaking ? (
            <>
              <VolumeX className="w-6 h-6" />
              <span>Speaking (Tap to Stop)</span>
            </>
          ) : (
            <>
              <Mic className="w-6 h-6" />
              <span>Voice Companion</span>
            </>
          )}
        </button>

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-14 h-14 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-400 border-3 border-amber-400/60 flex items-center justify-center shadow-xl transition-all active:scale-95 focus:outline-none focus:ring-4 focus:ring-amber-400"
          title="Voice Assistant Options"
          aria-label="Toggle Voice Assistant Options"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
}
