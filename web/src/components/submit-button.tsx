"use client";
import { useFormStatus } from "react-dom";
import { Button } from "./ui/button";
export function SubmitButton({
  children,
  disabled = false,
  className,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button className={className} type="submit" disabled={pending || disabled}>
      {pending ? "Salvando…" : children}
    </Button>
  );
}
