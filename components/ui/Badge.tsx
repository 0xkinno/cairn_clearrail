import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type BadgeStatus = "safe" | "warning" | "critical" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status?: BadgeStatus;
}

const statusClass: Record<BadgeStatus, string> = {
  safe: "badge-safe",
  warning: "badge-warning",
  critical: "badge-critical",
  info: "bg-[var(--color-status-info-bg)] text-[var(--color-status-info)]",
};

export function Badge({ status = "info", className, ...props }: BadgeProps) {
  return <span className={cn("badge", statusClass[status], className)} {...props} />;
}
