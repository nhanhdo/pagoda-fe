import React, { useId, useSyncExternalStore } from 'react';
import { Player } from '@remotion/player';
import { Easing, interpolate, useCurrentFrame } from 'remotion';

const fps = 30;
const duration = 75;
const reducedMotionQuery = '(prefers-reduced-motion: reduce)';
const playerStyle = { width: '100%', aspectRatio: '1', pointerEvents: 'none' };

function subscribeToReducedMotion(callback) {
  const query = window.matchMedia(reducedMotionQuery);
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}

function prefersReducedMotion() {
  return window.matchMedia(reducedMotionQuery).matches;
}

function SealLayers({ inscription, ringStyle, sealStyle }) {
  const circleId = useId();

  return (
    <div className="lg-seal-scene">
      <svg className="lg-seal-ring" viewBox="0 0 320 320" style={ringStyle}>
        <circle cx="160" cy="160" r="148" />
        <defs>
          <path id={circleId} d="M 160,38 a 122,122 0 1,1 0,244 a 122,122 0 1,1 0,-244" />
        </defs>
        <text className="lg-seal-inscription">
          <textPath href={`#${circleId}`} textLength="715" lengthAdjust="spacing">
            {inscription}
          </textPath>
        </text>
      </svg>
      <div className="lg-seal-disc" style={sealStyle}>
        <span className="lg-seal-mark">卐</span>
      </div>
    </div>
  );
}

function SealAnimation({ inscription }) {
  const frame = useCurrentFrame();
  const settle = interpolate(frame, [0, 38], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return (
    <SealLayers
      inscription={inscription}
      ringStyle={{ opacity: .35 + .65 * settle }}
      sealStyle={{ transform: `scale(${.92 + .08 * settle})` }}
    />
  );
}

export default function PagodaSeal({ inscription }) {
  const reduceMotion = useSyncExternalStore(subscribeToReducedMotion, prefersReducedMotion, () => true);

  return (
    <div className="lg-seal" aria-hidden="true">
      {reduceMotion ? (
        <SealLayers inscription={inscription} />
      ) : (
        <Player
          component={SealAnimation}
          inputProps={{ inscription }}
          compositionWidth={320}
          compositionHeight={320}
          durationInFrames={duration}
          fps={fps}
          autoPlay
          clickToPlay={false}
          spaceKeyToPlayOrPause={false}
          style={playerStyle}
        />
      )}
    </div>
  );
}
