import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseServiceKey && 
  !supabaseUrl.includes('your-project-id') &&
  supabaseUrl.startsWith('http')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

if (isSupabaseConfigured) {
  console.log('✅ Supabase PostgreSQL client connected via Service Role Key');
} else {
  console.warn('⚠️ Supabase credentials not set or incomplete in server/.env. Running with robust local in-memory fallback for development & demo.');
}

// Initial seed schemes for fallback when Supabase is not connected
export const SEED_SCHEMES = [
  {
    id: 'f1a10001-0000-0000-0000-000000000001',
    title_en: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    title_hi: 'प्रधानमंत्री किसान सम्मान निधि (पीएम-किसान)',
    title_te: 'పీఎం-కిసాన్ (రైతు సమ్మాన్ నిధి)',
    title_ta: 'பிரதமர் கிசான் திட்டம்',
    title_kn: 'ಪಿಎಂ-ಕಿಸಾನ್ ಯೋಜನೆ',
    category: 'Farm Support',
    description: 'Direct financial support of Rs. 6,000 per year in three equal installments of Rs. 2,000 to all landholding farmer families across India.',
    benefits: 'Rs. 6,000 annually deposited directly into bank account via DBT.',
    eligibility_criteria: 'Small and marginal farmer families who own cultivable land up to 2 hectares (subject to exclusion of institutional landholders and high tax payers).',
    required_documents: ['Aadhaar Card', 'Land Ownership Record (Khata/Pattadar Passbook)', 'Bank Passbook with Aadhaar link', 'Active Mobile Number'],
    application_steps: ['Visit nearest CSC (Common Service Center) or Gram Panchayat office', 'Submit Aadhaar and Land Passbook for e-KYC verification', 'Track status on pmkisan.gov.in portal or via Gram Sevak'],
    official_portal_url: 'https://pmkisan.gov.in'
  },
  {
    id: 'f1a10001-0000-0000-0000-000000000002',
    title_en: 'Subsidized Micro-Irrigation & Drip Support',
    title_hi: 'ड्रिप सिंचाई सब्सिडी योजना',
    title_te: 'రైతు బిందు సేద్యం మరియు తుంపర సేద్యం రాయితీ',
    title_ta: 'சொட்டு நீர் பாசன மானியத் திட்டம்',
    title_kn: 'ಹನಿ ನೀರಾವರಿ ಸಹಾಯಧನ ಯೋಜನೆ',
    category: 'Farm Support',
    description: 'Up to 90% subsidy for small and marginal farmers to install drip and sprinkler irrigation systems, conserving groundwater.',
    benefits: '70% to 90% financial subsidy on drip/sprinkler equipment.',
    eligibility_criteria: 'Farmers with valid agricultural land, priority to small and marginal farmers, SC/ST farmers, and women cultivators.',
    required_documents: ['Land Revenue Record (Pahani/Adangal)', 'Aadhaar Card', 'Soil & Water Testing Report (optional)', 'Passport Size Photo', 'Bank Passbook copy'],
    application_steps: ['Apply at Mandal/Taluk Agricultural Office or Horticulture Dept', 'Field inspection by agricultural officer', 'Installation of certified drip equipment by approved vendor', 'Subsidy released to supplier/farmer'],
    official_portal_url: 'https://pmksy.gov.in'
  },
  {
    id: 'f1a10001-0000-0000-0000-000000000003',
    title_en: 'Indira Gandhi National Old Age Pension Scheme (IGNOAPS)',
    title_hi: 'इंदिरा गांधी राष्ट्रीय वृद्धावस्था पेंशन योजना',
    title_te: 'ఇందిరా గాంధీ జాతీయ వృద్ధాప్య పింఛను పథకం',
    title_ta: 'இந்திரா காந்தி முதியோர் ஓய்வூதியத் திட்டம்',
    title_kn: 'ಇಂದಿರಾ ಗಾಂಧಿ ರಾಷ್ಟ್ರೀಯ ವೃದ್ಧಾಪ್ಯ ವೇತನ ಯೋಜನೆ',
    category: 'Pensions',
    description: 'Monthly non-contributory pension for elderly citizens living below the poverty line to ensure dignity and food security.',
    benefits: 'Rs. 1,000 to Rs. 2,500 monthly (depending on state top-up) directly into bank account.',
    eligibility_criteria: 'Person must be 60 years or older and belong to a household living Below Poverty Line (BPL).',
    required_documents: ['Age Proof (Aadhaar Card / Voter ID / Birth Certificate)', 'BPL Ration Card', 'Bank Passbook or Post Office Account', 'Passport Photo'],
    application_steps: ['Get Form from Village Revenue Officer (VRO) or Panchayat Secretary', 'Attach BPL card and Aadhaar photocopy', 'Panchayat approves in Gram Sabha', 'Monthly pension disbursed through DBT or Postman'],
    official_portal_url: 'https://nsap.nic.in'
  },
  {
    id: 'f1a10001-0000-0000-0000-000000000004',
    title_en: 'Widow and Single Destitute Women Pension',
    title_hi: 'विधवा एवं निराश्रित महिला पेंशन योजना',
    title_te: 'విధవా పెన్షన్ పథకం',
    title_ta: 'விதவை மற்றும் ஆதரவற்றோர் ஓய்வூதியம்',
    title_kn: 'ವಿಧವಾ ಮತ್ತು ನಿರ್ಗತಿಕ ಮಹಿಳಾ ವೇತನ',
    category: 'Pensions',
    description: 'Financial protection for widows and destitute women who lack independent family support.',
    benefits: 'Monthly pension of Rs. 1,000 to Rs. 2,500 to cover essential medicine and groceries.',
    eligibility_criteria: 'Widowed or destitute woman aged 18 to 65+, BPL category or annual family income below specified rural limit (Rs. 1,00,000).',
    required_documents: ['Death Certificate of Husband', 'Aadhaar Card', 'Income Certificate or BPL Card', 'Bank Passbook with IFSC', 'Passport size photographs'],
    application_steps: ['Collect application form from Block Development Officer (BDO) or Gram Panchayat', 'Submit with husband death certificate and income proof', 'Verification by Social Welfare Inspector', 'Approval letter issued with pension ID'],
    official_portal_url: 'https://nsap.nic.in'
  },
  {
    id: 'f1a10001-0000-0000-0000-000000000005',
    title_en: 'Divyangjan Disability Pension & Equipment Grant (ADIP)',
    title_hi: 'दिव्यांगजन पेंशन एवं कृत्रिम अंग सहायता योजना (ADIP)',
    title_te: 'దివ్యాంగుల పింఛను మరియు సహాయ పరికరాల పథకం',
    title_ta: 'மாற்றுத்திறனாளிகள் உதவித்தொகை மற்றும் உபகரணத் திட்டம்',
    title_kn: 'ವಿಕಲಚೇತನರ ಮಾಸಾಶನ ಮತ್ತು ಸಾಧನ ಸಲಕರಣೆ ಯೋಜನೆ',
    category: 'Disability Allowances',
    description: 'Comprehensive support providing monthly financial pension plus free motorized tricycles, wheelchairs, hearing aids, and braille kits.',
    benefits: 'Monthly pension up to Rs. 3,000 plus 100% free assistive aids and appliances.',
    eligibility_criteria: 'Persons with disability of 40% and above certified by a medical board, with monthly family income below Rs. 20,000.',
    required_documents: ['Disability Certificate (UDID Card or Civil Hospital Certificate)', 'Aadhaar Card', 'Income Certificate from Tehsildar', 'Ration Card', 'Passport Photo showing disability'],
    application_steps: ['Get disability assessment certificate from District Hospital', 'Register online on Swavlamban Card (UDID) portal', 'Submit aid application at District Disability Rehabilitation Centre (DDRC)', 'Receive equipment and pension sanction'],
    official_portal_url: 'https://disabilityaffairs.gov.in'
  },
  {
    id: 'f1a10001-0000-0000-0000-000000000006',
    title_en: 'Post-Matric Scholarship for SC/ST/OBC and Minority Students',
    title_hi: 'पोस्ट-मैट्रिक छात्रवृत्ति योजना (एससी/एसटी/ओबीसी)',
    title_te: 'ఎస్సీ/ఎస్టీ/బీసీ విద్యార్థుల పోస్ట్-మెట్రిక్ స్కాలర్‌షిప్',
    title_ta: 'பிற்படுத்தப்பட்டோர் மற்றும் ஆதிதிராவிடர் கல்வி உதவித்தொகை',
    title_kn: 'ಮೆಟ್ರಿಕ್ ನಂತರದ ವಿದ್ಯಾರ್ಥಿವೇತನ ಯೋಜನೆ',
    category: 'Scholarships',
    description: 'Complete tuition fee waiver plus monthly maintenance allowance for students studying in Class 11, 12, ITI, Diploma, and College.',
    benefits: 'Full course fee reimbursement plus up to Rs. 13,500/year living allowance.',
    eligibility_criteria: 'Student enrolled in recognized post-secondary institution. Annual family income below Rs. 2.5 Lakhs.',
    required_documents: ['10th Class Marksheet', 'Caste Certificate', 'Income Certificate', 'College Bonafide / Admission Receipt', 'Aadhaar Card', 'Bank Passbook'],
    application_steps: ['Register on National Scholarship Portal (scholarships.gov.in)', 'Fill scholarship details and upload certificates', 'Institute verifies application online', 'District welfare officer approves and amount sent to bank'],
    official_portal_url: 'https://scholarships.gov.in'
  },
  {
    id: 'f1a10001-0000-0000-0000-000000000007',
    title_en: 'Ayushman Bharat (PM-JAY) Free Health Treatment Card',
    title_hi: 'आयुष्मान भारत (पीएम-जय) 5 लाख मुफ्त इलाज कार्ड',
    title_te: 'ఆయుష్మాన్ భారత్ - ప్రధాన మంత్రి జన ఆరోగ్య యోజన (5 లక్షల ఉచిత వైద్యం)',
    title_ta: 'ஆயுஷ்மான் பாரத் இலவச மருத்துவக் காப்பீடு',
    title_kn: 'ಆಯುಷ್ಮಾನ್ ಭಾರತ್ ಉಚಿತ ಆರೋಗ್ಯ ಚಿಕಿತ್ಸೆ ಯೋಜನೆ',
    category: 'Education & Health',
    description: 'Cashless health insurance coverage of up to Rs. 5,00,000 per family per year for secondary and tertiary hospitalization across 28,000+ empanelled hospitals.',
    benefits: 'Free medical operations, medicines, and ICU care up to Rs. 5 Lakhs annually.',
    eligibility_criteria: 'Families identified in SECC 2011 database, rural deprivation criteria D1 to D7, and active NFSA ration card holders.',
    required_documents: ['Ration Card (NFSA)', 'Aadhaar Card of all family members', 'Active Mobile Number'],
    application_steps: ['Visit any government hospital Ayushman Mitra desk or CSC center', 'Provide Aadhaar and Ration Card to check eligibility', 'Biometric e-KYC or OTP verification', 'Instant Ayushman Golden Card PVC printed'],
    official_portal_url: 'https://pmjay.gov.in'
  },
  {
    id: 'f1a10001-0000-0000-0000-000000000008',
    title_en: 'Pradhan Mantri Matru Vandana Yojana (PMMVY - Maternity Benefit)',
    title_hi: 'प्रधानमंत्री मातृ वंदना योजना (मातृत्व लाभ ₹5,000 - ₹6,000)',
    title_te: 'ప్రధాన మంత్రి మాతృ వందన యోజన (గర్భిణీ స్త్రీల సహాయం)',
    title_ta: 'பிரதமர் மாத்ரு வந்தனா திட்டம் (மகப்பேறு உதவித்தொகை)',
    title_kn: 'ಪ್ರಧಾನ ಮಂತ್ರಿ ಮಾತೃ ವಂದನಾ ಯೋಜನೆ (ಗರ್ಭಿಣಿಯರ ಸಹಾಯಧನ)',
    category: 'Education & Health',
    description: 'Cash incentive for pregnant women and lactating mothers for first and second child (if girl) to promote adequate nutrition and institutional delivery.',
    benefits: 'Direct transfer of Rs. 5,000 in 2 installments for 1st child, Rs. 6,000 for 2nd girl child.',
    eligibility_criteria: 'Pregnant women and lactating mothers aged 19 and above, not employed in Central/State Government or PSU.',
    required_documents: ['Mother Child Protection (MCP) Card from Anganwadi', 'Aadhaar of Mother and Husband', 'Bank Passbook of Mother', 'Child Birth Certificate (for 2nd installment)'],
    application_steps: ['Register pregnancy at nearest Anganwadi Centre (AWC) within 150 days', 'Submit MCP Card copy and bank account details to ASHA worker', 'Installments credited on antenatal checkup and institutional delivery'],
    official_portal_url: 'https://pmmvy.wcd.gov.in'
  }
];

// In-Memory store for users and saathi_peti when Supabase isn't configured
const memoryStore = {
  users: [],
  saathiPeti: []
};

// Database helper operations supporting both Supabase and fallback
export const db = {
  // --- USERS ---
  async createUser({ pinHash, preferredLanguage = 'en-IN' }) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('users')
        .insert([{ pin_hash: pinHash, preferred_language: preferredLanguage }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const newUser = {
      id: crypto.randomUUID(),
      pin_hash: pinHash,
      preferred_language: preferredLanguage,
      failed_attempts: 0,
      lockout_until: null,
      created_at: new Date().toISOString()
    };
    memoryStore.users.push(newUser);
    return newUser;
  },

  async getAllUsers() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return data || [];
    }
    return memoryStore.users;
  },

  async getUserById(id) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
    return memoryStore.users.find(u => u.id === id) || null;
  },

  async updateUser(id, updates) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const idx = memoryStore.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      memoryStore.users[idx] = { ...memoryStore.users[idx], ...updates };
      return memoryStore.users[idx];
    }
    return null;
  },

  // --- SCHEMES ---
  async getAllSchemes() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('schemes').select('*');
      if (!error && data && data.length > 0) {
        return data;
      }
      // If table exists but empty, try seeding or return SEED_SCHEMES
      if (data && data.length === 0) {
        try {
          const { data: inserted } = await supabase.from('schemes').insert(SEED_SCHEMES).select();
          if (inserted && inserted.length > 0) return inserted;
        } catch (e) {
          console.warn('Auto-seed to Supabase schemes failed:', e.message);
        }
      }
    }
    return SEED_SCHEMES;
  },

  async getSchemeById(id) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('schemes')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) return data;
    }
    return SEED_SCHEMES.find(s => s.id === id) || null;
  },

  // --- SAATHI PETI ---
  async saveToPeti({ userId, schemeId, notes = '' }) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    if (isSupabaseConfigured) {
      // Check if already saved
      const { data: existing } = await supabase
        .from('saathi_peti')
        .select('id')
        .eq('user_id', userId)
        .eq('scheme_id', schemeId)
        .maybeSingle();

      if (existing) {
        // Renew expiry
        const { data, error } = await supabase
          .from('saathi_peti')
          .update({ expires_at: expiresAt, notes })
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from('saathi_peti')
        .insert([{
          user_id: userId,
          scheme_id: schemeId,
          notes,
          expires_at: expiresAt
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    // In-memory fallback
    const existingIndex = memoryStore.saathiPeti.findIndex(
      p => p.user_id === userId && p.scheme_id === schemeId
    );
    if (existingIndex !== -1) {
      memoryStore.saathiPeti[existingIndex].expires_at = expiresAt;
      memoryStore.saathiPeti[existingIndex].notes = notes;
      return memoryStore.saathiPeti[existingIndex];
    }

    const newRecord = {
      id: crypto.randomUUID(),
      user_id: userId,
      scheme_id: schemeId,
      notes,
      saved_at: new Date().toISOString(),
      expires_at: expiresAt
    };
    memoryStore.saathiPeti.push(newRecord);
    return newRecord;
  },

  async getUserPeti(userId) {
    const now = new Date().toISOString();
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('saathi_peti')
        .select(`
          id,
          saved_at,
          expires_at,
          notes,
          schemes (*)
        `)
        .eq('user_id', userId)
        .gt('expires_at', now)
        .order('saved_at', { ascending: false });

      if (!error && data) {
        return data.map(item => ({
          peti_id: item.id,
          saved_at: item.saved_at,
          expires_at: item.expires_at,
          notes: item.notes,
          scheme: item.schemes
        }));
      }
    }

    // In-memory fallback: filter active and join with SEED_SCHEMES
    const userRecords = memoryStore.saathiPeti.filter(
      p => p.user_id === userId && new Date(p.expires_at) > new Date()
    );

    return userRecords.map(item => ({
      peti_id: item.id,
      saved_at: item.saved_at,
      expires_at: item.expires_at,
      notes: item.notes,
      scheme: SEED_SCHEMES.find(s => s.id === item.scheme_id) || null
    })).filter(item => item.scheme !== null);
  },

  async removeFromPeti(userId, petiId) {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('saathi_peti')
        .delete()
        .eq('id', petiId)
        .eq('user_id', userId);
      if (error) throw error;
      return true;
    }
    const idx = memoryStore.saathiPeti.findIndex(p => p.id === petiId && p.user_id === userId);
    if (idx !== -1) {
      memoryStore.saathiPeti.splice(idx, 1);
      return true;
    }
    return false;
  }
};
