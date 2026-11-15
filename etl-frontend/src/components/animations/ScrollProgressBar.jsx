import React from 'react';
import { motion, useScroll, useSpring } from 'motion/react';

/**
 * Animate-UI: ScrollProgressBar
 * Reactive top scroll progress bar synced with page scroll and Lenis.
 */
export const ScrollProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{
        scaleX,
        transformOrigin: '0%',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, #4f46e5 0%, #06b6d4 50%, #10b981 100%)',
        boxShadow: '0 0 12px rgba(6, 182, 212, 0.6)',
        zIndex: 9999,
      }}
    />
  );
};
