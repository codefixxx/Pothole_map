import {
    HeroSection,
    WhyItMatters,
    HowItWorks,
    Features,
    StatsSection,
    Logos,
    CallToAction,
} from '@/src/components/landing';
import { InteractiveShowcase } from '@/src/components/landing/interactive-showcase';
import { Footer } from '@/src/components/layout';

export default function Home() {
    return (
        <>
            <HeroSection />
            <WhyItMatters />
            <InteractiveShowcase />
            <HowItWorks />
            <Features />
            <StatsSection />
            <Logos />
            <CallToAction />
            <Footer />
        </>
    );
}
