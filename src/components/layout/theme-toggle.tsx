'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/src/components/ui/button';

export function ThemeToggle({ className }: { className?: string }) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className={`size-8 ${className}`}>
                <span className="sr-only">Toggle theme</span>
            </Button>
        );
    }

    const isDark = resolvedTheme === 'dark';

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`size-8 rounded-full border border-border/40 hover:bg-accent ${className}`}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {isDark ? (
                <Sun className="size-4 text-amber-400 transition-transform duration-200 rotate-0 hover:rotate-45" />
            ) : (
                <Moon className="size-4 text-zinc-700 transition-transform duration-200 rotate-0 hover:-rotate-12" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
