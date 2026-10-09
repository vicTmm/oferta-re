import Image from "next/image";
import { cn } from "@/lib/utils";
/** Recriação vetorial da referência Stitch fornecida pelo autor. */
export function Mascot({
  className,
  decorative = false,
  eager = false,
}: {
  className?: string;
  decorative?: boolean;
  eager?: boolean;
}) {
  return (
    <Image
      src="/brand/mascote.svg"
      width={380}
      height={438}
      alt={
        decorative
          ? ""
          : "Mascote do Oferta Re: robô azul com olhos verdes e símbolo de confirmação"
      }
      unoptimized
      loading={eager ? "eager" : "lazy"}
      draggable={false}
      className={cn("h-auto shrink-0 select-none", className)}
    />
  );
}
export function WelcomePanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="brand-welcome flex flex-wrap items-center justify-between gap-5 rounded-2xl border p-5 sm:p-7">
      <div className="flex max-w-xl flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground sm:text-xl">
          {title}
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </section>
  );
}
