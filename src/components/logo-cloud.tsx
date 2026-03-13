import { InfiniteSlider } from '@/src/components/motion-primitives/infinite-slider';
import { ProgressiveBlur } from '@/src/components/motion-primitives/progressive-blur';
import ScrollAppear from './scroll-appear-wrapper';

const logos = [
    {
        src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Nvidia_Logo.svg/640px-Nvidia_Logo.svg.png',
        alt: 'Nvidia Logo',
    },
    {
        src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/React_Logo_SVG.svg/640px-React_Logo_SVG.svg.png',
        alt: 'React Logo',
    },
    {
        src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Octicons-mark-github.svg/640px-Octicons-mark-github.svg.png',
        alt: 'GitHub Logo',
        className: 'dark:invert',
    },
    {
        src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/640px-Logo_NIKE.svg.png',
        alt: 'Nike Logo',
    },
    {
        src: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg',
        alt: 'Typescript Logo',
    },
    {
        src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/LaravelLogo.png/640px-LaravelLogo.png',
        alt: 'Laravel Logo',
    },
    {
        src: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Lilly-Logo.svg',
        alt: 'Lilly Logo',
    },
    {
        src: 'https://www.svgrepo.com/show/306500/openai.svg',
        alt: 'OpenAI Logo',
        className: 'dark:invert',
    },
];

export const LogoCloud = () => {
    return (
        <ScrollAppear className="bg-background pb-16">
            <div className="group relative m-auto max-w-6xl px-6">
                <div className="flex flex-col items-center md:flex-row">
                    <div className="inline md:max-w-44 md:border-r md:pr-6">
                        <p className="text-end text-sm">
                            Supported by the organizations
                        </p>
                    </div>

                    <div className="relative py-6 md:w-[calc(100%-11rem)]">
                        <InfiniteSlider speedOnHover={120} speed={60} gap={112}>
                            {logos.map((logo, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-center"
                                >
                                    <img
                                        src={logo.src}
                                        alt={logo.alt}
                                        className={`h-10 w-auto opacity-70 hover:opacity-100 transition ${logo.className || ''}`}
                                    />
                                </div>
                            ))}
                        </InfiniteSlider>

                        <div className="bg-linear-to-r from-background absolute inset-y-0 left-0 w-20"></div>
                        <div className="bg-linear-to-l from-background absolute inset-y-0 right-0 w-20"></div>

                        <ProgressiveBlur
                            className="pointer-events-none absolute left-0 top-0 h-full w-20"
                            direction="left"
                            blurIntensity={1}
                        />

                        <ProgressiveBlur
                            className="pointer-events-none absolute right-0 top-0 h-full w-20"
                            direction="right"
                            blurIntensity={1}
                        />
                    </div>
                </div>
            </div>
        </ScrollAppear>
    );
};
