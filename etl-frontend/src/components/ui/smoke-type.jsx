import React, { useState, useEffect, useMemo } from 'react';

/**
 * SmokeType Component
 * 
 * Condenses a headline out of drifting smoke, letter by letter.
 * Runs strictly ONCE when the page is opened.
 * Blends seamlessly into page typography without any isolated container or hover restarts.
 */
export function SmokeType({
  text = 'Radically different data pipelines.',
  smokeColor = 'rgba(188, 195, 255, 0.65)',
  textColor = '#F7F8F8',
  duration = 1.2,
  stagger = 0.035,
  rise = 18,
  softness = 10,
  className = '',
  as: Component = 'h1',
}) {
  const [isCondensed, setIsCondensed] = useState(false);

  // Split text into words and characters to preserve exact word-wrapping
  const words = useMemo(() => {
    return text.split(' ').map((word) => word.split(''));
  }, [text]);

  const totalChars = useMemo(() => {
    return text.replace(/\s+/g, '').length;
  }, [text]);

  // Mark animation complete after all letters have settled into solid text
  useEffect(() => {
    const totalDurationMs = (totalChars * stagger + duration + 0.2) * 1000;
    const timer = setTimeout(() => {
      setIsCondensed(true);
    }, totalDurationMs);

    return () => clearTimeout(timer);
  }, [totalChars, stagger, duration]);

  let charCounter = 0;

  return (
    <Component
      className={`w-full max-w-4xl mx-auto flex flex-wrap justify-center items-baseline gap-x-[0.26em] select-none ${className}`}
      style={{ color: textColor }}
    >
      {words.map((chars, wordIndex) => (
        <span
          key={`w-${wordIndex}`}
          className="inline-flex whitespace-nowrap overflow-visible"
        >
          {chars.map((char) => {
            const charIndex = charCounter++;
            const delay = (charIndex * stagger).toFixed(3);

            return (
              <span
                key={`c-${charIndex}`}
                className="inline-block"
                style={
                  isCondensed
                    ? {
                        color: textColor,
                        opacity: 1,
                        filter: 'none',
                        transform: 'none',
                      }
                    : {
                        color: textColor,
                        animation: `smokeCondenseLetter ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both`,
                        '--smoke-color': smokeColor,
                        '--smoke-rise': `${rise}px`,
                        '--smoke-softness': `${softness}px`,
                        willChange: 'transform, opacity, filter',
                      }
                }
              >
                {char}
              </span>
            );
          })}
        </span>
      ))}

      {/* Embedded keyframe for initial one-shot smoke condensation */}
      <style>{`
        @keyframes smokeCondenseLetter {
          0% {
            opacity: 0;
            filter: blur(var(--smoke-softness, 10px));
            transform: translateY(var(--smoke-rise, 18px)) scale(1.08);
            color: var(--smoke-color, rgba(188, 195, 255, 0.65));
          }
          45% {
            opacity: 0.65;
            filter: blur(calc(var(--smoke-softness, 10px) * 0.4));
            transform: translateY(calc(var(--smoke-rise, 18px) * 0.25)) scale(1.02);
            color: var(--smoke-color, rgba(188, 195, 255, 0.65));
          }
          85% {
            opacity: 0.95;
            filter: blur(0.5px);
            transform: translateY(0px) scale(1);
          }
          100% {
            opacity: 1;
            filter: blur(0px);
            transform: translateY(0px) scale(1);
            color: inherit;
          }
        }
      `}</style>
    </Component>
  );
}

export default SmokeType;
