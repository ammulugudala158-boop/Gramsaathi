import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Volume2, VolumeX, Eye, Globe, LogOut, ShieldAlert, Sparkles, Settings } from 'lucide-react';
import { LANGUAGES } from '../utils/constants';
import { getTranslation } from '../utils/translations';
import { useContrast } from './HighContrastWrapper';
import { SettingsModal } from './SettingsModal';
import { authApi } from '../utils/api';

export function Navbar({ currentLanguage, onLanguageChange, isSpeaking, stopSpeaking, voiceEngine }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isExtremeContrast, toggleContrast } = useContrast();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [screenReaderActive, setScreenReaderActive] = useState(false);

  const isGuest = sessionStorage.getItem('gramsaathi_guest_mode') === 'true';
  const hasToken = Boolean(sessionStorage.getItem('gramsaathi_token') || localStorage.getItem('gramsaathi_token'));
  const currentLangObj = LANGUAGES.find(l => l.code === currentLanguage) || LANGUAGES[0];

  React.useEffect(() => {
    if (!showLangMenu) return;
    const handleClickOutside = () => setShowLangMenu(false);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [showLangMenu]);

  // Screen reader focus listener
  React.useEffect(() => {
    if (!screenReaderActive || !voiceEngine?.speak) return;

    const handleFocus = (e) => {
      const target = e.target;
      const label = target.getAttribute('aria-label') || 
                    target.getAttribute('title') || 
                    target.innerText || 
                    target.placeholder;
      if (label && label.length < 100) {
        voiceEngine.speak(label.trim(), currentLanguage);
      }
    };

    window.addEventListener('focusin', handleFocus);
    return () => window.removeEventListener('focusin', handleFocus);
  }, [screenReaderActive, currentLanguage, voiceEngine]);

  const handleLanguageSwitch = async (langCode) => {
    onLanguageChange(langCode);
    setShowLangMenu(false);

    const selected = LANGUAGES.find(l => l.code === langCode);
    if (selected && voiceEngine?.speak) {
      voiceEngine.speak(selected.greeting, langCode);
    }

    const token = sessionStorage.getItem('gramsaathi_token') || localStorage.getItem('gramsaathi_token');
    if (token) {
      try {
        await authApi.updateLanguage(langCode);
      } catch (e) {
        console.warn('Could not persist language to backend:', e);
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('gramsaathi_token');
    sessionStorage.removeItem('gramsaathi_unlock_token');
    sessionStorage.removeItem('gramsaathi_guest_mode');
    localStorage.removeItem('gramsaathi_token');
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b-2 border-amber-500/30 px-3 py-3 md:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          
          {/* Brand Logo */}
          <Link 
            to={isGuest ? "/guest" : (hasToken ? "/dashboard" : "/")}
            className="flex items-center gap-2 group text-decoration-none focus:outline-none focus:ring-4 focus:ring-amber-400 rounded-lg p-1"
            aria-label="GramSaathi Home"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl md:text-2xl shadow-lg border-2 border-amber-300">
              🌾
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl md:text-2xl font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
                  {getTranslation(currentLanguage, 'appName')}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-400/30">
                  AI
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                {getTranslation(currentLanguage, 'tagline')}
              </p>
            </div>
          </Link>

          {/* Right Controls */}
          <div className="flex items-center gap-2 md:gap-3">

            {/* Guest Mode Indicator */}
            {isGuest && (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-bold"
                title="Guest Mode: No data saved"
              >
                <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="hidden md:inline">Guest Mode</span>
              </div>
            )}

            {/* Audio Stop Button (shown whenever voice is speaking) */}
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                data-voice-control="true"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-black font-extrabold text-sm shadow-tactile animate-pulse focus:outline-none focus:ring-4 focus:ring-white"
                aria-label="Stop audio readback"
              >
                <VolumeX className="w-4 h-4" />
                <span>{getTranslation(currentLanguage, 'stopAudio')}</span>
              </button>
            )}

            {/* High Contrast Mode Toggle */}
            <button
              onClick={toggleContrast}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs md:text-sm font-bold border-2 transition-all focus:outline-none focus:ring-4 ${
                isExtremeContrast
                  ? 'bg-yellow-400 text-black border-white'
                  : 'bg-slate-800 text-amber-300 border-amber-500/40 hover:bg-slate-700'
              }`}
              title="Toggle Extreme High Contrast for low vision"
              aria-label="Toggle Extreme Contrast"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isExtremeContrast ? 'AAA View' : 'Contrast'}
              </span>
            </button>

            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs md:text-sm border-2 border-slate-700 focus:outline-none focus:ring-4 focus:ring-amber-400"
                aria-label="Switch Language"
              >
                <Globe className="w-4 h-4 text-amber-400" />
                <span>{currentLangObj.label}</span>
              </button>

              {showLangMenu && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-slate-900 border-2 border-amber-400/60 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1"
                  role="menu"
                >
                  <div className="text-2xs font-black uppercase text-amber-400 px-3 py-1 tracking-wider border-b border-slate-800">
                    Select Language
                  </div>
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSwitch(lang.code)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold text-left transition-all ${
                        lang.code === currentLanguage
                          ? 'bg-amber-500 text-black'
                          : 'text-white hover:bg-slate-800'
                      }`}
                    >
                      <span>{lang.label}</span>
                      <span className="text-xs opacity-75 font-normal">({lang.nameEn})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Accessibility & Voice Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 focus:outline-none focus:ring-4 focus:ring-amber-400 transition-colors"
              title="Voice & Accessibility Settings"
              aria-label="Open Voice and Language Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Logout / Switch PIN */}
            {(hasToken || isGuest) && location.pathname !== '/' && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/50 transition-colors focus:outline-none focus:ring-4 focus:ring-red-400"
                title={getTranslation(currentLanguage, 'logout')}
                aria-label="Exit or Switch User"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentLanguage={currentLanguage}
        onLanguageChange={onLanguageChange}
        voiceEngine={voiceEngine}
        screenReaderActive={screenReaderActive}
        setScreenReaderActive={setScreenReaderActive}
      />
    </>
  );
}

