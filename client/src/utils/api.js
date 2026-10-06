import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Dynamic Interceptor for Auth & Unlock Tokens
api.interceptors.request.use((config) => {
  // Check session storage first, then local storage (unless guest mode)
  const isGuest = sessionStorage.getItem('gramsaathi_guest_mode') === 'true';
  
  if (!isGuest) {
    const token = sessionStorage.getItem('gramsaathi_token') || localStorage.getItem('gramsaathi_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // Vault Unlock Token
  const unlockToken = sessionStorage.getItem('gramsaathi_unlock_token');
  if (unlockToken) {
    config.headers['x-unlock-token'] = unlockToken;
  }

  return config;
}, (error) => Promise.reject(error));

export const authApi = {
  register: (pin, language = 'en-IN') => api.post('/api/auth/register', { pin, language }),
  login: (pin, userId = null) => api.post('/api/auth/login', { pin, ...(userId ? { userId } : {}) }),
  getProfile: () => api.get('/api/auth/profile'),
  updateLanguage: (language) => api.put('/api/auth/language', { language }),
  unlockPeti: (pin) => api.post('/api/auth/unlock-peti', { pin })
};

export const schemesApi = {
  getAll: (category) => api.get('/api/schemes', { params: category ? { category } : {} }),
  getById: (id) => api.get(`/api/schemes/${id}`),
  match: (query, language = 'en-IN') => api.post('/api/schemes/match', { query, language }),
  documentCheck: (imageBase64, language = 'en-IN') => api.post('/api/schemes/document-check', { image_base64: imageBase64, language })
};

export const petiApi = {
  getHistory: (unlockToken) => api.get('/api/saathi-peti', {
    headers: unlockToken ? { 'x-unlock-token': unlockToken } : {}
  }),
  saveScheme: (schemeId, notes = '') => api.post('/api/saathi-peti', { scheme_id: schemeId, notes }),
  remove: (petiId) => api.delete(`/api/saathi-peti/${petiId}`)
};

export default api;
