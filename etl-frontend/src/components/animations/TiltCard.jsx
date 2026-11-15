import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

/**
 * Animate-UI: TiltCard
 * 3D perspective tilt effect with cursor spotlight glow.
 */
export const TiltCard = ({
  children,
  tiltMax = 7,
  scale = 1.02,
  spotlightColor = 'rgba(6, 182, 212, 0.15)',
  className = '',
  style = {},
  onClick,
}) => {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateXSpring = useSpring(useTransform(mouseY, [0, 1], [tiltMax, -tiltMax]), {
    damping: 20,
    stiffness: 200,
  });

  const rotateYSpring = useSpring(useTransform(mouseX, [0, 1], [-tiltMax, tiltMax]), {
    damping: 20,
    stiffness: 200,
  });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <motion.div
      ref={cardRef}
      className={`glass-card-interactive ${className}`}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      animate={{
        scale: isHovered ? scale : 1,
      }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        style={{
          transformStyle: 'preserve-3d',
          rotateX: rotateXSpring,
          rotateY: rotateYSpring,
          width: '100%',
          height: '100%',
        }}
      >
        {children}

        {/* Dynamic Cursor Spotlight Glow */}
        {isHovered && (
          <motion.div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              background: `radial-gradient(circle 240px at ${mouseX.get() * 100}% ${mouseY.get() * 100}%, ${spotlightColor}, transparent 80%)`,
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
};
