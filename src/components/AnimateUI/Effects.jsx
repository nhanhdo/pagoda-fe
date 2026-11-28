// React 18 adaptation of Animate UI v2.4.6's effects primitives.
// https://github.com/imskyleen/animate-ui/tree/v2.4.6/packages/react/src/primitives/effects
// Copyright (c) 2025 Elliot Sutton. See LICENSE.md in this directory.
import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

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
