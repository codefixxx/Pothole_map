import { ThemeProvider } from '@/src/components/theme-provider';
import './globals.css';
import { Toaster } from '@/src/components/ui/sonner';

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
                        {children}
                        <Toaster position="bottom-right" richColors />
                    </ThemeProvider>
                </body>
            </html>
        </>
    );
}
