'use client';

import { useInView } from 'framer-motion';
import { TextEffect } from '@/src/components/motion-primitives/text-effect';
import { useRef } from 'react';

interface ScrollTextEffectProps {
    children: string;
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
    per?: 'word' | 'char' | 'line';
    className?: string;
}

export function ScrollTextEffect({
    children,
    as = 'h3',
    per = 'word',
    className,
}: ScrollTextEffectProps) {
    const ref = useRef(null);

    const isInView = useInView(ref, { once: true, margin: '150px' });

    return (
        <div ref={ref}>
            {isInView && (
                <TextEffect
                    per={per}
                    as={as}
                    preset="fade-in-blur"
                    speedSegment={0.5}
                    delay={0.5}
                    className={className}
                >
                    {children}
                </TextEffect>
            )}
        </div>
    );
}
