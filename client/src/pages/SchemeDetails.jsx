import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, Camera, Bookmark, Sparkles, CheckCircle2 } from 'lucide-react';
import { schemesApi, petiApi } from '../utils/api';
import { getTranslation } from '../utils/translations';
import { HelperSheetCard } from '../components/HelperSheetCard';

export function SchemeDetails({
  currentLanguage,
  voiceEngine
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const isGuest = sessionStorage.getItem('gramsaathi_guest_mode') === 'true';

  useEffect(() => {
    loadSchemeDetails();
  }, [id]);

  const loadSchemeDetails = async () => {
    try {
      setLoading(true);
      const res = await schemesApi.getById(id);
      setScheme(res.data.scheme);
    } catch (err) {
      console.error('Error fetching scheme details:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleSaveToPeti = async () => {
    if (isGuest) {
      showToast('Guest Mode Active: Personal schemes are not saved to the vault.');
      return;
    }

    try {
      await petiApi.saveScheme(id);
      setSaved(true);
      showToast('Saved to your Saathi Peti for 30 days.');
      if (voiceEngine?.speak) {
        voiceEngine.speak('Saved into your Saathi Peti.', currentLanguage);
      }
    } catch (err) {
      showToast('Could not save to Saathi Peti.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-amber-400 font-black animate-pulse">
        <Sparkles className="w-12 h-12 mx-auto mb-4 animate-spin" />
        <p className="text-xl">Loading scheme checklist...</p>
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-white">
        <h2 className="text-2xl font-bold mb-4">Scheme Not Found</h2>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 rounded-2xl bg-amber-500 text-black font-black"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-amber-500 text-black font-extrabold shadow-2xl border-2 border-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-300 hover:text-amber-400 font-bold mb-6 focus:outline-none focus:ring-4 focus:ring-amber-400 rounded-lg p-1 print:hidden"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Schemes</span>
      </button>

      {/* Main Helper Sheet Component */}
      <HelperSheetCard
        scheme={scheme}
        currentLanguage={currentLanguage}
        voiceEngine={voiceEngine}
      />

      {/* Action Footer for Document Verification & Peti Saving */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
        
        {/* Verify Photos with Camera */}
        <button
          onClick={() => navigate('/document-check')}
          className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base md:text-lg flex items-center justify-center gap-3 shadow-tactile border-2 border-white focus:outline-none focus:ring-4 focus:ring-blue-400"
        >
          <Camera className="w-6 h-6" />
          <span>Check Document Photo Quality</span>
        </button>

        {/* Save to Peti */}
        <button
          onClick={handleSaveToPeti}
          className={`p-5 rounded-2xl font-black text-base md:text-lg flex items-center justify-center gap-3 shadow-tactile border-2 transition-all focus:outline-none focus:ring-4 ${
            saved
              ? 'bg-emerald-500 text-black border-white'
              : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-400'
          }`}
        >
          <Bookmark className={`w-6 h-6 ${saved ? 'fill-black' : ''}`} />
          <span>{saved ? 'Saved in Saathi Peti' : 'Save Scheme to Saathi Peti'}</span>
        </button>

      </div>

    </div>
  );
}
