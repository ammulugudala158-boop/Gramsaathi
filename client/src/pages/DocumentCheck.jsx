import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';
import { DocumentVisionUploader } from '../components/DocumentVisionUploader';

export function DocumentCheck({
  currentLanguage,
  voiceEngine
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (voiceEngine?.speak) {
      const guidance = currentLanguage.startsWith('hi')
        ? 'दस्तावेज़ की फोटो लें। सुनिश्चित करें कि चारों कोने दिख रहे हों और लिखावट साफ हो।'
        : currentLanguage.startsWith('te')
        ? 'మీ పత్రం ఫోటో తీయండి. నాలుగు మూలలు కనిపించేలా, అక్షరాలు స్పష్టంగా ఉండేలా చూడండి.'
        : 'Take a photo of your document. Ensure good light and all four corners are visible.';
      voiceEngine.speak(guidance, currentLanguage);
    }
  }, [currentLanguage]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-300 hover:text-amber-400 font-bold mb-6 focus:outline-none focus:ring-4 focus:ring-amber-400 rounded-lg p-1"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Assistant</span>
      </button>

      {/* Main Vision Uploader */}
      <DocumentVisionUploader
        currentLanguage={currentLanguage}
        voiceEngine={voiceEngine}
      />

    </div>
  );
}
