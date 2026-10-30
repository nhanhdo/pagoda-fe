import React, { createContext, useContext, useState } from 'react';
import { translations, Language } from './translations';

interface LanguageContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: typeof translations['vi'];
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'vi',
  setLang: () => {},
  t: translations.vi,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('lang') as Language) || 'vi';
  });

  const handleSetLang = (l: Language) => {
    setLang(l);
    localStorage.setItem('lang', l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
