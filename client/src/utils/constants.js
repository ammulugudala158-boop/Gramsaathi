// Supported Languages and Regional Locales
export const LANGUAGES = [
  { code: 'hi-IN', label: 'हिन्दी', nameEn: 'Hindi', flag: '🇮🇳', greeting: 'नमस्ते, ग्रामसाथी में आपका स्वागत है।' },
  { code: 'te-IN', label: 'తెలుగు', nameEn: 'Telugu', flag: '🇮🇳', greeting: 'నమస్కారం, గ్రామసాథికి స్వాగతం.' },
  { code: 'ta-IN', label: 'தமிழ்', nameEn: 'Tamil', flag: '🇮🇳', greeting: 'வணக்கம், கிராமசாதிக்கு வரவேற்கிறோம்.' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ', nameEn: 'Kannada', flag: '🇮🇳', greeting: 'ನಮಸ್ಕಾರ, ಗ್ರಾಮಸಾಥಿಗೆ ಸ್ವಾಗತ.' },
  { code: 'en-IN', label: 'English', nameEn: 'English (India)', flag: '🇮🇳', greeting: 'Welcome to GramSaathi. I am your scheme assistant.' }
];

// Spoken Word to Number mapping for 4-Digit Voice PIN entry in 5 languages
export const SPOKEN_DIGIT_MAP = {
  // English
  'zero': '0', 'oh': '0', 'one': '1', 'won': '1', 'two': '2', 'to': '2', 'too': '2',
  'three': '3', 'tree': '3', 'four': '4', 'for': '4', 'fore': '4', 'five': '5',
  'six': '6', 'seven': '7', 'eight': '8', 'ate': '8', 'nine': '9',

  // Hindi
  'शून्य': '0', 'सिफर': '0', 'एक': '1', 'दो': '2', 'तीन': '3', 'चार': '4',
  'पांच': '5', 'पाँच': '5', 'छह': '6', 'छः': '6', 'सात': '7', 'आठ': '8', 'नौ': '9',

  // Telugu
  'సున్న': '0', 'సున్నా': '0', 'ఒకటి': '1', 'ఒక': '1', 'రెండు': '2', 'మూడు': '3',
  'నాలుగు': '4', 'ఐదు': '5', 'ఆరు': '6', 'ఏడు': '7', 'ఎనిమిది': '8', 'తొమ్మిది': '9',

  // Tamil
  'பூஜ்ஜியம்': '0', 'பூஜ்யம்': '0', 'ஒன்று': '1', 'ஒன்னு': '1', 'இரண்டு': '2',
  'ரெண்டு': '2', 'மூன்று': '3', 'மூணு': '3', 'நான்கு': '4', 'நாலு': '4',
  'ஐந்து': '5', 'அஞ்சு': '5', 'ஆறு': '6', 'ஏழு': '7', 'எட்டு': '8', 'ஒன்பது': '9',

  // Kannada
  'ಸೊನ್ನೆ': '0', 'ಒಂದು': '1', 'ಎರಡು': '2', 'ಮೂರು': '3', 'ನಾಲ್ಕು': '4',
  'ಐದು': '5', 'ಆರು': '6', 'ಏಳು': '7', 'ಎಂಟು': '8', 'ಒಂಬತ್ತು': '9'
};

/**
 * Converts a spoken transcript like "one two three four" or "एक दो तीन चार" into numeric PIN string "1234"
 */
export function parseSpokenPin(transcript) {
  if (!transcript) return '';
  
  // First, extract any direct numeric characters (0-9)
  const directDigits = transcript.replace(/\D/g, '');
  if (directDigits.length >= 4) {
    return directDigits.slice(0, 4);
  }

  // Tokenize words and map against multilingual dictionary
  const words = transcript.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .split(/\s+/);

  let digits = '';
  for (const word of words) {
    if (/^\d$/.test(word)) {
      digits += word;
    } else if (SPOKEN_DIGIT_MAP[word]) {
      digits += SPOKEN_DIGIT_MAP[word];
    }
    if (digits.length === 4) break;
  }

  // If we found some direct digits and words combined
  if (digits.length < 4 && directDigits.length > 0) {
    return directDigits.slice(0, 4);
  }

  return digits.slice(0, 4);
}

// Saathi Peti Secret Voice Trigger Phrases across 5 languages
export const SAATHI_PETI_TRIGGERS = [
  'open saathi peti',
  'open sathi peti',
  'open peti',
  'saathi peti',
  'sathi peti',
  'saathi peti kholo',
  'sathi peti kholo',
  'पेटी खोलो',
  'साथी पेटी',
  'साथी पेटी खोलो',
  'సాథీ పేటి తెరవండి',
  'సాథీ పేటి',
  'పేటి తెరవండి',
  'சாதி பெட்டி திற',
  'சாதி பெட்டி',
  'பெட்டியை திற',
  'ಸಾಥಿ ಪೇಟಿ ತೆರೆಯಿರಿ',
  'ಸಾಥಿ ಪೇಟಿ',
  'ಪೇಟಿ ತೆರೆಯಿರಿ'
];

/**
 * Checks if a user's spoken phrase matches the Saathi Peti secret command
 */
export function isSaathiPetiTrigger(text) {
  if (!text) return false;
  const clean = text.toLowerCase().trim();
  return SAATHI_PETI_TRIGGERS.some(trigger => clean.includes(trigger.toLowerCase()));
}

// Scheme Category Metadata with Icons & Colors
export const SCHEME_CATEGORIES = [
  { id: 'Farm Support', icon: '🌾', label: 'Farm Support', color: 'from-emerald-600 to-green-700' },
  { id: 'Scholarships', icon: '🎓', label: 'Scholarships', color: 'from-blue-600 to-indigo-700' },
  { id: 'Pensions', icon: '👵', label: 'Pensions', color: 'from-amber-600 to-orange-700' },
  { id: 'Disability Allowances', icon: '♿', label: 'Disability', color: 'from-purple-600 to-violet-700' },
  { id: 'Education & Health', icon: '🏥', label: 'Health & Family', color: 'from-rose-600 to-red-700' }
];

/**
 * Checks for global voice navigation & assistance commands
 */
export function parseGlobalVoiceCommand(text) {
  if (!text) return null;
  const t = text.toLowerCase().trim();

  if (t.includes('document') || t.includes('camera') || t.includes('photo check') || t.includes('दस्तावेज़') || t.includes('డాక్యుమెంట్') || t.includes('ஆவணம்') || t.includes('ದಾಖಲೆ')) {
    return { type: 'NAVIGATE_DOC_CHECK' };
  }

  if (t.includes('help') || t.includes('मदद') || t.includes('సహాయం') || t.includes('உதவி') || t.includes('ಸಹಾಯ')) {
    return { type: 'HELP' };
  }

  if (t.includes('read aloud') || t.includes('read screen') || t.includes('पढ़ो') || t.includes('सुनाओ') || t.includes('చదువు') || t.includes('వినిపించు')) {
    return { type: 'READ_ALOUD' };
  }

  return null;
}

