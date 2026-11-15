import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

let lenisInstance = null;

export const getLenis = () => lenisInstance;

export const useLenis = ({ isModalOpen = false, currentStep = 1 } = {}) => {
  const lenisRef = useRef(null);

  useEffect(() => {
    // Initialize Lenis with production-grade settings
    const lenis = new Lenis({
      autoRaf: true,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      infinite: false,
      autoToggle: true,
      allowNestedScroll: true,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // exponential easing
    });

    lenisRef.current = lenis;
    lenisInstance = lenis;

    return () => {
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);

  // Pause page smooth scroll when a modal is open to avoid background movement
  useEffect(() => {
    if (!lenisRef.current) return;
    if (isModalOpen) {
      lenisRef.current.stop();
    } else {
      lenisRef.current.start();
    }
  }, [isModalOpen]);

  // Scroll to top smoothly when navigating between ETL pipeline steps
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: false, duration: 0.8 });
    }
  }, [currentStep]);

  return lenisRef.current;
};
