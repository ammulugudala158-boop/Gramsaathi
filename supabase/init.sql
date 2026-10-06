-- ====================================================================
-- GramSaathi Production PostgreSQL Schema
-- Designed for Supabase PostgreSQL (Database ONLY. NO Supabase Auth)
-- ====================================================================

-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table (Voice-PIN Auth with Bcrypt Hash)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pin_hash VARCHAR(255) NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'en-IN',
    failed_attempts INT DEFAULT 0,
    lockout_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index on users for lookup
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 2. Schemes Table (Government Schemes Repository)
CREATE TABLE IF NOT EXISTS schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_en VARCHAR(255) NOT NULL,
    title_hi VARCHAR(255),
    title_te VARCHAR(255),
    title_ta VARCHAR(255),
    title_kn VARCHAR(255),
    category VARCHAR(50) NOT NULL, -- 'Farm Support', 'Scholarships', 'Pensions', 'Disability Allowances', 'Education & Health'
    description TEXT NOT NULL,
    benefits TEXT NOT NULL,
    eligibility_criteria TEXT NOT NULL,
    required_documents TEXT[] NOT NULL,
    application_steps TEXT[] NOT NULL,
    official_portal_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for category search
CREATE INDEX IF NOT EXISTS idx_schemes_category ON schemes(category);

-- 3. Saathi Peti (Hidden Private Saved History) Table
CREATE TABLE IF NOT EXISTS saathi_peti (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    scheme_id UUID REFERENCES schemes(id) ON DELETE CASCADE,
    notes TEXT,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Index on user_id and expiration
CREATE INDEX IF NOT EXISTS idx_saathi_peti_user ON saathi_peti(user_id);
CREATE INDEX IF NOT EXISTS idx_saathi_peti_expires_at ON saathi_peti(expires_at);

-- 4. Auto-Delete Expired History (PostgreSQL Extension or Scheduled Function)
-- Enable pg_cron if supported in Supabase instance
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) THEN
        PERFORM cron.schedule('delete_expired_saathi_peti', '0 0 * * *', 'DELETE FROM saathi_peti WHERE expires_at < NOW();');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- pg_cron not permitted on some Supabase tiers; application handles expired rows cleanup
END $$;

-- ====================================================================
-- SEED DATA: Realistic Government Schemes Across Target Domains
-- Multilingual titles and clear eligibility for elderly/marginalized citizens
-- ====================================================================

INSERT INTO schemes (
    title_en, title_hi, title_te, title_ta, title_kn,
    category, description, benefits, eligibility_criteria,
    required_documents, application_steps, official_portal_url
) VALUES
-- 1. Farm Support: PM-KISAN
(
    'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    'प्रधानमंत्री किसान सम्मान निधि (पीएम-किसान)',
    'పీఎం-కిసాన్ (రైతు సమ్మాన్ నిధి)',
    'பிரதமர் கிசான் திட்டம்',
    'ಪಿಎಂ-ಕಿಸಾನ್ ಯೋಜನೆ',
    'Farm Support',
    'Direct financial support of Rs. 6,000 per year in three equal installments of Rs. 2,000 to all landholding farmer families across India.',
    'Rs. 6,000 annually deposited directly into bank account via DBT.',
    'Small and marginal farmer families who own cultivable land up to 2 hectares (subject to exclusion of institutional landholders and high tax payers).',
    ARRAY['Aadhaar Card', 'Land Ownership Record (Khata/Pattadar Passbook)', 'Bank Passbook with Aadhaar link', 'Active Mobile Number'],
    ARRAY['Visit nearest CSC (Common Service Center) or Gram Panchayat office', 'Submit Aadhaar and Land Passbook for e-KYC verification', 'Track status on pmkisan.gov.in portal or via Gram Sevak'],
    'https://pmkisan.gov.in'
),
-- 2. Farm Support: Rythu Bharosa / Subsidized Micro Irrigation
(
    'Subsidized Micro-Irrigation & Drip Support',
    'ड्रिप सिंचाई सब्सिडी योजना',
    'రైతు బిందు సేద్యం మరియు తుంపర సేద్యం రాయితీ',
    'சொட்டு நீர் பாசன மானியத் திட்டம்',
    'ಹನಿ ನೀರಾವರಿ ಸಹಾಯಧನ ಯೋಜನೆ',
    'Farm Support',
    'Up to 90% subsidy for small and marginal farmers to install drip and sprinkler irrigation systems, conserving groundwater.',
    '70% to 90% financial subsidy on drip/sprinkler equipment.',
    'Farmers with valid agricultural land, priority to small and marginal farmers, SC/ST farmers, and women cultivators.',
    ARRAY['Land Revenue Record (Pahani/Adangal)', 'Aadhaar Card', 'Soil & Water Testing Report (optional)', 'Passport Size Photo', 'Bank Passbook copy'],
    ARRAY['Apply at Mandal/Taluk Agricultural Office or Horticulture Dept', 'Field inspection by agricultural officer', 'Installation of certified drip equipment by approved vendor', 'Subsidy released to supplier/farmer'],
    'https://pmksy.gov.in'
),
-- 3. Pensions: Indira Gandhi National Old Age Pension Scheme (IGNOAPS)
(
    'Indira Gandhi National Old Age Pension Scheme (IGNOAPS)',
    'इंदिरा गांधी राष्ट्रीय वृद्धावस्था पेंशन योजना',
    'ఇందిరా గాంధీ జాతీయ వృద్ధాప్య పింఛను పథకం',
    'இந்திரா காந்தி முதியோர் ஓய்வூதியத் திட்டம்',
    'ಇಂದಿರಾ ಗಾಂಧಿ ರಾಷ್ಟ್ರೀಯ ವೃದ್ಧಾಪ್ಯ ವೇತನ ಯೋಜನೆ',
    'Pensions',
    'Monthly non-contributory pension for elderly citizens living below the poverty line to ensure dignity and food security.',
    'Rs. 1,000 to Rs. 2,500 monthly (depending on state top-up) directly into bank account.',
    'Person must be 60 years or older and belong to a household living Below Poverty Line (BPL).',
    ARRAY['Age Proof (Aadhaar Card / Voter ID / Birth Certificate)', 'BPL Ration Card', 'Bank Passbook or Post Office Account', 'Passport Photo'],
    ARRAY['Get Form from Village Revenue Officer (VRO) or Panchayat Secretary', 'Attach BPL card and Aadhaar photocopy', 'Panchayat approves in Gram Sabha', 'Monthly pension disbursed through DBT or Postman'],
    'https://nsap.nic.in'
),
-- 4. Pensions: Widow and Destitute Women Pension
(
    'Widow and Single Destitute Women Pension',
    'विधवा एवं निराश्रित महिला पेंशन योजना',
    'విధవా పెన్షన్ పథకం',
    'விதவை மற்றும் ஆதரவற்றோர் ஓய்வூதியம்',
    'ವಿಧವಾ ಮತ್ತು ನಿರ್ಗತಿಕ ಮಹಿಳಾ ವೇತನ',
    'Pensions',
    'Financial protection for widows and destitute women who lack independent family support.',
    'Monthly pension of Rs. 1,000 to Rs. 2,500 to cover essential medicine and groceries.',
    'Widowed or destitute woman aged 18 to 65+, BPL category or annual family income below specified rural limit (Rs. 1,00,000).',
    ARRAY['Death Certificate of Husband', 'Aadhaar Card', 'Income Certificate or BPL Card', 'Bank Passbook with IFSC', 'Passport size photographs'],
    ARRAY['Collect application form from Block Development Officer (BDO) or Gram Panchayat', 'Submit with husband death certificate and income proof', 'Verification by Social Welfare Inspector', 'Approval letter issued with pension ID'],
    'https://nsap.nic.in'
),
-- 5. Disability Allowances: Divyangjan Swavalamban & Disability Pension
(
    'Divyangjan Disability Pension & Equipment Grant (ADIP)',
    'दिव्यांगजन पेंशन एवं कृत्रिम अंग सहायता योजना (ADIP)',
    'దివ్యాంగుల పింఛను మరియు సహాయ పరికరాల పథకం',
    'மாற்றுத்திறனாளிகள் உதவித்தொகை மற்றும் உபகரணத் திட்டம்',
    'ವಿಕಲಚೇತನರ ಮಾಸಾಶನ ಮತ್ತು ಸಾಧನ ಸಲಕರಣೆ ಯೋಜನೆ',
    'Disability Allowances',
    'Comprehensive support providing monthly financial pension plus free motorized tricycles, wheelchairs, hearing aids, and braille kits.',
    'Monthly pension up to Rs. 3,000 plus 100% free assistive aids and appliances.',
    'Persons with disability of 40% and above certified by a medical board, with monthly family income below Rs. 20,000.',
    ARRAY['Disability Certificate (UDID Card or Civil Hospital Certificate)', 'Aadhaar Card', 'Income Certificate from Tehsildar', 'Ration Card', 'Passport Photo showing disability'],
    ARRAY['Get disability assessment certificate from District Hospital', 'Register online on Swavlamban Card (UDID) portal', 'Submit aid application at District Disability Rehabilitation Centre (DDRC)', 'Receive equipment and pension sanction'],
    'https://disabilityaffairs.gov.in'
),
-- 6. Scholarships: National Post-Matric & Merit Scholarship
(
    'Post-Matric Scholarship for SC/ST/OBC and Minority Students',
    'पोस्ट-मैट्रिक छात्रवृत्ति योजना (एससी/एसटी/ओबीसी)',
    'ఎస్సీ/ఎస్టీ/బీసీ విద్యార్థుల పోస్ట్-మెట్రిక్ స్కాలర్‌షిప్',
    'பிற்படுத்தப்பட்டோர் மற்றும் ஆதிதிராவிடர் கல்வி உதவித்தொகை',
    'ಮೆಟ್ರಿಕ್ ನಂತರದ ವಿದ್ಯಾರ್ಥಿವೇತನ ಯೋಜನೆ',
    'Scholarships',
    'Complete tuition fee waiver plus monthly maintenance allowance for students studying in Class 11, 12, ITI, Diploma, and College.',
    'Full course fee reimbursement plus up to Rs. 13,500/year living allowance.',
    'Student enrolled in recognized post-secondary institution. Annual family income below Rs. 2.5 Lakhs.',
    ARRAY['10th Class Marksheet', 'Caste Certificate', 'Income Certificate', 'College Bonafide / Admission Receipt', 'Aadhaar Card', 'Bank Passbook'],
    ARRAY['Register on National Scholarship Portal (scholarships.gov.in)', 'Fill scholarship details and upload certificates', 'Institute verifies application online', 'District welfare officer approves and amount sent to bank'],
    'https://scholarships.gov.in'
),
-- 7. Education & Health: Ayushman Bharat (PM-JAY Health Shield)
(
    'Ayushman Bharat (PM-JAY) Free Health Treatment Card',
    'आयुष्मान भारत (पीएम-जय) 5 लाख मुफ्त इलाज कार्ड',
    'ఆయుష్మాన్ భారత్ - ప్రధాన మంత్రి జన ఆరోగ్య యోజన (5 లక్షల ఉచిత వైద్యం)',
    'ஆயுஷ்மான் பாரத் இலவச மருத்துவக் காப்பீடு',
    'ಆಯುಷ್ಮಾನ್ ಭಾರತ್ ಉಚಿತ ಆರೋಗ್ಯ ಚಿಕಿತ್ಸೆ ಯೋಜನೆ',
    'Education & Health',
    'Cashless health insurance coverage of up to Rs. 5,00,000 per family per year for secondary and tertiary hospitalization across 28,000+ empanelled hospitals.',
    'Free medical operations, medicines, and ICU care up to Rs. 5 Lakhs annually.',
    'Families identified in SECC 2011 database, rural deprivation criteria D1 to D7, and active NFSA ration card holders.',
    ARRAY['Ration Card (NFSA)', 'Aadhaar Card of all family members', 'Active Mobile Number'],
    ARRAY['Visit any government hospital Ayushman Mitra desk or CSC center', 'Provide Aadhaar and Ration Card to check eligibility', 'Biometric e-KYC or OTP verification', 'Instant Ayushman Golden Card PVC printed'],
    'https://pmjay.gov.in'
),
-- 8. Education & Health: Pradhan Mantri Matru Vandana Yojana (PMMVY)
(
    'Pradhan Mantri Matru Vandana Yojana (PMMVY - Maternity Benefit)',
    'प्रधानमंत्री मातृ वंदना योजना (मातृत्व लाभ ₹5,000 - ₹6,000)',
    'ప్రధాన మంత్రి మాతృ వందన యోజన (గర్భిణీ స్త్రీల సహాయం)',
    'பிரதமர் மாத்ரு வந்தனா திட்டம் (மகப்பேறு உதவித்தொகை)',
    'ಪ್ರಧಾನ ಮಂತ್ರಿ ಮಾತೃ ವಂದನಾ ಯೋಜನೆ (ಗರ್ಭಿಣಿಯರ ಸಹಾಯಧನ)',
    'Education & Health',
    'Cash incentive for pregnant women and lactating mothers for first and second child (if girl) to promote adequate nutrition and institutional delivery.',
    'Direct transfer of Rs. 5,000 in 2 installments for 1st child, Rs. 6,000 for 2nd girl child.',
    'Pregnant women and lactating mothers aged 19 and above, not employed in Central/State Government or PSU.',
    ARRAY['Mother Child Protection (MCP) Card from Anganwadi', 'Aadhaar of Mother and Husband', 'Bank Passbook of Mother', 'Child Birth Certificate (for 2nd installment)'],
    ARRAY['Register pregnancy at nearest Anganwadi Centre (AWC) within 150 days', 'Submit MCP Card copy and bank account details to ASHA worker', 'Installments credited on antenatal checkup and institutional delivery'],
    'https://pmmvy.wcd.gov.in'
);
