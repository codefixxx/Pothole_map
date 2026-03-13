import { Instagram, Github } from 'lucide-react';
import { Separator } from '@/src/components/ui/separator';
import { Logo } from '@/src/components/logo';
import Link from 'next/link';

const Footer = () => {
    return (
        <>
            <footer>
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 max-md:flex-col sm:px-6 sm:py-6 md:gap-6 md:py-8">
                    <Link href="/">
                        <div className="flex items-center gap-3">
                            <Logo className="gap-3 h-8" />
                        </div>
                    </Link>

                    <div className="flex items-center gap-5 whitespace-nowrap">
                        <Link
                            href="#features"
                            className="opacity-80 transition-opacity duration-300 hover:opacity-100"
                        >
                            features
                        </Link>
                        <Link
                            href="#"
                            className="opacity-80 transition-opacity duration-300 hover:opacity-100"
                        >
                            solution
                        </Link>
                        <Link
                            href="#stats"
                            className="opacity-80 transition-opacity duration-300 hover:opacity-100"
                        >
                            Stats
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="https://www.instagram.com/general_munchk1n_man/">
                            <Instagram className="size-5" />
                        </Link>

                        <Link href="https://github.com/codefixxx">
                            <Github className="size-5" />
                        </Link>
                    </div>
                </div>

                <Separator />

                <div className="mx-auto flex max-w-7xl justify-center px-4 py-8 sm:px-6">
                    <p className="text-center font-medium text-balance">
                        {`©${new Date().getFullYear()}`}{' '}
                        <Link href="#" className="hover:underline">
                            Pothole Map
                        </Link>
                        , Made with ❤️.
                    </p>
                </div>
            </footer>
        </>
    );
};

export default Footer;
