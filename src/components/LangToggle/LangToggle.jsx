import React, { useId } from 'react';
import { Highlight } from '../AnimateUI/Effects';
import { useLanguage } from '../../i18n/LanguageContext';

/** VI / EN pill switch (styles: .hdr-lang in index.css). Used in the app header, login and home page. */
export default function LangToggle({ className = '' }) {
  const { lang, setLang } = useLanguage();
  const highlightId = useId();
  const onArrow = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const next = lang === 'vi' ? 'en' : 'vi';
    setLang(next);
    event.currentTarget.querySelector(`[lang="${next}"]`)?.focus();
  };
  return (
    <div className={`hdr-lang is-${lang} ${className}`.trim()} role="radiogroup" onKeyDown={onArrow} aria-label="Language / Ngôn ngữ">
      {['vi', 'en'].map(code => (
        <button
          key={code}
          type="button"
          role="radio"
          lang={code}
          tabIndex={lang === code ? 0 : -1}
          aria-label={code === 'vi' ? 'Tiếng Việt' : 'English'}
          aria-checked={lang === code}
          className={`hdr-lang__opt${lang === code ? ' is-active' : ''}`}
          onClick={() => setLang(code)}
          title={code === 'vi' ? 'Tiếng Việt' : 'English'}
        >
          <Highlight active={lang === code} layoutId={highlightId} className="hdr-lang__thumb" />
          <span className="hdr-lang__text">{code.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}
