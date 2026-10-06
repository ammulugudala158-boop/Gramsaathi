import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Sparkles, Volume2, Globe, CheckCircle2, ArrowRight, ArrowLeft, UserPlus, KeyRound } from 'lucide-react';
import { PinPad } from '../components/PinPad';
import { authApi } from '../utils/api';
import { getTranslation } from '../utils/translations';
import { LANGUAGES, parseSpokenPin } from '../utils/constants';

export function Auth({
  currentLanguage,
  onLanguageChange,
  voiceEngine
}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode') === 'register' ? 'register' : 'login';

  // Wizard step for registration (Step 1: Choose Language, Step 2: Set 4-Digit PIN)
  const [registerStep, setRegisterStep] = useState(1);
  const [selectedLang, setSelectedLang] = useState(currentLanguage || 'hi-IN');

  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Play audio guidance when entering Auth page or changing wizard step
  useEffect(() => {
    if (voiceEngine?.speak) {
      if (mode === 'register') {
        if (registerStep === 1) {
          const prompt = getTranslation(selectedLang, 'welcomeAudio');
          voiceEngine.speak(prompt, selectedLang);
        } else {
          const audioMsg = selectedLang.startsWith('hi')
            ? 'नया 4 अंकों का पिन बनाएं। याद रखें: बाद में योजनाएं देखने के लिए कहना होगा "साथी पेटी खोलो" और अपना पिन बोलना होगा।'
            : selectedLang.startsWith('te')
            ? 'కొత్త 4 అంకెల పిన్ సృష్టించండి. గుర్తుంచుకోండి: తర్వాత పథకాలు చూడటానికి "సాథీ పేటి తెరవండి" అని చెప్పి పిన్ చెప్పాలి.'
            : 'Create your 4-digit PIN. To see your saved schemes later, say "Open Saathi Peti" and speak your PIN.';
          voiceEngine.speak(audioMsg, selectedLang);
        }
      } else {
        const audioMsg = currentLanguage.startsWith('hi')
          ? 'अपना 4 अंकों का पिन बोलें या नीचे दिए गए नंबरों को दबाएं।'
          : currentLanguage.startsWith('te')
          ? 'మీ 4 అంకెల పిన్ చెప్పండి లేదా క్రింది నంబర్లను నొక్కండి.'
          : 'Speak your 4-digit PIN or tap the numbers below.';
        voiceEngine.speak(audioMsg, currentLanguage);
      }
    }
  }, [mode, registerStep, selectedLang, currentLanguage]);

  // Live lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handleSelectLanguage = (langCode) => {
    setSelectedLang(langCode);
    if (onLanguageChange) {
      onLanguageChange(langCode);
    }
    const found = LANGUAGES.find(l => l.code === langCode);
    if (found && voiceEngine?.speak) {
      voiceEngine.speak(found.greeting, langCode);
    }
  };

  const handlePinSubmit = async (enteredPin) => {
    if (enteredPin.length !== 4) return;
    setLoading(true);
    setErrorMsg('');

    try {
      if (mode === 'register') {
        const res = await authApi.register(enteredPin, selectedLang);
        const { token, user, secret_prompt } = res.data;

        sessionStorage.setItem('gramsaathi_token', token);
        localStorage.setItem('gramsaathi_token', token);
        sessionStorage.removeItem('gramsaathi_guest_mode');

        if (onLanguageChange && user.preferred_language) {
          onLanguageChange(user.preferred_language);
        }

        // Spoken secret prompt confirmation
        if (voiceEngine?.speak) {
          const prompt = getTranslation(selectedLang, 'registerSuccessPrompt');
          voiceEngine.speak(prompt, selectedLang, () => {
            navigate('/dashboard');
          });
        } else {
          navigate('/dashboard');
        }
      } else {
        const res = await authApi.login(enteredPin);
        const { token, user } = res.data;

        sessionStorage.setItem('gramsaathi_token', token);
        localStorage.setItem('gramsaathi_token', token);
        sessionStorage.removeItem('gramsaathi_guest_mode');

        // Dynamically render UI in user's saved language
        const userLang = user?.preferred_language || currentLanguage;
        if (onLanguageChange && user.preferred_language) {
          onLanguageChange(user.preferred_language);
        }

        if (voiceEngine?.speak) {
          const welcomeBack = userLang.startsWith('hi')
            ? 'लॉगिन सफल हुआ। आपका स्वागत है।'
            : userLang.startsWith('te')
            ? 'లాగిన్ విజయవంతమైంది. స్వాగతం.'
            : 'Login successful. Welcome back.';
          voiceEngine.speak(welcomeBack, userLang);
        }
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Auth error:', err);
      const resp = err.response?.data;
      if (err.response?.status === 429) {
        setLockoutSeconds(resp?.lockoutSeconds || 300);
        setErrorMsg(resp?.message || 'Account locked for 5 minutes.');
        if (voiceEngine?.speak) {
          voiceEngine.speak('Too many wrong attempts. Locked for 5 minutes.', selectedLang || currentLanguage);
        }
      } else {
        const msg = resp?.message || 'Incorrect PIN or account error.';
        setErrorMsg(msg);
        setPin('');
        if (voiceEngine?.speak) {
          voiceEngine.speak(msg, selectedLang || currentLanguage);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVoicePinStart = () => {
    if (!voiceEngine) return;
    const activeLang = mode === 'register' ? selectedLang : currentLanguage;
    voiceEngine.startListening({
      langOverride: activeLang,
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

  const activeLang = mode === 'register' ? selectedLang : currentLanguage;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      
      {/* Top Navigation */}
      <button
        onClick={() => {
          if (mode === 'register' && registerStep === 2) {
            setRegisterStep(1);
          } else {
            navigate('/');
          }
        }}
        className="flex items-center gap-2 text-slate-300 hover:text-amber-400 font-bold mb-6 focus:outline-none focus:ring-4 focus:ring-amber-400 rounded-lg p-1"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>{mode === 'register' && registerStep === 2 ? 'Back to Language Step' : 'Home'}</span>
      </button>

      {/* ============================================================== */}
      {/* SIGN UP / REGISTRATION ONBOARDING WIZARD */}
      {/* ============================================================== */}
      {mode === 'register' && (
        <div>
          {/* Step Tracker */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-black text-xs uppercase tracking-wide border-2 ${
              registerStep === 1 
                ? 'bg-amber-500 text-black border-amber-300 shadow-md' 
                : 'bg-emerald-950 text-emerald-300 border-emerald-500'
            }`}>
              <span>1. Choose Language</span>
              {registerStep > 1 && <CheckCircle2 className="w-4 h-4" />}
            </div>
            <span className="text-slate-600 font-bold">→</span>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-black text-xs uppercase tracking-wide border-2 ${
              registerStep === 2 
                ? 'bg-amber-500 text-black border-amber-300 shadow-md' 
                : 'bg-slate-900 text-slate-400 border-slate-700'
            }`}>
              <span>2. Set Voice-PIN</span>
            </div>
          </div>

          {/* STEP 1: MANDATORY LANGUAGE SELECTION */}
          {registerStep === 1 && (
            <div className="bg-slate-900 border-3 border-amber-400/60 rounded-3xl p-6 md:p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-3 border-amber-400 flex items-center justify-center text-amber-400 mx-auto mb-3 shadow-lg">
                  <Globe className="w-9 h-9" />
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-white">
                  {getTranslation(selectedLang, 'selectLanguage')}
                </h1>
                <p className="text-sm md:text-base text-slate-300 mt-2 font-medium">
                  Choose your mother tongue. The entire application, AI voice, and schemes will be in this language.
                </p>
              </div>

              {/* Languages Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {LANGUAGES.map((lang) => {
                  const isSelected = lang.code === selectedLang;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`p-4 rounded-2xl border-3 text-left transition-all flex items-center gap-4 shadow-md active:scale-95 focus:outline-none focus:ring-4 focus:ring-white ${
                        isSelected
                          ? 'bg-amber-500 border-white text-black font-black scale-102 shadow-high-contrast'
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white font-bold'
                      }`}
                      aria-label={`Select language ${lang.nameEn}`}
                    >
                      <span className="text-3xl">{lang.flag}</span>
                      <div className="flex-1">
                        <div className="text-lg font-black">{lang.label}</div>
                        <div className="text-xs opacity-75 font-semibold">{lang.nameEn}</div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-6 h-6 text-black" />}
                    </button>
                  );
                })}
              </div>

              {/* Continue to Step 2 Button */}
              <button
                onClick={() => setRegisterStep(2)}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-lg flex items-center justify-center gap-3 shadow-tactile border-2 border-white focus:outline-none focus:ring-4 focus:ring-amber-400"
              >
                <span>Continue to Step 2: Set PIN</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* STEP 2: SET 4-DIGIT PIN */}
          {registerStep === 2 && (
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-3 border-amber-400 flex items-center justify-center text-amber-400 mx-auto mb-3 shadow-lg">
                  <UserPlus className="w-9 h-9" />
                </div>
                <h1 className="text-3xl font-black text-white">
                  {getTranslation(selectedLang, 'createPin')}
                </h1>
                <p className="text-sm md:text-base text-slate-300 mt-2 font-medium">
                  {getTranslation(selectedLang, 'pinPrompt')}
                </p>

                {/* Secret Vault Educational Callout */}
                <div className="mt-4 p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-400/60 text-left flex items-start gap-3 shadow-lg">
                  <Sparkles className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs md:text-sm text-amber-200 font-bold leading-relaxed">
                    <strong>Secret Voice Access:</strong> {getTranslation(selectedLang, 'registerSuccessPrompt')}
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="mb-6 p-4 rounded-2xl bg-red-950/80 border-2 border-red-500 text-red-200 text-sm font-bold text-center">
                  {errorMsg}
                </div>
              )}

              {/* PinPad */}
              <div className="bg-slate-900 border-3 border-slate-800 rounded-3xl p-6 shadow-2xl">
                <PinPad
                  pin={pin}
                  setPin={setPin}
                  onComplete={handlePinSubmit}
                  currentLanguage={selectedLang}
                  speak={voiceEngine?.speak}
                  isListening={voiceEngine?.isListening}
                  startListeningPin={handleVoicePinStart}
                  stopListeningPin={voiceEngine?.stopListening}
                  disabled={loading}
                  lockoutSeconds={lockoutSeconds}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* LOGIN PAGE */}
      {/* ============================================================== */}
      {mode === 'login' && (
        <div>
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-3 border-amber-400 flex items-center justify-center text-amber-400 mx-auto mb-3 shadow-lg">
              <KeyRound className="w-9 h-9" />
            </div>
            <h1 className="text-3xl font-black text-white">
              {getTranslation(currentLanguage, 'loginWithPin')}
            </h1>
            <p className="text-sm md:text-base text-slate-300 mt-2 font-medium">
              {getTranslation(currentLanguage, 'pinPrompt')}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-950/80 border-2 border-red-500 text-red-200 text-sm font-bold text-center">
              {errorMsg}
            </div>
          )}

          {/* PinPad */}
          <div className="bg-slate-900 border-3 border-slate-800 rounded-3xl p-6 shadow-2xl">
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
          </div>
        </div>
      )}

      {/* Switch between Login and Register */}
      <div className="mt-6 text-center">
        {mode === 'register' ? (
          <button
            onClick={() => {
              setRegisterStep(1);
              navigate('/auth?mode=login');
            }}
            className="text-amber-400 hover:text-amber-300 font-black text-sm underline focus:outline-none focus:ring-4 focus:ring-amber-400 p-2 rounded-lg"
          >
            Already have a PIN? Login here
          </button>
        ) : (
          <button
            onClick={() => {
              setRegisterStep(1);
              navigate('/auth?mode=register');
            }}
            className="text-amber-400 hover:text-amber-300 font-black text-sm underline focus:outline-none focus:ring-4 focus:ring-amber-400 p-2 rounded-lg"
          >
            Don't have a PIN? Create a new 4-digit PIN
          </button>
        )}
      </div>

    </div>
  );
}

