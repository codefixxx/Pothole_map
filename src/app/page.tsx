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
import { getHomepageStats } from '@/src/services/stats.service';

export default async function Home() {
    const stats = await getHomepageStats();

    return (
        <>
            <HeroSection />
            <WhyItMatters />
            <InteractiveShowcase />
            <HowItWorks />
            <Features />
            <StatsSection initialStats={stats} />
            <Logos />
            <CallToAction />
            <Footer />
        </>
    );
}
