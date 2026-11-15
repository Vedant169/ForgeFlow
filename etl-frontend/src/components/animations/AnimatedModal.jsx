import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * Animate-UI: AnimatedModal
 * Fluid spring-animated modal overlay and dialog frame.
 */
export const AnimatedModal = ({ isOpen, onClose, children, maxWidth = '900px' }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="modal-content"
            data-lenis-prevent
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth }}
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300,
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
