"use client";

import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { cn } from "@/lib/utils/cn";

type ToastVariant = "safe" | "warning" | "critical" | "info";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantClass: Record<ToastVariant, string> = {
  safe: "bg-[var(--color-status-safe-bg)] text-[var(--color-status-safe)]",
  warning: "bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning)]",
  critical: "bg-[var(--color-status-critical-bg)] text-[var(--color-status-critical)]",
  info: "bg-[var(--color-status-info-bg)] text-[var(--color-status-info)]",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "text-body-sm font-medium px-4 py-3 rounded-lg shadow-lg",
              variantClass[t.variant]
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
