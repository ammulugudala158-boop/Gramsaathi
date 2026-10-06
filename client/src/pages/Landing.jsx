import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, UserPlus, Users, Sparkles, Volume2, ShieldCheck, HeartHandshake } from 'lucide-react';
import { LANGUAGES } from '../utils/constants';
import { getTranslation } from '../utils/translations';

export function Landing({
  currentLanguage,
  onLanguageChange,
  voiceEngine
}) {
  const navigate = useNavigate();

  // Play audio greeting when landing page loads or language changes
  useEffect(() => {
    const langObj = LANGUAGES.find(l => l.code === currentLanguage);
    if (langObj && voiceEngine?.speak) {
      const timer = setTimeout(() => {
        voiceEngine.speak(langObj.greeting, currentLanguage);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentLanguage]);

  const handleSelectLanguage = (langCode) => {
    onLanguageChange(langCode);
    const selected = LANGUAGES.find(l => l.code === langCode);
    if (selected && voiceEngine?.speak) {
      voiceEngine.speak(selected.greeting, langCode);
    }
  };

  const handleGuestEntry = () => {
    sessionStorage.setItem('gramsaathi_guest_mode', 'true');
    sessionStorage.removeItem('gramsaathi_token');
    sessionStorage.removeItem('gramsaathi_unlock_token');
    localStorage.removeItem('gramsaathi_token');
    navigate('/guest');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      
      {/* Hero Welcome */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-300 font-black text-sm uppercase tracking-wide mb-4 shadow-lg">
          <HeartHandshake className="w-5 h-5 text-amber-400" />
          <span>Universal Rural Accessibility</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
          {getTranslation(currentLanguage, 'appName')}
        </h1>
        <p className="text-xl md:text-2xl font-bold text-amber-400 mt-2">
          {getTranslation(currentLanguage, 'tagline')}
        </p>
        <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto mt-4 font-medium">
          Speak in your mother tongue to discover pensions, farm grants, health cards, and scholarships without typing, reading small text, or complex paperwork.
        </p>
      </div>

      {/* Language Selection Grid */}
      <div className="mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Volume2 className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl md:text-2xl font-black text-white text-center">
            {getTranslation(currentLanguage, 'selectLanguage')}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          {LANGUAGES.map((lang) => {
            const isSelected = lang.code === currentLanguage;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                className={`p-4 md:p-5 rounded-2xl border-4 text-center transition-all flex flex-col items-center justify-center gap-1.5 shadow-md active:scale-95 focus:outline-none focus:ring-4 focus:ring-white ${
                  isSelected
                    ? 'bg-amber-500 border-white text-black font-black scale-105 shadow-high-contrast'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-white font-bold'
                }`}
                aria-label={`Select language: ${lang.nameEn}`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="text-lg md:text-xl font-black">{lang.label}</span>
                <span className="text-xs opacity-75 font-semibold">{lang.nameEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Action Paths */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Path 1: Login with PIN */}
        <button
          onClick={() => navigate('/auth?mode=login')}
          className="p-6 md:p-8 rounded-3xl bg-slate-900 hover:bg-slate-800 border-3 border-amber-400/60 hover:border-amber-400 text-left transition-all shadow-xl flex flex-col justify-between group active:scale-98 focus:outline-none focus:ring-4 focus:ring-amber-400"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
            <KeyRound className="w-9 h-9" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white group-hover:text-amber-300">
              {getTranslation(currentLanguage, 'loginWithPin')}
            </h3>
            <p className="text-sm text-slate-300 font-medium mt-2">
              Speak or tap your existing 4-digit Voice-PIN to resume your scheme assistant.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-amber-400 font-black text-sm">
            <span>Enter With PIN</span>
            <span>→</span>
          </div>
        </button>

        {/* Path 2: Create New PIN */}
        <button
          onClick={() => navigate('/auth?mode=register')}
          className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black text-left transition-all shadow-xl flex flex-col justify-between group active:scale-98 border-3 border-white focus:outline-none focus:ring-4 focus:ring-white"
        >
          <div className="w-16 h-16 rounded-2xl bg-black/20 border-2 border-black/30 flex items-center justify-center text-black mb-6 group-hover:scale-110 transition-transform">
            <UserPlus className="w-9 h-9" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-black">
              {getTranslation(currentLanguage, 'createPin')}
            </h3>
            <p className="text-sm text-black/80 font-bold mt-2">
              No phone number, email, or OTP needed. Just pick 4 numbers by voice or touch.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-black font-black text-sm">
            <span>Create Free PIN</span>
            <span>→</span>
          </div>
        </button>

        {/* Path 3: Guest Mode */}
        <button
          onClick={handleGuestEntry}
          className="p-6 md:p-8 rounded-3xl bg-slate-900 hover:bg-slate-800 border-3 border-emerald-500/60 hover:border-emerald-400 text-left transition-all shadow-xl flex flex-col justify-between group active:scale-98 focus:outline-none focus:ring-4 focus:ring-emerald-400"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
            <Users className="w-9 h-9" />
          </div>
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-xs mb-2">
              ASHA / Shared Phone
            </div>
            <h3 className="text-2xl font-black text-white group-hover:text-emerald-300">
              {getTranslation(currentLanguage, 'guestMode')}
            </h3>
            <p className="text-sm text-slate-300 font-medium mt-2">
              Explore schemes without saving any history on this phone. Safe for public kiosks.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-emerald-400 font-black text-sm">
            <span>Explore as Guest</span>
            <span>→</span>
          </div>
        </button>

      </div>

      {/* Extreme Accessibility Footnote */}
      <div className="mt-12 text-center text-xs md:text-sm text-slate-400 flex items-center justify-center gap-2">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
        <span>Strictly adheres to WCAG AAA High Contrast, Web Speech API, and Zero Data Leakage Standards.</span>
      </div>

    </div>
  );
}
