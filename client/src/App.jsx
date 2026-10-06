import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HighContrastProvider } from './components/HighContrastWrapper';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Guest } from './pages/Guest';
import { Dashboard } from './pages/Dashboard';
import { SchemeDetails } from './pages/SchemeDetails';
import { DocumentCheck } from './pages/DocumentCheck';
import { SaathiPeti } from './pages/SaathiPeti';
import { useVoiceEngine } from './hooks/useVoiceEngine';
import { FloatingVoiceAssistant } from './components/FloatingVoiceAssistant';
import { SaathiPetiModal } from './components/SaathiPetiModal';

export function App() {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('gramsaathi_lang') || 'hi-IN';
  });
  const [showPetiModal, setShowPetiModal] = useState(false);

  const voiceEngine = useVoiceEngine(currentLanguage);

  const handleLanguageChange = (newLang) => {
    setCurrentLanguage(newLang);
    localStorage.setItem('gramsaathi_lang', newLang);
  };

  return (
    <HighContrastProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-black">
          
          {/* Universal Accessible Navbar */}
          <Navbar
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
            isSpeaking={voiceEngine.isSpeaking}
            stopSpeaking={voiceEngine.stopSpeaking}
            voiceEngine={voiceEngine}
          />

          {/* Main Application Routes */}
          <main className="flex-1 pb-16">
            <Routes>
              <Route
                path="/"
                element={
                  <Landing
                    currentLanguage={currentLanguage}
                    onLanguageChange={handleLanguageChange}
                    voiceEngine={voiceEngine}
                  />
                }
              />
              <Route
                path="/auth"
                element={
                  <Auth
                    currentLanguage={currentLanguage}
                    onLanguageChange={handleLanguageChange}
                    voiceEngine={voiceEngine}
                  />
                }
              />
              <Route
                path="/guest"
                element={
                  <Guest
                    currentLanguage={currentLanguage}
                    onLanguageChange={handleLanguageChange}
                    voiceEngine={voiceEngine}
                  />
                }
              />
              <Route
                path="/dashboard"
                element={
                  <Dashboard
                    currentLanguage={currentLanguage}
                    onLanguageChange={handleLanguageChange}
                    voiceEngine={voiceEngine}
                  />
                }
              />
              <Route
                path="/scheme/:id"
                element={
                  <SchemeDetails
                    currentLanguage={currentLanguage}
                    voiceEngine={voiceEngine}
                  />
                }
              />
              <Route
                path="/document-check"
                element={
                  <DocumentCheck
                    currentLanguage={currentLanguage}
                    voiceEngine={voiceEngine}
                  />
                }
              />
              <Route
                path="/saathi-peti"
                element={
                  <SaathiPeti
                    currentLanguage={currentLanguage}
                    voiceEngine={voiceEngine}
                  />
                }
              />
              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Always-Available Free AI Voice Assistant Companion */}
          <FloatingVoiceAssistant
            currentLanguage={currentLanguage}
            voiceEngine={voiceEngine}
            onOpenPetiModal={() => setShowPetiModal(true)}
          />

          {/* Secret Saathi Peti Vault Modal (Voice-Triggered) */}
          <SaathiPetiModal
            isOpen={showPetiModal}
            onClose={() => setShowPetiModal(false)}
            currentLanguage={currentLanguage}
            voiceEngine={voiceEngine}
          />

        </div>
      </BrowserRouter>
    </HighContrastProvider>
  );
}

export default App;
