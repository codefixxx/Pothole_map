'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface PageTransitionProps extends HTMLMotionProps<'div'> {
    children: React.ReactNode;
    className?: string;
}

export function PageTransition({ children, className, ...props }: PageTransitionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}
