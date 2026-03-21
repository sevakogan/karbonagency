// iOS-accurate spring physics and timing curves

// === SPRINGS ===
export const springDefault = { type: 'spring' as const, stiffness: 400, damping: 35 };
export const springGentle = { type: 'spring' as const, stiffness: 250, damping: 28 };
export const springBouncy = { type: 'spring' as const, stiffness: 500, damping: 25 };
export const springHeavy = { type: 'spring' as const, stiffness: 300, damping: 40 };

// === EASE ===
export const easeIOS = [0.25, 0.46, 0.45, 0.94] as const;

// === PAGE TRANSITIONS ===
export const pageVariants = {
  initial: { opacity: 0, y: 8, filter: 'blur(4px)' },
  animate: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.25, ease: [...easeIOS] }
  },
  exit: {
    opacity: 0, y: -4, filter: 'blur(2px)',
    transition: { duration: 0.15, ease: [...easeIOS] }
  }
};

// === BOTTOM SHEET ===
export const sheetVariants = {
  hidden: { y: '100%' },
  visible: { y: 0, transition: springHeavy },
  exit: { y: '100%', transition: { duration: 0.25, ease: [...easeIOS] } }
};

export const sheetOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

// === CARDS ===
export const cardHover = { scale: 1.01, transition: { duration: 0.2 } };
export const cardTap = { scale: 0.97, transition: { duration: 0.1 } };

// === STAGGER ===
export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 12, filter: 'blur(4px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: springGentle
  }
};

// === EXPAND/COLLAPSE ===
export const expandVariants = {
  collapsed: { height: 0, opacity: 0, transition: { duration: 0.2, ease: [...easeIOS] } },
  expanded: { height: 'auto', opacity: 1, transition: springGentle }
};

// === SLIDE-IN NOTIFICATION ===
export const slideInRight = {
  hidden: { x: 100, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: springDefault },
  exit: { x: 100, opacity: 0, transition: { duration: 0.2 } }
};

// === WIZARD STEP TRANSITIONS ===
export const wizardStepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: springDefault
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    transition: { duration: 0.2, ease: [...easeIOS] }
  })
};

// === PULSE (syncing status) ===
export const pulseAnimation = {
  scale: [1, 1.15, 1],
  opacity: [1, 0.6, 1],
  transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const }
};
