import Features from '@/src/components/feautres';
import HeroSection from '@/src/components/hero-section';
import { HowItWorks } from '@/src/components/how-it-works';
import StatsSection from '@/src/components/stats';
import { Logos } from '@/src/components/tech-stack';
import WhyItMatters from '@/src/components/why-it-matters';
import CallToAction from '@/src/components/cta';
import Footer from '@/src/components/footer';

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
