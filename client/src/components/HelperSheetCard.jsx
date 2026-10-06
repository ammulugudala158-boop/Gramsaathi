import React, { useState } from 'react';
import { Printer, Share2, CheckSquare, Square, Volume2, ShieldCheck, ExternalLink, MapPin } from 'lucide-react';
import { getTranslation } from '../utils/translations';

export function HelperSheetCard({
  scheme,
  currentLanguage,
  voiceEngine
}) {
  const [checkedDocs, setCheckedDocs] = useState({});

  if (!scheme) return null;

  const title = currentLanguage.startsWith('hi') ? (scheme.title_hi || scheme.title_en) :
                currentLanguage.startsWith('te') ? (scheme.title_te || scheme.title_en) :
                currentLanguage.startsWith('ta') ? (scheme.title_ta || scheme.title_en) :
                currentLanguage.startsWith('kn') ? (scheme.title_kn || scheme.title_en) : scheme.title_en;

  const toggleCheck = (doc) => {
    setCheckedDocs(prev => ({
      ...prev,
      [doc]: !prev[doc]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate WhatsApp Share Message
  const generateWhatsAppShare = () => {
    const docsList = (scheme.required_documents || []).map((d, i) => `${i + 1}. ${d}`).join('\n');
    const stepsList = (scheme.application_steps || []).map((s, i) => `Step ${i + 1}: ${s}`).join('\n');

    const message = `*GramSaathi - Application Helper Sheet*\n` +
      `*Scheme:* ${title}\n` +
      `*Benefits:* ${scheme.benefits}\n\n` +
      `*Required Documents:*\n${docsList}\n\n` +
      `*How to Apply:*\n${stepsList}\n\n` +
      `Official Portal: ${scheme.official_portal_url || 'https://india.gov.in'}\n\n` +
      `Generated with GramSaathi - Voice AI for Rural Citizens.`;

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleReadAloud = () => {
    if (!voiceEngine?.speak) return;
    const docs = (scheme.required_documents || []).join(', ');
    const textToRead = `${title}. Benefits: ${scheme.benefits}. Required documents: ${docs}. Steps: ${(scheme.application_steps || []).join('. ')}`;
    voiceEngine.speak(textToRead, currentLanguage);
  };

  return (
    <div className="w-full bg-slate-900 border-3 border-amber-400/50 rounded-3xl p-6 md:p-8 shadow-2xl print:border-none print:shadow-none print:bg-white print:text-black">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b-2 border-slate-800 print:border-black">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2 print:text-black">
            <ShieldCheck className="w-4 h-4" />
            <span>{getTranslation(currentLanguage, 'helperSheetTitle')}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white print:text-black">
            {title}
          </h2>
          <p className="text-sm text-slate-300 mt-1 font-medium print:text-gray-700">
            {getTranslation(currentLanguage, 'helperSheetDesc')}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <button
            onClick={handleReadAloud}
            data-voice-control="true"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border-2 border-amber-500/40 font-bold text-sm shadow-md transition-all focus:outline-none focus:ring-4 focus:ring-amber-400"
            aria-label="Read Helper Sheet Aloud"
          >
            <Volume2 className="w-5 h-5 text-amber-400" />
            <span>{getTranslation(currentLanguage, 'readAloud')}</span>
          </button>

          <button
            onClick={generateWhatsAppShare}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all focus:outline-none focus:ring-4 focus:ring-emerald-400"
            aria-label="Share checklist on WhatsApp"
          >
            <Share2 className="w-5 h-5" />
            <span>{getTranslation(currentLanguage, 'shareWhatsApp')}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm shadow-md transition-all focus:outline-none focus:ring-4 focus:ring-white"
            aria-label="Print this Helper Sheet"
          >
            <Printer className="w-5 h-5" />
            <span>{getTranslation(currentLanguage, 'printSheet')}</span>
          </button>
        </div>
      </div>

      {/* Scheme Key Benefits */}
      <div className="my-6 p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 print:bg-gray-100 print:border-black">
        <h3 className="text-sm font-black uppercase text-amber-400 tracking-wider mb-1 print:text-black">
          Direct Citizen Benefits
        </h3>
        <p className="text-lg md:text-xl font-extrabold text-white print:text-black">
          {scheme.benefits}
        </p>
      </div>

      {/* Interactive Required Documents Checklist */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-black text-amber-400 print:text-black flex items-center gap-2">
            <span>📋</span>
            <span>{getTranslation(currentLanguage, 'requiredDocs')}</span>
          </h3>
          <span className="text-xs text-slate-400 font-bold print:hidden">
            (Tap to check off)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(scheme.required_documents || []).map((doc, index) => {
            const isChecked = Boolean(checkedDocs[doc]);
            return (
              <button
                key={index}
                type="button"
                onClick={() => toggleCheck(doc)}
                className={`flex items-start gap-3 p-4 rounded-2xl text-left border-2 transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-amber-400 ${
                  isChecked
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 print:bg-gray-100 print:text-black'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-white print:bg-white print:text-black'
                }`}
              >
                <div className="mt-0.5 shrink-0 text-amber-400 print:text-black">
                  {isChecked ? (
                    <CheckSquare className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <Square className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <span className={`text-base font-bold block ${isChecked ? 'line-through opacity-80' : ''}`}>
                    {doc}
                  </span>
                  <span className="text-xs text-slate-400 font-normal block mt-0.5 print:hidden">
                    {isChecked ? 'Ready in your file' : 'Need to carry original & photocopy'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step-by-Step Application Roadmap */}
      <div>
        <h3 className="text-lg font-black text-amber-400 print:text-black mb-4 flex items-center gap-2">
          <span>🚀</span>
          <span>{getTranslation(currentLanguage, 'applicationSteps')}</span>
        </h3>

        <div className="space-y-3">
          {(scheme.application_steps || []).map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-4 rounded-2xl bg-slate-800/50 border border-slate-700 print:bg-white print:border-black"
            >
              <div className="w-8 h-8 rounded-full bg-amber-500 text-black font-black flex items-center justify-center shrink-0 text-sm print:border print:border-black">
                {idx + 1}
              </div>
              <p className="text-sm md:text-base font-semibold text-slate-200 print:text-black pt-1">
                {step}
              </p>
            </div>
          ))}
        </div>

        {scheme.official_portal_url && (
          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Official Government Portal:</span>
            <a
              href={scheme.official_portal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 underline flex items-center gap-1 font-bold"
            >
              <span>{scheme.official_portal_url}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

    </div>
  );
}
