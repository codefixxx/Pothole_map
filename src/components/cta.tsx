import { Button } from '@/src/components/ui/button';
import Link from 'next/link';
import { BorderTrail } from './motion-primitives/border-trail';
import ScrollAppear from './scroll-appear-wrapper';

export default function CallToAction() {
    return (
        <section className="py-16">
            <ScrollAppear>
                <div className="mx-auto max-w-5xl rounded-3xl border px-6 py-12 md:py-20 lg:py-32 relative overflow-hidden">
                    <BorderTrail
                        className="absolute inset-0"
                        style={{
                            boxShadow:
                                '0px 0px 60px 30px rgb(255 255 255 / 50%), 0 0 100px 60px rgb(0 0 0 / 50%), 0 0 140px 90px rgb(0 0 0 / 50%)',
                        }}
                        size={100}
                    />

                    <div className="text-center space-y-6">
                        <h2 className="text-balance text-4xl font-semibold lg:text-5xl">
                            Help Make Roads Safer Today
                        </h2>

                        <p>
                            Join our community of users and help make road
                            safety a priority.
                        </p>

                        <div className="flex flex-wrap justify-center gap-4 pt-4">
                            <Button asChild size="lg">
                                <Link href="/auth/login">
                                    <span>Get Started</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </ScrollAppear>
        </section>
    );
}
