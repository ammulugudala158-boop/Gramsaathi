# 🌾 GramSaathi (ग्रामसाथी)
### Voice-First, Multilingual AI Assistant for Government Schemes

**GramSaathi** is an end-to-end, production-ready full-stack web application designed to help marginalized citizens—including the elderly, blind, low-vision, hearing/speech-impaired, and low-literacy users—discover and prepare for government schemes without complex paperwork, reading small text, or typing.

---

## 🌟 Key Features

1. **Multilingual Voice & Text Interface (Web Speech API):**
   - Full STT (Speech-to-Text) and TTS (Text-to-Speech) in 5 regional languages:
     - 🇮🇳 **हिन्दी (Hindi - `hi-IN`)**
     - 🇮🇳 **తెలుగు (Telugu - `te-IN`)**
     - 🇮🇳 **தமிழ் (Tamil - `ta-IN`)**
     - 🇮🇳 **ಕನ್ನಡ (Kannada - `kn-IN`)**
     - 🇮🇳 **English (India - `en-IN`)**
   - Screen-tap auto-pauses TTS; silence auto-stops STT.

2. **Gemini 2.5 Flash AI Scheme Matching (`@google/genai` SDK):**
   - Matches unstructured, spoken rural citizen situations (e.g. *"I am a 60-year-old farmer with 2 acres of land"*) against government schemes.
   - Responds strictly adhering to Zod schemas with simple eligibility reasoning and conversational audio feedback.

3. **Voice-PIN Authentication (No Emails, OTPs, or Captchas):**
   - 4-Digit numeric PIN.
   - Spoken PIN parsing: converts numbers spoken in Hindi, Telugu, Tamil, Kannada, and English into digits.
   - Bcrypt hashing (10 salt rounds) + Custom JWT.
   - 3 wrong attempts triggers a 5-minute lockout with live countdown.

4. **Document Photo Check (Gemini Vision):**
   - Mobile-friendly camera capture (`capture="environment"`).
   - Real-time AI detection of blurriness, readability, and document type (Aadhaar, Ration Card, Land Record, Passbook).
   - **Zero Storage Privacy:** Base64 images are immediately dropped from memory after Gemini resolves; never written to database or disk.

5. **Apply Helper Sheet:**
   - Interactive document checklist that users can check off.
   - One-tap WhatsApp sharing (`whatsapp://send?text=...`).
   - One-tap printing (`window.print()`).
   - Full audio readback of requirements.

6. **"Saathi Peti" (Hidden Private Vault):**
   - **NO on-screen button.**
   - Opens exclusively when the user says *"Open Saathi Peti"* (or regional translations) + enters their 4-digit PIN.
   - Protected by dual-token architecture (Standard JWT + 5-minute `x-unlock-token`).
   - Auto-deletes history after 30 days for maximum privacy.

7. **Guest Mode:**
   - Dedicated mode for shared phones and ASHA workers.
   - Leaves NO tokens or search history in `localStorage`.

8. **Extreme Accessibility (WCAG AAA+):**
   - One-tap Extreme Contrast Mode (pure black `#000000` with fluorescent yellow `#FFEE00` and high-contrast borders).
   - Giant tactile touch targets (>= 64px) for elderly citizens with tremors.
   - Screen reader and keyboard navigation friendly.

---

## 🏛️ Target Scheme Domains Covered

- **Farm Support:** PM-KISAN, Subsidized Micro-Irrigation & Drip Support
- **Pensions:** Indira Gandhi National Old Age Pension (IGNOAPS), Widow & Destitute Pension
- **Disability Allowances:** Divyangjan Swavalamban & ADIP Assistive Equipment Grant
- **Scholarships:** Post-Matric Scholarship for SC/ST/OBC and Minorities
- **Education & Health:** Ayushman Bharat (PM-JAY Free ₹5 Lakh Hospitalization), Pradhan Mantri Matru Vandana Yojana (PMMVY)

---

## 🚀 Getting Started

### 1. Database Setup (Supabase PostgreSQL)
1. Log into your Supabase Dashboard.
2. Open the **SQL Editor**.
3. Copy and run the contents of [`supabase/init.sql`](./supabase/init.sql).

### 2. Backend Setup
```bash
cd server
npm install
```

Configure your `server/.env`:
```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_google_genai_key
FRONTEND_URL=http://localhost:5173
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🔐 Saathi Peti Secret Trigger Demonstration
1. Open the app and create a PIN (or login).
2. On the Dashboard, tap the microphone and say:
   - *"Open Saathi Peti"* (English)
   - *"साथी पेटी खोलो"* (Hindi)
   - *"సాథీ పేటి తెరవండి"* (Telugu)
   - *"சாதி பெட்டி திற"* (Tamil)
   - *"ಸಾಥಿ ಪೇಟಿ ತೆರೆಯಿರಿ"* (Kannada)
3. The app will immediately intercept the search and display the secure PIN unlock modal.
4. Speak or tap your 4-digit PIN to access your 30-day private saved vault.
