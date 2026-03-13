import { BorderTrail } from "./motion-primitives/border-trail"
import { Tilt } from "./motion-primitives/tilt"
import { ScrollTextEffect } from "./scroll-text-effects"
import ScrollAppear from "./scroll-appear-wrapper"

const stats = [
    {
        value: "12000+",
        label: "Potholes reported",
    },
    {
        value: "25+",
        label: "Cities covered",
    },
    {
        value: "8500+",
        label: "Active users",
    },
]

export default function StatsSection() {
    return (
        <section className="py-12 md:py-20" id="stats">
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">

                <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center">
                    <ScrollTextEffect
                        per="char"
                        as="h2"
                        className="text-balance text-4xl font-semibold lg:text-5xl">
                        Our Stats
                    </ScrollTextEffect>

                    <ScrollTextEffect per="line" as="p">
                        We bring together real-time reporting, intelligent tracking, and
                        community participation to transform how potholes are identified and
                        managed.
                    </ScrollTextEffect>
                </div>
                <ScrollAppear className="grid gap-4 md:grid-cols-3">
                     {stats.map((stat, index) => (
                        <Tilt rotationFactor={8} isRevese key={index}>
                            <div
                                key={index}
                                className="relative overflow-hidden rounded-(--radius) border py-12 text-center"
                            >
                                {/* Border animation */}
                                <BorderTrail
                                    className="absolute inset-0"
                                    style={{
                                        boxShadow:
                                            "0px 0px 60px 30px rgb(255 255 255 / 50%), 0 0 100px 60px rgb(0 0 0 / 50%), 0 0 140px 90px rgb(0 0 0 / 50%)",
                                    }}
                                    size={100}
                                />

                                <div className="relative z-10 space-y-4">
                                    <div className="text-5xl font-bold">{stat.value}</div>
                                    <p>{stat.label}</p>
                                </div>
                            </div>
                        </Tilt>

                    ))}
                </ScrollAppear>


            </div>
        </section>
    )
}