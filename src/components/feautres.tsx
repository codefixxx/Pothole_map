import {
    MapPin,
    Navigation,
    Users,
    BarChart3,
    ShieldCheck,
    Zap,
} from 'lucide-react';
import { ScrollTextEffect } from './scroll-text-effects';
import ScrollAppear from './scroll-appear-wrapper';

export default function Features() {
    return (
        <section className="py-12 md:py-20" id="features">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
                <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12">
                    <ScrollTextEffect
                        per="char"
                        as="h2"
                        className="text-balance text-4xl font-medium lg:text-5xl"
                    >
                        Powering The future Of Road Safety
                    </ScrollTextEffect>

                    <ScrollTextEffect per="line" className="mt-4">
                        We bring together real-time reporting, intelligent
                        tracking, and community participation to transform how
                        potholes are identified and managed. Our platform helps
                        drivers stay aware on the road while enabling
                        authorities to respond faster and maintain safer
                        streets.
                    </ScrollTextEffect>
                </div>
                <ScrollAppear className="relative mx-auto grid max-w-4xl divide-x divide-y border *:p-12 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <MapPin className="size-4" />
                            <h3 className="text-sm font-medium">
                                Real-time Reporting
                            </h3>
                        </div>
                        <p className="text-sm">
                            Report potholes instantly with precise location
                            tagging.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Navigation className="size-4" />
                            <h3 className="text-sm font-medium">
                                Real-time Driving Alerts
                            </h3>
                        </div>
                        <p className="text-sm">
                            Get live pothole warnings while driving to avoid
                            hazards.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Users className="size-4" />
                            <h3 className="text-sm font-medium">
                                Community Verification
                            </h3>
                        </div>
                        <p className="text-sm">
                            Community checks help reduce false or duplicate
                            reports.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="size-4" />
                            <h3 className="text-sm font-medium">
                                Analytics Dashboard
                            </h3>
                        </div>
                        <p className="text-sm">
                            Track pothole trends and repair progress in one
                            place.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="size-4" />
                            <h3 className="text-sm font-medium">Admin Panel</h3>
                        </div>
                        <p className="text-sm">
                            Admin tools verify reports and filter fake
                            submissions.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Zap className="size-4" />
                            <h3 className="text-sm font-medium">
                                Fast & Scalable
                            </h3>
                        </div>
                        <p className="text-sm">
                            Built to perform smoothly from local to city-wide
                            scale.
                        </p>
                    </div>
                </ScrollAppear>
            </div>
        </section>
    );
}
