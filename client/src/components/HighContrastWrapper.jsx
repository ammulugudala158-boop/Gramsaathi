import React, { createContext, useContext, useState, useEffect } from 'react';

const ContrastContext = createContext();

export function HighContrastProvider({ children }) {
  const [isExtremeContrast, setIsExtremeContrast] = useState(() => {
    return localStorage.getItem('gramsaathi_contrast') === 'extreme';
  });

  useEffect(() => {
    if (isExtremeContrast) {
      document.documentElement.classList.add('extreme-contrast');
      localStorage.setItem('gramsaathi_contrast', 'extreme');
    } else {
      document.documentElement.classList.remove('extreme-contrast');
      localStorage.setItem('gramsaathi_contrast', 'standard');
    }
  }, [isExtremeContrast]);

  const toggleContrast = () => setIsExtremeContrast(prev => !prev);

  return (
    <ContrastContext.Provider value={{ isExtremeContrast, toggleContrast }}>
      <div className={`min-h-screen ${isExtremeContrast ? 'extreme-contrast' : ''}`}>
        {children}
      </div>
    </ContrastContext.Provider>
  );
}

export function useContrast() {
  const context = useContext(ContrastContext);
  if (!context) {
    throw new Error('useContrast must be used within HighContrastProvider');
  }
  return context;
}
