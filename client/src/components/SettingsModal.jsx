import React, { useState } from 'react';
import { X, Globe, Eye, Volume2, ShieldCheck, CheckCircle2, User, Sparkles } from 'lucide-react';
import { LANGUAGES } from '../utils/constants';
import { getTranslation } from '../utils/translations';
import { useContrast } from './HighContrastWrapper';
import { authApi } from '../utils/api';

export function SettingsModal({
  isOpen,
  onClose,
  currentLanguage,
  onLanguageChange,
  voiceEngine,
  screenReaderActive,
  setScreenReaderActive
}) {
  const { isExtremeContrast, toggleContrast } = useContrast();
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLanguageSelect = async (langCode) => {
    onLanguageChange(langCode);
    const selected = LANGUAGES.find(l => l.code === langCode);
    if (selected && voiceEngine?.speak) {
      voiceEngine.speak(selected.greeting, langCode);
    }

    const token = sessionStorage.getItem('gramsaathi_token') || localStorage.getItem('gramsaathi_token');
    if (token) {
      try {
        setSaving(true);
        await authApi.updateLanguage(langCode);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (e) {
        console.warn('Could not save language to backend profile:', e);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleScreenReaderToggle = () => {
    const nextState = !screenReaderActive;
    if (setScreenReaderActive) {
      setScreenReaderActive(nextState);
    }
    if (voiceEngine?.speak) {
      const msg = nextState
        ? (currentLanguage.startsWith('hi') ? 'स्क्रीन रीडर चालू किया गया।' : currentLanguage.startsWith('te') ? 'స్క్రీన్ రీడర్ ఆన్ చేయబడింది.' : 'Voice screen reader activated.')
        : (currentLanguage.startsWith('hi') ? 'स्क्रीन रीडर बंद किया गया।' : currentLanguage.startsWith('te') ? 'స్క్రీన్ రీడర్ ఆఫ్ చేయబడింది.' : 'Voice screen reader deactivated.');
      voiceEngine.speak(msg, currentLanguage);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border-4 border-amber-400 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-amber-400"
          aria-label="Close Settings"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400">
            <Globe className="w-7 h-7" />
          </div>
          <div>
            <h2 id="settings-modal-title" className="text-2xl font-black text-white">
              Accessibility & Language Settings
            </h2>
            <p className="text-xs text-slate-300 font-semibold">
              Customize voice assistant, language, and high contrast
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="mb-4 p-3 bg-emerald-950/80 border-2 border-emerald-500 text-emerald-200 rounded-2xl text-xs font-black flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Language preference synced to your profile!</span>
          </div>
        )}

        {/* Section 1: Language Selection */}
        <div className="mb-6">
          <label className="block text-sm font-black uppercase text-amber-400 tracking-wider mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>App & Voice Assistant Language</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLanguage;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`p-3.5 rounded-2xl border-2 text-left flex items-center gap-3 transition-all focus:outline-none focus:ring-4 focus:ring-white ${
                    isSelected
                      ? 'bg-amber-500 border-white text-black font-black shadow-lg scale-102'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white font-bold'
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="flex-1">
                    <div className="text-base font-black leading-tight">{lang.label}</div>
                    <div className="text-2xs opacity-75 font-normal">{lang.nameEn}</div>
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-black" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Audio Screen Reader (Accessibility for Blind & Visually Impaired) */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-800/80 border-2 border-slate-700 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Volume2 className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-base font-black text-white">Voice Focus Reader</div>
              <div className="text-xs text-slate-300 font-medium">
                Reads out buttons, inputs, and instructions aloud whenever focused.
              </div>
            </div>
          </div>
          <button
            onClick={handleScreenReaderToggle}
            className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider border-2 transition-all focus:outline-none focus:ring-4 focus:ring-amber-400 ${
              screenReaderActive
                ? 'bg-emerald-500 text-black border-white'
                : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
            }`}
          >
            {screenReaderActive ? 'Active' : 'Disabled'}
          </button>
        </div>

        {/* Section 3: High Contrast (WCAG AAA+) */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-800/80 border-2 border-slate-700 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Eye className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-base font-black text-white">Extreme Contrast Mode</div>
              <div className="text-xs text-slate-300 font-medium">
                Pure black (#000000) and bright yellow (#FFEE00) for low vision.
              </div>
            </div>
          </div>
          <button
            onClick={toggleContrast}
            className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider border-2 transition-all focus:outline-none focus:ring-4 focus:ring-amber-400 ${
              isExtremeContrast
                ? 'bg-yellow-400 text-black border-white font-black'
                : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
            }`}
          >
            {isExtremeContrast ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-base shadow-tactile border-2 border-white focus:outline-none focus:ring-4 focus:ring-amber-400"
        >
          Close Settings
        </button>

      </div>
    </div>
  );
}
