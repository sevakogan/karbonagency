'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { cardHover, cardTap } from '@/lib/animations';
import { forwardRef, type ReactNode } from 'react';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  interactive?: boolean;
  className?: string;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard({ children, interactive = false, className = '', ...props }, ref) {
    return (
      <motion.div
        ref={ref}
        className={`glass-card p-[var(--space-4)] ${className}`}
        whileHover={interactive ? cardHover : undefined}
        whileTap={interactive ? cardTap : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
