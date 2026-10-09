"use client";

import { useId, type ReactElement } from "react";
import { CircleHelp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function TooltipHint({
  children,
  content,
  side = "top",
}: {
  children: ReactElement;
  content: string;
  side?: "top" | "right" | "bottom" | "left";
}) {
  const descriptionId = useId();
  return (
    <Tooltip>
      <TooltipTrigger render={children} aria-describedby={descriptionId} />
      <TooltipContent id={descriptionId} side={side}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

export function HelpTooltip({
  label,
  content,
}: {
  label: string;
  content: string;
}) {
  return (
    <TooltipHint content={content}>
      <button
        type="button"
        aria-label={`Ajuda: ${label}`}
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CircleHelp className="size-4" aria-hidden="true" />
      </button>
    </TooltipHint>
  );
}
