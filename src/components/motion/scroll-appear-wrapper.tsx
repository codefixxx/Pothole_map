'use client';

import { useRef } from 'react';
import { useInView } from 'framer-motion';
import { AnimatedGroup } from '@/src/components/ui/animated-group';

export default function ScrollAppear({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.4 });

    const transitionVariants = {
        item: {
            hidden: {
                opacity: 0,
                filter: 'blur(12px)',
                y: 50,
            },
            visible: {
                opacity: 1,
                filter: 'blur(0px)',
                y: 0,
                transition: {
                    type: 'spring' as const,
                    bounce: 0.3,
                    duration: 3.5,
                },
            },
        },
    };

    return (
        <div ref={ref}>
            {isInView && (
                <AnimatedGroup
                    className={className}
                    variants={{
                        container: {
                            visible: {
                                transition: {
                                    staggerChildren: 0.2,
                                    delayChildren: 0.2,
                                },
                            },
                        },
                        ...transitionVariants,
                    }}
                >
                    {children}
                </AnimatedGroup>
            )}
        </div>
    );
}
