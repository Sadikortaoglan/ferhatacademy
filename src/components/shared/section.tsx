import { cn } from "@/lib/utils";

interface SectionProps {
  title?: string;
  subtitle?: string;
  dark?: boolean;
  className?: string;
  children: React.ReactNode;
  id?: string;
}

export function Section({
  title,
  subtitle,
  dark = false,
  className,
  children,
  id,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "py-16 sm:py-20 px-4",
        dark ? "section-dark" : "bg-background",
        className
      )}
    >
      <div className="max-w-7xl mx-auto">
        {(title || subtitle) && (
          <div className="mb-12 text-center">
            {title && (
              <h2
                className={cn(
                  "text-3xl sm:text-4xl font-bold tracking-tight",
                  dark ? "text-white" : "text-foreground"
                )}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                className={cn(
                  "mt-3 text-base sm:text-lg max-w-2xl mx-auto",
                  dark ? "text-white/60" : "text-muted-foreground"
                )}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
