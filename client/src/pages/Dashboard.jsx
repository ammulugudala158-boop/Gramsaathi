import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, MicOff, Search, Volume2, Bookmark, CheckCircle, 
  ArrowRight, Sparkles, AlertCircle, Camera, FileCheck2, Filter
} from 'lucide-react';
import { schemesApi, petiApi } from '../utils/api';
import { getTranslation } from '../utils/translations';
import { SCHEME_CATEGORIES, isSaathiPetiTrigger, parseGlobalVoiceCommand } from '../utils/constants';
import { SaathiPetiModal } from '../components/SaathiPetiModal';

export function Dashboard({
  currentLanguage,
  onLanguageChange,
  voiceEngine,
  isGuestMode = false
}) {
  const navigate = useNavigate();
  const [queryText, setQueryText] = useState('');
  const [matchedSchemes, setMatchedSchemes] = useState([]);
  const [allSchemes, setAllSchemes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searching, setSearching] = useState(false);
  const [audioResponse, setAudioResponse] = useState('');
  const [savedSchemeIds, setSavedSchemeIds] = useState(new Set());
  const [showPetiModal, setShowPetiModal] = useState(false);
  const [notification, setNotification] = useState('');

  // Initial load: Fetch schemes list
  useEffect(() => {
    loadSchemes();
  }, [selectedCategory]);

  const loadSchemes = async () => {
    try {
      const res = await schemesApi.getAll(selectedCategory);
      setAllSchemes(res.data.schemes || []);
    } catch (err) {
      console.error('Error fetching schemes:', err);
    }
  };

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  /**
   * Submit query to Gemini AI scheme matcher
   */
  const handleSchemeSearch = async (textToSearch) => {
    const q = textToSearch || queryText;
    if (!q || q.trim().length < 2) return;

    // 1. Check if user spoke the secret Saathi Peti trigger phrase!
    if (isSaathiPetiTrigger(q)) {
      if (voiceEngine) {
        voiceEngine.stopSpeaking();
        voiceEngine.stopListening();
      }
      setShowPetiModal(true);
      return;
    }

    // 2. Check for global voice navigation commands
    const cmd = parseGlobalVoiceCommand(q);
    if (cmd) {
      if (cmd.type === 'NAVIGATE_DOC_CHECK') {
        if (voiceEngine?.speak) {
          voiceEngine.speak(getTranslation(currentLanguage, 'documentCheck'), currentLanguage);
        }
        navigate('/document-check');
        return;
      }
      if (cmd.type === 'HELP') {
        if (voiceEngine?.speak) {
          voiceEngine.speak(getTranslation(currentLanguage, 'noSchemesYet'), currentLanguage);
        }
        return;
      }
      if (cmd.type === 'READ_ALOUD') {
        const schemesToRead = (matchedSchemes.length > 0 ? matchedSchemes.map(m => m.scheme) : allSchemes).slice(0, 3);
        const titles = schemesToRead.map(s => {
          return currentLanguage.startsWith('hi') ? (s.title_hi || s.title_en) :
                 currentLanguage.startsWith('te') ? (s.title_te || s.title_en) :
                 currentLanguage.startsWith('ta') ? (s.title_ta || s.title_en) :
                 currentLanguage.startsWith('kn') ? (s.title_kn || s.title_en) : s.title_en;
        }).join('. ');
        if (voiceEngine?.speak) {
          voiceEngine.speak(titles, currentLanguage);
        }
        return;
      }
    }

    setSearching(true);
    setAudioResponse('');

    try {
      const res = await schemesApi.match(q, currentLanguage);
      const data = res.data;
      
      setMatchedSchemes(data.matched_schemes || []);
      setAudioResponse(data.conversational_audio_response || '');

      // Play conversational audio response aloud
      if (voiceEngine?.speak && data.conversational_audio_response) {
        voiceEngine.speak(data.conversational_audio_response, currentLanguage);
      }
    } catch (err) {
      console.error('Scheme match error:', err);
      showToast('Could not complete scheme matching. Showing all schemes.');
    } finally {
      setSearching(false);
    }
  };

  /**
   * Handle Voice Microphone Tap
   */
  const handleMicToggle = () => {
    if (!voiceEngine) return;

    if (voiceEngine.isListening) {
      voiceEngine.stopListening();
    } else {
      voiceEngine.startListening({
        langOverride: currentLanguage,
        onResult: (spokenText) => {
          setQueryText(spokenText);
          // Check secret trigger on the fly
          if (isSaathiPetiTrigger(spokenText)) {
            voiceEngine.stopListening();
            setShowPetiModal(true);
          }
        },
        onSilence: (finalText) => {
          if (finalText && !isSaathiPetiTrigger(finalText)) {
            handleSchemeSearch(finalText);
          }
        }
      });
    }
  };

  /**
   * Save a scheme to Saathi Peti
   */
  const handleSaveToPeti = async (schemeId, e) => {
    e.stopPropagation();

    if (isGuestMode) {
      showToast('Guest Mode Active: Personal schemes are not saved to the vault.');
      if (voiceEngine?.speak) {
        voiceEngine.speak('Guest mode active. Searches are not saved to protect your privacy.', currentLanguage);
      }
      return;
    }

    try {
      await petiApi.saveScheme(schemeId);
      setSavedSchemeIds(prev => new Set(prev).add(schemeId));
      showToast('Scheme securely saved to your Saathi Peti for 30 days.');
      if (voiceEngine?.speak) {
        voiceEngine.speak('Saved to your Saathi Peti.', currentLanguage);
      }
    } catch (err) {
      console.error('Save to Peti error:', err);
      if (err.response?.status === 401) {
        navigate('/auth?mode=login');
      } else {
        showToast('Could not save scheme. Please try again.');
      }
    }
  };

  const displayedSchemes = matchedSchemes.length > 0 
    ? matchedSchemes.map(m => ({ ...m.scheme, match_reason: m.match_reason_simple, confidence: m.confidence }))
    : allSchemes;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-amber-500 text-black font-extrabold shadow-2xl border-2 border-white flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Interactive Voice Section */}
      <div className="text-center mb-8">
        
        <p className="text-xs md:text-sm font-black uppercase text-amber-400 tracking-wider mb-2">
          {getTranslation(currentLanguage, 'tapToSpeak')}
        </p>

        {/* Giant Pulsing Microphone Button */}
        <div className="flex justify-center my-4">
          <button
            type="button"
            data-voice-control="true"
            onClick={handleMicToggle}
            className={`w-32 h-32 md:w-36 md:h-36 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl border-4 active:scale-90 focus:outline-none focus:ring-8 focus:ring-amber-400 ${
              voiceEngine?.isListening
                ? 'bg-red-600 border-white text-white mic-active-pulse'
                : 'bg-gradient-to-tr from-amber-500 via-amber-400 to-orange-500 border-white text-black shadow-tactile hover:scale-105'
            }`}
            aria-label={voiceEngine?.isListening ? 'Stop listening' : 'Start speaking your situation'}
          >
            {voiceEngine?.isListening ? (
              <>
                <MicOff className="w-14 h-14 md:w-16 md:h-16 animate-pulse" />
                <span className="text-xs font-black mt-1">Listening...</span>
              </>
            ) : (
              <>
                <Mic className="w-14 h-14 md:w-16 md:h-16" />
                <span className="text-xs font-black mt-1">TAP & SPEAK</span>
              </>
            )}
          </button>
        </div>

        {/* Live Spoken Query Transcript */}
        <div className="max-w-xl mx-auto min-h-[50px] flex items-center justify-center">
          {voiceEngine?.isListening ? (
            <p className="text-lg md:text-xl font-black text-amber-300 animate-pulse bg-slate-900/80 px-4 py-2 rounded-2xl border border-amber-400/40">
              "{voiceEngine.transcript || getTranslation(currentLanguage, 'listeningHelp')}"
            </p>
          ) : queryText ? (
            <p className="text-base md:text-lg font-bold text-slate-200 bg-slate-900/60 px-4 py-2 rounded-2xl border border-slate-700">
              "{queryText}"
            </p>
          ) : (
            <p className="text-sm md:text-base text-slate-400 font-semibold">
              Say your age, occupation, or family need (e.g., "I am a 60-year-old farmer with 2 acres of land")
            </p>
          )}
        </div>

        {/* Spoken AI Response Banner */}
        {audioResponse && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-left max-w-2xl mx-auto flex items-start gap-3 shadow-lg">
            <Volume2 className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider block mb-1">
                GramSaathi Voice Assistant:
              </span>
              <p className="text-sm md:text-base text-white font-bold">
                {audioResponse}
              </p>
            </div>
            <button
              onClick={() => voiceEngine?.speak(audioResponse, currentLanguage)}
              data-voice-control="true"
              className="p-2 rounded-xl bg-amber-500 text-black hover:bg-amber-400 font-black shrink-0 focus:outline-none focus:ring-4 focus:ring-white"
              title="Repeat speech"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Text Input Alternative for Hearing/Speech Impaired Users */}
        <div className="mt-6 max-w-xl mx-auto flex items-center gap-2">
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSchemeSearch(queryText)}
            placeholder={getTranslation(currentLanguage, 'typeAlternative')}
            className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-900 border-2 border-slate-700 text-white placeholder-slate-500 text-base font-semibold focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/40"
            aria-label="Type your situation"
          />
          <button
            onClick={() => handleSchemeSearch(queryText)}
            disabled={searching}
            className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-base shadow-tactile flex items-center gap-2 border-2 border-white focus:outline-none focus:ring-4 focus:ring-amber-400 disabled:opacity-50"
            aria-label="Search schemes"
          >
            <Search className="w-5 h-5" />
            <span className="hidden sm:inline">{getTranslation(currentLanguage, 'findSchemes')}</span>
          </button>
        </div>

      </div>

      {/* Quick Navigation to Document Photo Check */}
      <div className="mb-8">
        <div 
          onClick={() => navigate('/document-check')}
          className="p-4 md:p-5 rounded-3xl bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border-2 border-blue-400/50 hover:border-blue-400 transition-all flex items-center justify-between cursor-pointer group shadow-lg"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/document-check')}
          aria-label="Go to Document Photo Verification"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400 flex items-center justify-center text-blue-300">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white group-hover:text-blue-300">
                {getTranslation(currentLanguage, 'documentCheck')}
              </h3>
              <p className="text-xs md:text-sm text-slate-300 font-medium">
                Take a quick photo of your Aadhaar or Ration Card to make sure it is not blurry before you apply.
              </p>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 text-blue-400 group-hover:translate-x-1 transition-transform shrink-0" />
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
            Explore Categories:
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => { setSelectedCategory(null); setMatchedSchemes([]); }}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-black whitespace-nowrap border-2 transition-all ${
              selectedCategory === null && matchedSchemes.length === 0
                ? 'bg-amber-500 text-black border-white'
                : 'bg-slate-900 text-white border-slate-700 hover:border-slate-500'
            }`}
          >
            🌟 All Schemes
          </button>
          {SCHEME_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setMatchedSchemes([]); }}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-black whitespace-nowrap border-2 transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-black border-white'
                  : 'bg-slate-900 text-white border-slate-700 hover:border-slate-500'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Schemes Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <span>{matchedSchemes.length > 0 ? '🎯' : '🏛️'}</span>
            <span>
              {matchedSchemes.length > 0
                ? getTranslation(currentLanguage, 'matchedSchemesTitle')
                : 'Available Government Schemes'}
            </span>
          </h2>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {displayedSchemes.length} Schemes
          </span>
        </div>

        {searching ? (
          <div className="p-12 text-center text-amber-400 font-black animate-pulse">
            <Sparkles className="w-10 h-10 mx-auto mb-3 animate-spin" />
            <p className="text-lg">{getTranslation(currentLanguage, 'searching')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedSchemes.map((scheme) => {
              const isSaved = savedSchemeIds.has(scheme.id);
              const title = currentLanguage.startsWith('hi') ? (scheme.title_hi || scheme.title_en) :
                            currentLanguage.startsWith('te') ? (scheme.title_te || scheme.title_en) :
                            currentLanguage.startsWith('ta') ? (scheme.title_ta || scheme.title_en) :
                            currentLanguage.startsWith('kn') ? (scheme.title_kn || scheme.title_en) : scheme.title_en;

              return (
                <div
                  key={scheme.id}
                  onClick={() => navigate(`/scheme/${scheme.id}`)}
                  className="p-5 md:p-6 rounded-3xl bg-slate-900 hover:bg-slate-850 border-3 border-slate-800 hover:border-amber-400/80 transition-all shadow-xl flex flex-col justify-between cursor-pointer group focus:outline-none focus:ring-4 focus:ring-amber-400"
                  tabIndex={0}
                  role="article"
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/scheme/${scheme.id}`)}
                  aria-label={`Scheme: ${title}`}
                >
                  <div>
                    {/* Category & Confidence Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        {scheme.category}
                      </span>
                      {scheme.confidence && (
                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                          scheme.confidence === 'HIGH'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-400'
                        }`}>
                          {scheme.confidence === 'HIGH'
                            ? getTranslation(currentLanguage, 'confidenceHigh')
                            : getTranslation(currentLanguage, 'confidenceMed')}
                        </span>
                      )}
                    </div>

                    {/* Scheme Title */}
                    <h3 className="text-xl md:text-2xl font-black text-white group-hover:text-amber-300 transition-colors leading-tight">
                      {title}
                    </h3>

                    {/* Simple Match Reason */}
                    {scheme.match_reason ? (
                      <p className="text-sm font-bold text-emerald-300 mt-2 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30">
                        💡 {scheme.match_reason}
                      </p>
                    ) : (
                      <p className="text-xs md:text-sm text-slate-300 font-medium mt-2 line-clamp-2">
                        {scheme.description}
                      </p>
                    )}

                    {/* Benefit Highlight */}
                    <div className="mt-3 text-xs md:text-sm font-bold text-amber-400">
                      💰 {scheme.benefits}
                    </div>
                  </div>

                  {/* Card Bottom Controls */}
                  <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                    
                    {/* Read Aloud Button */}
                    <button
                      type="button"
                      data-voice-control="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (voiceEngine?.speak) {
                          voiceEngine.speak(`${title}. ${scheme.benefits}`, currentLanguage);
                        }
                      }}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 focus:outline-none focus:ring-4 focus:ring-amber-400"
                      title={getTranslation(currentLanguage, 'readAloud')}
                      aria-label="Read scheme name aloud"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>

                    {/* Save to Saathi Peti Button */}
                    <button
                      type="button"
                      onClick={(e) => handleSaveToPeti(scheme.id, e)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-bold border transition-all focus:outline-none focus:ring-4 ${
                        isSaved
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                      aria-label="Save this scheme to hidden Saathi Peti"
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                      <span>
                        {isSaved
                          ? getTranslation(currentLanguage, 'savedToPeti')
                          : getTranslation(currentLanguage, 'saveToPeti')}
                      </span>
                    </button>

                    {/* View Details Link */}
                    <div className="flex items-center gap-1 text-amber-400 text-xs md:text-sm font-black group-hover:translate-x-1 transition-transform">
                      <span>View</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hidden Saathi Peti Voice Unlock Modal */}
      <SaathiPetiModal
        isOpen={showPetiModal}
        onClose={() => setShowPetiModal(false)}
        currentLanguage={currentLanguage}
        voiceEngine={voiceEngine}
      />

    </div>
  );
}
