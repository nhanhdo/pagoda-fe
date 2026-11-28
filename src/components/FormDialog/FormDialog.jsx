import React, { useEffect, useRef, useState } from 'react';
import { Modal } from 'antd';
import { useLanguage } from '../../i18n/LanguageContext';
import './FormDialog.css';

export function FormSectionHeading({ section, className = '', children }) {
  return (
    <h2 className={`form-dialog__section ${className}`} data-form-section={section} tabIndex={-1}>
      {children}
    </h2>
  );
}

export default function FormDialog({
  title, children, sections, className = '', wrapClassName = '', styles, open, isAdding = false, okButtonProps, ...props
}) {
  const { t } = useLanguage();
  const [body, setBody] = useState(null);
  const [visibleViewport, setVisibleViewport] = useState(null);
  const [active, setActive] = useState(null);
  const jumpTop = useRef(null);
  const navRef = useRef(null);

  // Mobile keyboards can shrink the visual viewport while leaving 100dvh unchanged.
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!open || !viewport || !window.matchMedia('(pointer: coarse)').matches) return;

    const fitViewport = () => {
      const height = Math.round(viewport.height);
      const top = Math.round(viewport.offsetTop);
      const keyboardIsVisible = viewport.scale === 1 && height < window.innerHeight - 80;
      setVisibleViewport(current => {
        if (!keyboardIsVisible) return null;
        return current?.height === height && current?.top === top ? current : { height, top };
      });
    };

    fitViewport();
    viewport.addEventListener('resize', fitViewport);
    viewport.addEventListener('scroll', fitViewport);
    return () => {
      viewport.removeEventListener('resize', fitViewport);
      viewport.removeEventListener('scroll', fitViewport);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !body) return;
    jumpTop.current = null;
    body.scrollTop = 0;

    const update = () => {
      const headings = Array.from(body.querySelectorAll('[data-form-section]'));
      if (!headings.length) return;
      if (jumpTop.current !== null && Math.abs(body.scrollTop - jumpTop.current) < 2) return;
      jumpTop.current = null;

      const top = body.getBoundingClientRect().top + 26;
      const current = headings.findLast(heading => heading.getBoundingClientRect().top <= top) || headings[0];
      const atEnd = body.scrollHeight > body.clientHeight + 2
        && body.scrollHeight - body.clientHeight - body.scrollTop <= 2;
      const heading = atEnd ? headings[headings.length - 1] : current;
      setActive(heading.dataset.formSection);
    };

    update();
    body.addEventListener('scroll', update, { passive: true });
    return () => body.removeEventListener('scroll', update);
  }, [body, open]);

  useEffect(() => {
    const nav = navRef.current;
    const button = nav?.querySelector('[aria-current]');
    if (!button) return;
    const viewport = nav.getBoundingClientRect();
    const item = button.getBoundingClientRect();

    if (item.left < viewport.left + 3) nav.scrollLeft += item.left - viewport.left - 3;
    else if (item.right > viewport.right - 3) nav.scrollLeft += item.right - viewport.right + 3;
  }, [active, open]);

  const goToSection = (key) => {
    const heading = Array.from(body?.querySelectorAll('[data-form-section]') || [])
      .find(item => item.dataset.formSection === key);
    if (!heading) return;

    const offset = heading.getBoundingClientRect().top - body.getBoundingClientRect().top;
    const top = Math.max(0, Math.min(body.scrollTop + offset - 16, body.scrollHeight - body.clientHeight));
    jumpTop.current = top;
    body.scrollTop = top;
    setActive(key);
    heading.focus({ preventScroll: true });
  };

  return (
    <Modal
      {...props}
      open={open}
      okButtonProps={isAdding ? {
        ...okButtonProps,
        className: ['add-action', okButtonProps?.className].filter(Boolean).join(' '),
      } : okButtonProps}
      centered
      styles={open && visibleViewport ? {
        ...styles,
        wrapper: {
          ...styles?.wrapper,
          top: visibleViewport.top,
          height: visibleViewport.height,
          bottom: 'auto',
          '--form-dialog-viewport': `${visibleViewport.height}px`,
        },
      } : styles}
      className={`form-dialog ${sections ? 'form-dialog--indexed' : ''} ${className}`}
      wrapClassName={`form-dialog-wrap ${wrapClassName}`}
      title={title}
    >
      {sections ? (
        <>
          <nav ref={navRef} className="form-dialog__nav" aria-label={t.common.formSections}>
            {sections.map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-current={(active || sections[0][0]) === key ? 'location' : undefined}
                onClick={() => goToSection(key)}
              >
                {label}
              </button>
            ))}
          </nav>
          <div ref={setBody} className="form-dialog__fields">{children}</div>
        </>
      ) : children}
    </Modal>
  );
}
