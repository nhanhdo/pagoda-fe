import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

/** VI / EN pill switch (styles: .hdr-lang in index.css). Used in the app header, login and home page. */
export default function LangToggle({ className = '' }) {
  const { lang, setLang } = useLanguage();
  return (
    <div className={`hdr-lang is-${lang} ${className}`.trim()} role="radiogroup" aria-label="Language / Ngôn ngữ">
      <span className="hdr-lang__thumb" aria-hidden="true" />
      {['vi', 'en'].map(code => (
        <button
          key={code}
          type="button"
          role="radio"
          aria-checked={lang === code}
          className={`hdr-lang__opt${lang === code ? ' is-active' : ''}`}
          onClick={() => setLang(code)}
          title={code === 'vi' ? 'Tiếng Việt' : 'English'}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
