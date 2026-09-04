import { ThemeProvider } from '@/src/components/layout';
import './globals.css';
import { Toaster } from '@/src/components/ui/sonner';
import { TooltipProvider } from '@/src/components/ui/tooltip';

interface RootLayoutProps {
    children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <>
            <html
                lang="en"
                suppressHydrationWarning
                className="scroll-smooth no-scrollbar"
            >
                <head />
                <body>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <TooltipProvider delayDuration={200}>
                            {children}
                        </TooltipProvider>
                        <Toaster position="bottom-right" richColors />
                    </ThemeProvider>
                </body>
            </html>
        </>
    );
}
