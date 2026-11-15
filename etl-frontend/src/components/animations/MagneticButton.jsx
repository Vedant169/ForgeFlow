import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

/**
 * Animate-UI: MagneticButton
 * Interactive magnetic button that pulls towards cursor.
 */
export const MagneticButton = ({
  children,
  pullFactor = 0.35,
  className = '',
  style = {},
  onClick,
  disabled = false,
}) => {
  const buttonRef = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 180, damping: 15 });
  const springY = useSpring(y, { stiffness: 180, damping: 15 });

  const handleMouseMove = (e) => {
    if (disabled || !buttonRef.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    x.set((clientX - centerX) * pullFactor);
    y.set((clientY - centerY) * pullFactor);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={buttonRef}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        x: springX,
        y: springY,
        ...style,
      }}
      whileTap={{ scale: 0.96 }}
    >
      {children}
    </motion.button>
  );
};
