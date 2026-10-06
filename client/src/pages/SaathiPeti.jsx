import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Unlock, Clock, Trash2, ArrowLeft, Volume2, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import { petiApi } from '../utils/api';
import { getTranslation } from '../utils/translations';
import { SaathiPetiModal } from '../components/SaathiPetiModal';

export function SaathiPeti({
  currentLanguage,
  voiceEngine
}) {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    checkAndLoadHistory();
  }, []);

  const checkAndLoadHistory = async () => {
    const unlockToken = sessionStorage.getItem('gramsaathi_unlock_token');
    if (!unlockToken) {
      setLocked(true);
      setShowUnlockModal(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await petiApi.getHistory(unlockToken);
      setHistory(res.data.history || []);
      setNotice(res.data.auto_delete_notice || '');
      setLocked(false);

      if (voiceEngine?.speak) {
        const count = res.data.history?.length || 0;
        const msg = currentLanguage.startsWith('hi')
          ? `आपकी साथी पेटी में ${count} योजनाएं सुरक्षित हैं।`
          : currentLanguage.startsWith('te')
          ? `మీ సాథీ పేటిలో ${count} పథకాలు భద్రపరచబడ్డాయి.`
          : `You have ${count} saved schemes in your Saathi Peti.`;
        voiceEngine.speak(msg, currentLanguage);
      }
    } catch (err) {
      console.error('Peti access error:', err);
      sessionStorage.removeItem('gramsaathi_unlock_token');
      setLocked(true);
      setShowUnlockModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (petiId, e) => {
    e.stopPropagation();
    try {
      await petiApi.remove(petiId);
      setHistory(prev => prev.filter(item => item.peti_id !== petiId));
      if (voiceEngine?.speak) {
        voiceEngine.speak('Scheme removed from vault.', currentLanguage);
      }
    } catch (err) {
      console.error('Delete peti error:', err);
    }
  };

  if (locked) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-3 border-amber-400 flex items-center justify-center text-amber-400 mx-auto mb-6 shadow-2xl">
          <Lock className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-amber-400 mb-2">
          {getTranslation(currentLanguage, 'unlockVaultTitle')}
        </h2>
        <p className="text-slate-300 font-medium mb-6">
          Saathi Peti is locked for your security. Please enter your 4-digit PIN to open your vault.
        </p>
        <button
          onClick={() => setShowUnlockModal(true)}
          className="w-full py-4 rounded-2xl bg-amber-500 text-black font-black text-lg shadow-tactile border-2 border-white"
        >
          Enter PIN to Unlock
        </button>

        <SaathiPetiModal
          isOpen={showUnlockModal}
          onClose={() => {
            setShowUnlockModal(false);
            if (!sessionStorage.getItem('gramsaathi_unlock_token')) {
              navigate('/dashboard');
            } else {
              checkAndLoadHistory();
            }
          }}
          currentLanguage={currentLanguage}
          voiceEngine={voiceEngine}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-slate-300 hover:text-amber-400 font-bold mb-6 focus:outline-none focus:ring-4 focus:ring-amber-400 rounded-lg p-1"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Assistant</span>
      </button>

      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-amber-950/60 to-slate-900 border-3 border-amber-400 shadow-2xl mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center text-black font-black text-3xl shadow-lg border-2 border-white">
            <Unlock className="w-9 h-9" />
          </div>
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
              Private Citizen Vault
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white">
              {getTranslation(currentLanguage, 'secretVoiceCommandPrompt')}
            </h1>
          </div>
        </div>

        <div className="mt-4 p-3 bg-amber-500/10 rounded-2xl border border-amber-400/30 flex items-center gap-2 text-xs md:text-sm text-amber-200 font-bold">
          <Clock className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{notice || getTranslation(currentLanguage, 'autoDeleteNotice')}</span>
        </div>
      </div>

      {/* Vault Items List */}
      {loading ? (
        <div className="p-12 text-center text-amber-400 font-black animate-pulse">
          <Sparkles className="w-10 h-10 mx-auto mb-3 animate-spin" />
          <p className="text-lg">Opening your private vault...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900 border-2 border-slate-800 text-center text-slate-400">
          <p className="text-lg font-bold">
            {getTranslation(currentLanguage, 'petiEmpty')}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 px-6 py-3 rounded-2xl bg-amber-500 text-black font-black shadow-tactile"
          >
            Explore Schemes Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => {
            const scheme = item.scheme;
            if (!scheme) return null;

            const title = currentLanguage.startsWith('hi') ? (scheme.title_hi || scheme.title_en) :
                          currentLanguage.startsWith('te') ? (scheme.title_te || scheme.title_en) :
                          currentLanguage.startsWith('ta') ? (scheme.title_ta || scheme.title_en) :
                          currentLanguage.startsWith('kn') ? (scheme.title_kn || scheme.title_en) : scheme.title_en;

            return (
              <div
                key={item.peti_id}
                onClick={() => navigate(`/scheme/${scheme.id}`)}
                className="p-5 md:p-6 rounded-3xl bg-slate-900 hover:bg-slate-850 border-3 border-slate-800 hover:border-amber-400 transition-all shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group focus:outline-none focus:ring-4 focus:ring-amber-400"
                tabIndex={0}
                role="article"
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/scheme/${scheme.id}`)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-400/40">
                      {scheme.category}
                    </span>
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{getTranslation(currentLanguage, 'daysRemaining')(item.days_remaining)}</span>
                    </span>
                  </div>

                  <h3 className="text-xl md:text-2xl font-black text-white group-hover:text-amber-300 transition-colors">
                    {title}
                  </h3>
                  <p className="text-sm font-bold text-amber-400 mt-1">
                    💰 {scheme.benefits}
                  </p>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    data-voice-control="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (voiceEngine?.speak) {
                        voiceEngine.speak(`${title}. Benefits: ${scheme.benefits}`, currentLanguage);
                      }
                    }}
                    className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 focus:outline-none focus:ring-4 focus:ring-amber-400"
                    title="Read Aloud"
                    aria-label="Read scheme aloud"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleRemoveItem(item.peti_id, e)}
                    className="p-3 rounded-2xl bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/40 focus:outline-none focus:ring-4 focus:ring-red-400 transition-colors"
                    title="Delete from Saathi Peti"
                    aria-label="Remove item from vault"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hidden Unlock Modal if needed */}
      <SaathiPetiModal
        isOpen={showUnlockModal}
        onClose={() => {
          setShowUnlockModal(false);
          checkAndLoadHistory();
        }}
        currentLanguage={currentLanguage}
        voiceEngine={voiceEngine}
      />

    </div>
  );
}
