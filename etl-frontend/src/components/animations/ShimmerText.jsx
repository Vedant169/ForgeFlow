import React from 'react';
import { motion } from 'motion/react';

/**
 * Animate-UI: ShimmerText
 * Flowing gradient shimmer effect across text.
 */
export const ShimmerText = ({
  children,
  shimmerColor = '#38bdf8',
  baseColor = '#ffffff',
  duration = 2.5,
  className = '',
  style = {},
}) => {
  return (
    <motion.span
      className={className}
      style={{
        display: 'inline-block',
        backgroundImage: `linear-gradient(110deg, ${baseColor} 0%, ${baseColor} 40%, ${shimmerColor} 50%, ${baseColor} 60%, ${baseColor} 100%)`,
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        ...style,
      }}
      animate={{
        backgroundPosition: ['100% 0%', '-100% 0%'],
      }}
      transition={{
        repeat: Infinity,
        duration,
        ease: 'linear',
      }}
    >
      {children}
    </motion.span>
  );
};
