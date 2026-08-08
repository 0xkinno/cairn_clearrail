import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-[var(--color-bg-secondary)] rounded-none p-6", className)}
      {...props}
    />
  );
}
