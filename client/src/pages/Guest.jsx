import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Camera, Sparkles, Volume2 } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { Dashboard } from './Dashboard';

export function Guest({
  currentLanguage,
  onLanguageChange,
  voiceEngine
}) {
  const navigate = useNavigate();

  useEffect(() => {
    // Strictly ensure guest mode is flagged in session only
    sessionStorage.setItem('gramsaathi_guest_mode', 'true');
    localStorage.removeItem('gramsaathi_token');
  }, []);

  return (
    <div>
      {/* Prominent Guest Mode Privacy Banner */}
      <div className="bg-emerald-950/80 border-b-2 border-emerald-500/50 px-4 py-3 text-center">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-emerald-200 text-xs md:text-sm font-bold">
          <ShieldAlert className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{getTranslation(currentLanguage, 'guestNotice')}</span>
        </div>
      </div>

      {/* Render the full interactive dashboard in guest mode */}
      <Dashboard
        currentLanguage={currentLanguage}
        onLanguageChange={onLanguageChange}
        voiceEngine={voiceEngine}
        isGuestMode={true}
      />
    </div>
  );
}
