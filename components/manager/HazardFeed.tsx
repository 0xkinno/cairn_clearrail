"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { HazardFeedItem } from "./HazardFeedItem";
import { EmptyState } from "@/components/shared/EmptyState";
import type { HazardFlagRow } from "@/lib/supabase/types";

export function HazardFeed({ orgId, initialHazards }: { orgId: string; initialHazards: HazardFlagRow[] }) {
  const [hazards, setHazards] = useState(initialHazards);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`hazard-flags-${orgId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "hazard_flags", filter: `org_id=eq.${orgId}` },
        (payload) => {
          setHazards((prev) => [payload.new as HazardFlagRow, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId]);

  if (hazards.length === 0) {
    return (
      <EmptyState
        title="No hazards flagged"
        description="AI-detected hazards from worker check-ins will appear here in real time."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {hazards.map((h) => (
        <HazardFeedItem key={h.id} hazard={h} />
      ))}
    </div>
  );
}
