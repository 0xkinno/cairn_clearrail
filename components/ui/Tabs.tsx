"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

export interface TabItem {
  label: string;
  value: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultValue?: string;
  className?: string;
}

export function Tabs({ tabs, defaultValue, className }: TabsProps) {
  const [active, setActive] = useState(defaultValue || tabs[0]?.value);
  const activeTab = tabs.find((t) => t.value === active);

  return (
    <div className={className}>
      <div className="flex gap-6 border-b border-[var(--color-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActive(tab.value)}
            className={cn(
              "text-mono-md pb-3 -mb-px border-b-2 transition-colors duration-200",
              tab.value === active
                ? "border-[var(--color-accent)] text-[var(--color-text-primary)]"
                : "border-transparent text-[var(--color-text-tertiary)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-6">{activeTab?.content}</div>
    </div>
  );
}
