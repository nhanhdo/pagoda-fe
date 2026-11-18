import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button, Popconfirm } from 'antd';
import { UndoOutlined } from '@ant-design/icons';
import { useLanguage } from '../../i18n/LanguageContext';

const ROUND = 108; // một tràng hạt
const R = 92;
const C = 2 * Math.PI * R;

const keyOf = (id) => `chant_count_${id}`;
const load = (id) => Math.max(0, parseInt(localStorage.getItem(keyOf(id)) || '0', 10) || 0);

/** Tap-to-count mantra counter (108 beads per round), remembered per figure on this device. */
export default function ChantCounter({ open, figure, onClose }) {
  const { t, lang } = useLanguage();
  const L = t.library;
  const [count, setCount] = useState(0);
  const [pulse, setPulse] = useState(0);
  const [roundDone, setRoundDone] = useState(false);
  const btnRef = useRef(null);

  useEffect(() => { if (open && figure) setCount(load(figure.id)); }, [open, figure]);
  useEffect(() => { if (open && figure) localStorage.setItem(keyOf(figure.id), String(count)); }, [count, open, figure]);
  useEffect(() => { if (open) setTimeout(() => btnRef.current?.focus(), 150); }, [open]);

  const tap = () => {
    setCount(c => {
      const n = c + 1;
      if (n % ROUND === 0) {
        setRoundDone(true);
        setTimeout(() => setRoundDone(false), 1600);
        navigator.vibrate?.([30, 60, 30]);
      } else {
        navigator.vibrate?.(8);
      }
      return n;
    });
    setPulse(p => p + 1);
  };

  const inRound = count % ROUND;
  const rounds = Math.floor(count / ROUND);
  const progress = inRound / ROUND;

  return (
    <Modal open={open} onCancel={onClose} footer={null} centered width={420} className="lib-chant-modal" destroyOnClose title={null}>
      {figure && (
        <div className="lib-chant">
          <div className="lib-chant__name">{figure.name}</div>
          {(figure.mantraText || figure.mantra) && <p className="lib-chant__mantra">{figure.mantraText || figure.mantra}</p>}

          <button
            ref={btnRef}
            type="button"
            className={`lib-chant__dial${roundDone ? ' is-round' : ''}`}
            onClick={tap}
            onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tap(); } }}
            aria-label={`${L.chantTap}: ${count}`}
          >
            <svg viewBox="0 0 200 200" className="lib-chant__ring" aria-hidden>
              <circle cx="100" cy="100" r={R} className="lib-chant__track" />
              <circle
                cx="100" cy="100" r={R}
                className="lib-chant__progress"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - (roundDone ? 1 : progress))}
              />
            </svg>
            <span className="lib-chant__count" key={pulse}>{roundDone ? ROUND : inRound}</span>
            <span className="lib-chant__of">/ {ROUND}</span>
            <span className="lib-chant__hint">{roundDone ? L.chantRoundDone : L.chantTap}</span>
          </button>

          <div className="lib-chant__stats">
            <div><strong>{rounds}</strong><span>{L.chantRounds}</span></div>
            <div><strong>{count.toLocaleString(lang === 'en' ? 'en-US' : 'vi-VN')}</strong><span>{L.chantTotal}</span></div>
          </div>

          <div className="lib-chant__actions">
            <Popconfirm title={L.chantResetConfirm} onConfirm={() => setCount(0)} okText={L.chantReset} cancelText={t.common.cancel} disabled={!count}>
              <Button icon={<UndoOutlined />} disabled={!count}>{L.chantReset}</Button>
            </Popconfirm>
            <Button type="primary" onClick={onClose}>{L.chantDone}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
