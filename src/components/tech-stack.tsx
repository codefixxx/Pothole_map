import { cn } from "@/src/lib/utils";
import { ScrollTextEffect } from "./scroll-text-effects";
import ScrollAppear from "./scroll-appear-wrapper";

interface Logo {
  name: string;
  logo: string;
  className: string;
}

interface Logos8Props {
  title?: string;
  subtitle?: string;
  logos?: Logo[];
  className?: string;
}

const Logos = ({
  title = "Built With The Best Tools",
  subtitle = "Our tech stack is carefully chosen to ensure reliability, scalability, and performance.",
  logos = [
    {
      name: "Next.js",
      logo: "/logo/Nextjs.svg",
      className: "h-8 w-auto dark:invert",
    },
    {
      name: "React",
      logo: "/logo/React.svg",
      className: "h-8 w-auto",
    },
    {
      name: "Shadcn UI",
      logo: "/logo/Shadcnui.svg",
      className: "h-8 w-auto dark:invert",
    },
    {
      name: "PostgreSQL",
      logo: "/logo/Postgresql.svg",
      className: "h-8 w-auto",
    },
    {
      name: "TypeScript",
      logo: "/logo/Typescript.svg",
      className: "h-8 w-auto",
    },
    {
      name: "Leaflet",
      logo: "/logo/Leaflet.svg",
      className: "h-8 w-auto",
    },
    {
      name: "WebSocket",
      logo: "/logo/Websocket.svg",
      className: "h-8 w-auto",
    },
  ],
  className,
}: Logos8Props) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <div className="flex flex-col items-center text-center">
          <ScrollTextEffect
            per="char"
            as="h2"
            className="text-3xl font-bold"
          >
            {title}
          </ScrollTextEffect>
          <ScrollTextEffect
            as="p"
            per="line"
            className="mt-1 text-muted-foreground">{subtitle}
          </ScrollTextEffect>
          <ScrollAppear className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-6 lg:gap-12" >
            {logos.map((logo, index) => (
              <img
                key={index}
                src={logo.logo}
                alt={`${logo.name} logo`}
                width={109}
                height={48}
                className={cn(
                  logo.className,
                  "transform transition-all duration-500 ease-out hover:scale-150"
                )}
              />
            ))}
          </ScrollAppear>
        </div>
      </div>
    </section>
  );
};

export { Logos };