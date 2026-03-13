import { Bell, ClipboardPlus, MapPin, Radar } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/src/lib/utils';
import { ScrollTextEffect } from './scroll-text-effects';
import ScrollAppear from './scroll-appear-wrapper';

interface Working {
    heading: string;
    description: string;
    icon: React.ReactNode;
}

interface Feature43Props {
    title?: string;
    workings?: Working[];
    className?: string;
}

const HowItWorks = ({
    title = 'How It Works',
    workings = [
        {
            heading: 'Spot',
            description: 'Identify a pothole and capture its exact location.',
            icon: <MapPin className="size-6" aria-hidden />,
        },
        {
            heading: 'Report',
            description: 'Upload photos and details to submit the report.',
            icon: <ClipboardPlus className="size-6" aria-hidden />,
        },
        {
            heading: 'Analyze',
            description: 'System verifies the report and maps the pothole.',
            icon: <Radar className="size-6" aria-hidden />,
        },
        {
            heading: 'Act',
            description: 'Authorities review and prioritize necessary repairs.',
            icon: <Bell className="size-6" aria-hidden />,
        },
    ],
    className,
}: Feature43Props) => {
    return (
        <section
            className={cn(
                'bg-zinc-50 py-16 md:py-32 dark:bg-transparent ',
                className,
            )}
            id="solution"
        >
            <div className="mx-auto max-w-5xl px-6">
                {title && (
                    <div className="text-center">
                        <ScrollTextEffect
                            as="h2"
                            per="char"
                            className="text-balance text-4xl font-semibold lg:text-5xl"
                        >
                            {title}
                        </ScrollTextEffect>
                    </div>
                )}
                <ScrollAppear className="mt-8 grid gap-6 md:mt-16 sm:grid-cols-2 lg:grid-cols-4">
                    {workings.map((working, i) => (
                        <div key={i} className="text-center">
                            <div className="mb-4 flex mx-auto size-36 items-center justify-center">
                                <CardDecorator>{working.icon}</CardDecorator>
                            </div>

                            <h3 className="mb-2 font-medium">
                                {working.heading}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {working.description}
                            </p>
                        </div>
                    ))}
                </ScrollAppear>
            </div>
        </section>
    );
};

export { HowItWorks };

const CardDecorator = ({ children }: { children: ReactNode }) => (
    <div className="mask-radial-from-40% mask-radial-to-60% relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-zinc-950)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-zinc-950)20%,transparent)] dark:[--color-border:color-mix(in_oklab,var(--color-white)15%,transparent)] dark:group-hover:[--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)]">
        <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px] dark:opacity-50"
        />

        <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t">
            {children}
        </div>
    </div>
);
