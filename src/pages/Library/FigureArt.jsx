import React from 'react';
import DharmaWheel from '../../components/DharmaWheel/DharmaWheel';
import { KIND_TONE, figureImg } from './libraryShared';

/** Figure image, or a soft halo + Dharma wheel placeholder when none has been uploaded. */
export default function FigureArt({ figure, className = '' }) {
  const src = figureImg(figure.image);
  const tone = KIND_TONE[figure.kind] || KIND_TONE.phat;
  return (
    <div className={`lib-art ${className}`} style={{ '--halo': tone.halo, '--tone': tone.c }}>
      {src ? (
        <img src={src} alt={figure.name} loading="lazy" draggable={false} />
      ) : (
        <div className="lib-art__placeholder" aria-hidden>
          <span className="lib-art__halo" />
          <DharmaWheel size="44%" strokeWidth={4} className="lib-art__wheel" />
        </div>
      )}
    </div>
  );
}
