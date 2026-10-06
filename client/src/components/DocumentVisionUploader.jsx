import React, { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle2, AlertTriangle, RefreshCw, Volume2, Sparkles, FileText } from 'lucide-react';
import { schemesApi } from '../utils/api';
import { getTranslation } from '../utils/translations';

export function DocumentVisionUploader({
  currentLanguage,
  voiceEngine
}) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file (JPEG, PNG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      setSelectedImage(base64);
      setResult(null);
      setErrorMsg('');
      analyzeDocument(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeDocument = async (base64) => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await schemesApi.documentCheck(base64, currentLanguage);
      const data = res.data.result;
      setResult(data);

      // Speak AI result via TTS
      if (voiceEngine?.speak && data?.feedback_message) {
        voiceEngine.speak(data.feedback_message, currentLanguage);
      }
    } catch (err) {
      console.error('Document check API error:', err);
      setErrorMsg('Could not verify photo. Please check your network or try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setSelectedImage(null);
    setResult(null);
    setErrorMsg('');
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  return (
    <div className="w-full bg-slate-900 border-3 border-amber-400/40 rounded-3xl p-6 md:p-8 shadow-2xl">
      
      {/* Title & Info */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Gemini 2.5 Flash Vision</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white">
          {getTranslation(currentLanguage, 'documentCheck')}
        </h2>
        <p className="text-sm md:text-base text-slate-300 mt-2 max-w-lg mx-auto font-medium">
          {getTranslation(currentLanguage, 'documentCheckDesc')}
        </p>
      </div>

      {/* Hidden Mobile Native Camera Input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        id="camera-doc-input"
        aria-label="Take document photo with camera"
      />

      {/* Hidden Gallery Input (No capture flag) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="gallery-doc-input"
        aria-label="Upload document photo from gallery"
      />

      {/* Upload Buttons when no image selected */}
      {!selectedImage && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto my-6">
          
          {/* Camera Capture Button */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black shadow-tactile border-2 border-amber-300 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-white"
            aria-label="Open Camera to capture document"
          >
            <div className="w-16 h-16 rounded-full bg-black/15 flex items-center justify-center">
              <Camera className="w-9 h-9" />
            </div>
            <span className="text-lg">
              {getTranslation(currentLanguage, 'takePhoto')}
            </span>
          </button>

          {/* Gallery / File Picker */}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black shadow-tactile border-2 border-slate-700 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-amber-400"
            aria-label="Upload existing photo from gallery"
          >
            <div className="w-16 h-16 rounded-full bg-slate-700/60 flex items-center justify-center text-amber-400">
              <Upload className="w-8 h-8" />
            </div>
            <span className="text-lg">
              {getTranslation(currentLanguage, 'uploadPhoto')}
            </span>
          </button>

        </div>
      )}

      {/* Image Preview & AI Analysis */}
      {selectedImage && (
        <div className="max-w-md mx-auto my-4 space-y-4">
          
          <div className="relative rounded-2xl overflow-hidden border-4 border-slate-700 bg-black max-h-72 flex items-center justify-center shadow-lg">
            <img
              src={selectedImage}
              alt="Uploaded document preview"
              className="max-h-72 w-auto object-contain"
            />
            {loading && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 text-amber-400 p-4 text-center">
                <RefreshCw className="w-10 h-10 animate-spin" />
                <p className="font-black text-base animate-pulse">
                  {getTranslation(currentLanguage, 'analyzingDoc')}
                </p>
              </div>
            )}
          </div>

          {/* Verification Results Card */}
          {result && (
            <div className={`p-5 rounded-3xl border-3 shadow-xl transition-all ${
              result.is_valid_official_document && !result.is_blurry
                ? 'bg-emerald-950/70 border-emerald-400 text-emerald-200'
                : result.is_blurry
                ? 'bg-amber-950/70 border-amber-400 text-amber-200'
                : 'bg-red-950/70 border-red-500 text-red-200'
            }`}>
              
              <div className="flex items-center gap-3 mb-4">
                {result.is_valid_official_document && !result.is_blurry ? (
                  <CheckCircle2 className="w-9 h-9 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-9 h-9 text-amber-400 shrink-0" />
                )}
                <div>
                  <h3 className="text-xl font-black">
                    {result.is_valid_official_document && !result.is_blurry
                      ? getTranslation(currentLanguage, 'docClear')
                      : getTranslation(currentLanguage, 'docBlurry')}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-black/40 border border-white/20">
                      {result.detected_document_type}
                    </span>
                    <span className={`text-2xs px-2.5 py-0.5 rounded-full font-black uppercase ${
                      result.authenticity_status === 'AUTHENTIC_GOVERNMENT_RECORD'
                        ? 'bg-emerald-500 text-black'
                        : result.authenticity_status === 'UNCLEAR_OR_SUSPICIOUS'
                        ? 'bg-amber-400 text-black'
                        : 'bg-red-500 text-white'
                    }`}>
                      {result.authenticity_status || 'VERIFIED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Extracted Metadata Fields Grid (Anti-Blind-Approval Extraction) */}
              {result.extracted_fields && (result.extracted_fields.holder_name || result.extracted_fields.document_number_masked) && (
                <div className="mb-4 p-3.5 bg-black/50 rounded-2xl border border-white/15 space-y-2 text-xs">
                  <div className="font-black text-amber-300 uppercase tracking-wider text-2xs mb-1">
                    📋 Extracted Document Metadata
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-white">
                    {result.extracted_fields.holder_name && (
                      <div>
                        <span className="text-slate-400 block text-2xs">Name:</span>
                        <span className="font-bold">{result.extracted_fields.holder_name}</span>
                      </div>
                    )}
                    {result.extracted_fields.document_number_masked && (
                      <div>
                        <span className="text-slate-400 block text-2xs">Doc Number:</span>
                        <span className="font-mono font-bold text-amber-300">{result.extracted_fields.document_number_masked}</span>
                      </div>
                    )}
                    {result.extracted_fields.issue_or_validity && (
                      <div>
                        <span className="text-slate-400 block text-2xs">Validity:</span>
                        <span className="font-bold">{result.extracted_fields.issue_or_validity}</span>
                      </div>
                    )}
                    {result.extracted_fields.category_or_details && (
                      <div>
                        <span className="text-slate-400 block text-2xs">Details / Area:</span>
                        <span className="font-bold">{result.extracted_fields.category_or_details}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Spoken Feedback Message */}
              <div className="p-3.5 bg-black/40 rounded-2xl mb-4 border border-white/10 flex items-start gap-2">
                <Volume2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm md:text-base font-bold text-white leading-relaxed">
                  "{result.feedback_message}"
                </p>
              </div>

              {/* Retake Button */}
              <button
                onClick={handleRetake}
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-base flex items-center justify-center gap-2 shadow-tactile border-2 border-white focus:outline-none focus:ring-4 focus:ring-amber-400"
              >
                <Camera className="w-5 h-5" />
                <span>Take Another Photo</span>
              </button>

            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-950/80 border-2 border-red-500 text-red-200 rounded-2xl text-center text-sm font-bold">
              {errorMsg}
            </div>
          )}

        </div>
      )}

      {/* Privacy Notice */}
      <div className="text-center text-xs text-slate-400 mt-6 pt-4 border-t border-slate-800">
        🔒 <strong>Zero Storage Privacy:</strong> Your photo is analyzed in real-time by Gemini AI and immediately wiped from memory. It is never saved to any database or server disk.
      </div>

    </div>
  );
}
