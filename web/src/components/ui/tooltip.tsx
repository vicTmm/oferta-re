"use client";

import { Tooltip as Primitive } from "@base-ui/react/tooltip";
import { cn } from "@/lib/utils";

export function TooltipProvider(props: Primitive.Provider.Props) {
  return <Primitive.Provider delay={250} closeDelay={100} {...props} />;
}
export const Tooltip = Primitive.Root;
export const TooltipTrigger = Primitive.Trigger;
export function TooltipContent({
  children,
  id,
  className,
  side = "top",
  sideOffset = 8,
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
  side?: Primitive.Positioner.Props["side"];
  sideOffset?: number;
}) {
  return (
    <Primitive.Portal>
      <Primitive.Positioner
        side={side}
        sideOffset={sideOffset}
        className="z-50"
      >
        <Primitive.Popup
          id={id}
          role="tooltip"
          className={cn(
            "max-w-[min(18rem,calc(100vw-2rem))] rounded-lg bg-foreground px-3 py-2 text-xs leading-relaxed text-background shadow-lg outline-none",
            className,
          )}
        >
          {children}
        </Primitive.Popup>
      </Primitive.Positioner>
    </Primitive.Portal>
  );
}
