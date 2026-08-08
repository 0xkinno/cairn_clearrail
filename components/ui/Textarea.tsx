import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full text-left">
        {label && (
          <label htmlFor={textareaId} className="text-mono-sm font-semibold text-[var(--color-text-secondary)] uppercase text-[10px] tracking-wider">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            "w-full bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-body-md",
            "border border-[var(--color-border)] rounded-xl px-4 py-3 min-h-28 resize-y",
            "placeholder:text-[var(--color-text-tertiary)]",
            "focus:outline-none focus:border-[var(--color-accent)] transition-colors duration-200",
            error && "border-[var(--color-status-critical)]",
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-[11px] text-[var(--color-status-critical)]">{error}</span>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
