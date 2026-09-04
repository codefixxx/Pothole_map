import {
    HeroSection,
    WhyItMatters,
    HowItWorks,
    Features,
    StatsSection,
    Logos,
    CallToAction,
} from '@/src/components/landing';
import { Footer } from '@/src/components/layout';

export default function Home() {
    return (
        <>
            <HeroSection />
            <WhyItMatters />
            <HowItWorks />
            <Features />
            <StatsSection />
            <Logos />
            <CallToAction />
            <Footer />
        </>
    );
}
