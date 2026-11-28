// React 18 adaptation of Animate UI v2.4.6's effects primitives.
// https://github.com/imskyleen/animate-ui/tree/v2.4.6/packages/react/src/primitives/effects
// Copyright (c) 2025 Elliot Sutton. See LICENSE.md in this directory.
import React, { useEffect, useRef } from 'react';
import { motion, useAnimate, useReducedMotion } from 'motion/react';
import './Effects.css';

const highlightSpring = { type: 'spring', stiffness: 500, damping: 40 };
const fadeEase = { duration: 0.2, ease: 'easeOut' };

export function Highlight({ active, layoutId, className }) {
  const reduced = useReducedMotion();
  if (!active) return null;

  if (reduced) {
    return <span aria-hidden="true" className={className} data-slot="motion-highlight" />;
  }

  return (
    <motion.span
      aria-hidden="true"
      className={className}
      data-slot="motion-highlight"
      layoutId={layoutId}
      initial={false}
      transition={highlightSpring}
    />
  );
}

export function Fade({ initialOpacity = 0, children, ...props }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : 'hidden'}
      animate="visible"
      variants={{ hidden: { opacity: initialOpacity }, visible: { opacity: 1 } }}
      transition={reduced ? { duration: 0 } : fadeEase}
      {...props}
    >
      {children}
    </motion.div>
  );
}


// Adapted from Animate UI's Shine overlay. The beam is confined to its button.
export function Shine({ intro = false }) {
  const [scope, animate] = useAnimate();
  const animation = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const beam = scope.current;
    const button = beam?.parentElement?.parentElement;
    if (!button || reduced) return;

    const sweep = (delay = 0) => {
      animation.current?.stop();
      animation.current = animate(beam, { x: ['-100%', '100%'], skewX: -18 }, {
        delay, duration: 0.7, ease: [0.4, 0, 0.2, 1],
      });
    };
    const onPointerEnter = event => {
      if (event.pointerType === 'mouse') sweep();
    };
    const onFocus = () => {
      if (button.matches(':focus-visible')) sweep();
    };

    button.addEventListener('pointerenter', onPointerEnter);
    button.addEventListener('focus', onFocus);
    if (intro) sweep(0.45);
    return () => {
      animation.current?.stop();
      button.removeEventListener('pointerenter', onPointerEnter);
      button.removeEventListener('focus', onFocus);
    };
  }, [animate, intro, reduced, scope]);

  if (reduced) return null;
  return <span className="aui-shine" aria-hidden="true"><span ref={scope} className="aui-shine__beam" /></span>;
}
