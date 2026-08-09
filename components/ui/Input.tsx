import { InputHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, rightIcon, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full text-left">
        {label && (
          <label htmlFor={inputId} className="text-mono-sm font-semibold text-[var(--color-text-secondary)] uppercase text-[10px] tracking-wider">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-body-md",
              "border border-[var(--color-border)] rounded-xl px-4 py-3",
              "placeholder:text-[var(--color-text-tertiary)]",
              "focus:outline-none focus:border-[var(--color-accent)] transition-colors duration-200",
              error && "border-[var(--color-status-critical)]",
              rightIcon && "pr-12",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <span className="text-[11px] text-[var(--color-status-critical)]">{error}</span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
