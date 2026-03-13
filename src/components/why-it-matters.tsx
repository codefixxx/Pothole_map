import { Card, CardContent, CardHeader } from '@/src/components/ui/card'
import { Car, TriangleAlert, Snail } from 'lucide-react'
import { ReactNode } from 'react'
import { BorderTrail } from './motion-primitives/border-trail'
import { Tilt } from './motion-primitives/tilt'
import { ScrollTextEffect } from './scroll-text-effects'
import ScrollAppear from './scroll-appear-wrapper'

const items = [
    {
        icon: Car,
        title: "Vehicle Damage",
        desc: "Thousands of vehicles are damaged yearly due to unreported potholes.",
    },
    {
        icon: TriangleAlert,
        title: "Road Accidents",
        desc: "Unreported potholes contribute to road accidents, causing injuries and fatalities.",
    },
    {
        icon: Snail,
        title: "Slow Response",
        desc: "Municipal bodies often lack real-time visibility of road issues.",
    },
]

export default function WhyItMatters() {
    return (
        <section className="bg-zinc-50 py-16 dark:bg-transparent">
            <div className="@container mx-auto max-w-5xl px-6">
                <div className="text-center">
                    <ScrollTextEffect
                        as="h2"
                        per="char"
                        className="text-balance text-4xl font-semibold lg:text-5xl">
                        Why This Matters
                    </ScrollTextEffect>
                    <ScrollTextEffect
                        as='p'
                        per="line"
                        className="mt-4">
                        Poor road conditions cause accidents, vehicle damage, and slow civic
                        response. A centralized reporting system helps authorities act
                        faster and keeps citizens informed.
                    </ScrollTextEffect>
                </div>
               
<ScrollAppear className="@min-4xl:max-w-full @min-4xl:grid-cols-3 mx-auto mt-8 grid max-w-sm gap-6 *:text-center md:mt-16">
  
    {items.map((item, index) => {
      const Icon = item.icon

      return (
        <Tilt rotationFactor={8} isRevese key={index}>
          <Card className="group relative overflow-hidden border shadow-zinc-950/5">

            <BorderTrail
              className="absolute inset-0"
              style={{
                boxShadow:
                  '0px 0px 60px 30px rgb(255 255 255 / 50%), 0 0 100px 60px rgb(0 0 0 / 50%), 0 0 140px 90px rgb(0 0 0 / 50%)',
              }}
              size={100}
            />

            <CardHeader className="pb-3 relative z-10">
              <CardDecorator>
                <Icon className="size-6" aria-hidden />
              </CardDecorator>

              <h3 className="mt-6 font-medium">{item.title}</h3>
            </CardHeader>

            <CardContent className="relative z-10">
              <p className="mt-3 text-sm">{item.desc}</p>
            </CardContent>

          </Card>
        </Tilt>
      )
    })}
</ScrollAppear>
            </div>
        </section>
    )
}

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
)