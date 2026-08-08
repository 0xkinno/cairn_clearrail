"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

export interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  label?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Dropdown({ label, options, value, onChange, placeholder, className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className={cn("relative flex flex-col gap-1.5 w-full text-left", className)}>
      {label && (
        <label className="text-mono-sm font-semibold text-[var(--color-text-secondary)] uppercase text-[10px] tracking-wider">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-body-md text-left"
      >
        <span className={selected ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-tertiary)]"}>
          {selected ? selected.label : placeholder || "Select"}
        </span>
        <span className="text-[var(--color-text-tertiary)] text-mono-sm">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="absolute top-full z-20 mt-1 w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 text-body-md hover:bg-[var(--color-bg-secondary)] transition-colors",
                opt.value === value && "bg-[var(--color-bg-secondary)] font-bold text-[var(--color-accent)]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
