import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Slider, Button, message } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, UndoOutlined, DragOutlined } from '@ant-design/icons';
import { useLanguage } from '../../i18n/LanguageContext';
import './AvatarCropModal.css';

const OUT = 512;        // exported square size (px)
const MAX_ZOOM = 4;

/**
 * Circular avatar cropper: drag to position, slider / wheel / pinch-free keyboard to zoom.
 * `src` is an object URL of the chosen file. `initial` restores a previous {x, y, zoom}.
 * onDone(file, previewUrl, state) receives a 512×512 JPEG.
 */
export default function AvatarCropModal({ open, src, initial, onCancel, onDone }) {
  const { t } = useLanguage();
  const C = t.common;
  const imgRef = useRef(null);
  const drag = useRef(null);
  const [nat, setNat] = useState(null);           // natural size {w, h}
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // image centre offset from viewport centre (px)
  const [view, setView] = useState(280);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const fit = () => setView(Math.max(200, Math.min(300, window.innerWidth - 96)));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setNat(null);
    setZoom(initial?.zoom || 1);
    setPos({ x: initial?.x || 0, y: initial?.y || 0 });
  }, [open, src]); // eslint-disable-line react-hooks/exhaustive-deps

  const scaleFor = useCallback((z) => (nat ? (view / Math.min(nat.w, nat.h)) * z : 1), [nat, view]);
  const clamp = useCallback((p, z) => {
    if (!nat) return p;
    const s = scaleFor(z);
    const mx = Math.max(0, (nat.w * s - view) / 2);
    const my = Math.max(0, (nat.h * s - view) / 2);
    return { x: Math.min(mx, Math.max(-mx, p.x)), y: Math.min(my, Math.max(-my, p.y)) };
  }, [nat, view, scaleFor]);

  // Keep the image covering the circle when the viewport size changes
  useEffect(() => { setPos(p => clamp(p, zoom)); }, [view, nat]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyZoom = (next) => {
    const z = Math.min(MAX_ZOOM, Math.max(1, next));
    const k = z / zoom;
    setZoom(z);
    setPos(p => clamp({ x: p.x * k, y: p.y * k }, z));
  };

  const onPointerDown = (e) => {
    if (!nat) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    setPos(clamp({ x: d.ox + e.clientX - d.sx, y: d.oy + e.clientY - d.sy }, zoom));
  };
  const endDrag = () => { drag.current = null; };

  // Wheel zoom (non-passive so the modal body doesn't scroll)
  const stageRef = useRef(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const applyZoomRef = useRef(applyZoom);
  applyZoomRef.current = applyZoom;
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const onWheel = (e) => { e.preventDefault(); applyZoomRef.current(zoomRef.current * (e.deltaY < 0 ? 1.08 : 1 / 1.08)); };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [open, nat]);

  const onKeyDown = (e) => {
    const step = e.shiftKey ? 30 : 8;
    const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      setPos(p => clamp({ x: p.x + dx, y: p.y + dy }, zoom));
    } else if (e.key === '+' || e.key === '=') { e.preventDefault(); applyZoom(zoom + 0.1); }
    else if (e.key === '-') { e.preventDefault(); applyZoom(zoom - 0.1); }
  };

  const handleApply = () => {
    const img = imgRef.current;
    if (!img || !nat) return;
    setBusy(true);
    const s = scaleFor(zoom);
    const dw = nat.w * s;
    const dh = nat.h * s;
    const size = view / s;
    const sx = (dw / 2 - view / 2 - pos.x) / s;
    const sy = (dh / 2 - view / 2 - pos.y) / s;
    const canvas = document.createElement('canvas');
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, OUT, OUT);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, size, size, 0, 0, OUT, OUT);
    canvas.toBlob((blob) => {
      setBusy(false);
      if (!blob) { message.error(C.cropLoadError); return; }
      const file = new File([blob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
      onDone(file, URL.createObjectURL(blob), { x: pos.x, y: pos.y, zoom });
    }, 'image/jpeg', 0.9);
  };

  const s = scaleFor(zoom);
  const imgStyle = nat ? {
    width: nat.w * s,
    height: nat.h * s,
    left: view / 2 - (nat.w * s) / 2 + pos.x,
    top: view / 2 - (nat.h * s) / 2 + pos.y,
  } : { opacity: 0 };

  return (
    <Modal
      open={open}
      title={C.cropTitle}
      onCancel={onCancel}
      width={Math.max(view + 64, 360)}
      centered
      maskClosable={false}
      destroyOnClose
      footer={[
        <Button key="reset" icon={<UndoOutlined />} onClick={() => { setZoom(1); setPos({ x: 0, y: 0 }); }} disabled={!nat}>{C.cropReset}</Button>,
        <Button key="cancel" onClick={onCancel}>{t.common.cancel}</Button>,
        <Button key="ok" type="primary" onClick={handleApply} loading={busy} disabled={!nat}>{C.cropApply}</Button>,
      ]}
    >
      <div className="acrop">
        <div
          ref={stageRef}
          className={`acrop__stage${drag.current ? ' is-dragging' : ''}`}
          style={{ width: view, height: view }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
          tabIndex={0}
          role="application"
          aria-label={C.cropHint}
        >
          {src && (
            <img
              ref={imgRef}
              src={src}
              alt=""
              draggable={false}
              className="acrop__img"
              style={imgStyle}
              onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              onError={() => message.error(C.cropLoadError)}
            />
          )}
          <div className="acrop__mask" aria-hidden />
          {nat && <div className="acrop__badge" aria-hidden><DragOutlined /></div>}
        </div>

        <div className="acrop__zoom">
          <button type="button" className="acrop__zbtn" onClick={() => applyZoom(zoom - 0.2)} aria-label={`${C.cropZoom} −`} disabled={!nat || zoom <= 1}><ZoomOutOutlined /></button>
          <Slider
            min={1} max={MAX_ZOOM} step={0.01}
            value={zoom}
            onChange={applyZoom}
            tooltip={{ formatter: v => `${Math.round(v * 100)}%` }}
            disabled={!nat}
            aria-label={C.cropZoom}
          />
          <button type="button" className="acrop__zbtn" onClick={() => applyZoom(zoom + 0.2)} aria-label={`${C.cropZoom} +`} disabled={!nat || zoom >= MAX_ZOOM}><ZoomInOutlined /></button>
        </div>
        <div className="acrop__hint">{C.cropHint}</div>
      </div>
    </Modal>
  );
}
