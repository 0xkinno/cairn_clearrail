import { Badge } from "@/components/ui/Badge";
import type { CredentialRow } from "@/lib/supabase/types";

const STATUS_BADGE: Record<string, "safe" | "warning" | "critical" | "info"> = {
  active: "safe",
  revoked: "critical",
};

export function CredentialTimeline({ credentials }: { credentials: CredentialRow[] }) {
  return (
    <div className="flex flex-col gap-3">
      {credentials.map((c) => (
        <div key={c.id} className="bg-[var(--color-bg-secondary)] p-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-mono-sm text-[var(--color-text-tertiary)] mb-1">{c.credential_type}</p>
            <p className="text-heading-sm">{c.title}</p>
            {c.description && <p className="text-body-sm text-[var(--color-text-secondary)] mt-1">{c.description}</p>}
            <p className="text-mono-sm text-[var(--color-text-tertiary)] mt-2">
              Issued {new Date(c.issued_at).toLocaleDateString()}
              {c.expires_at && ` · Expires ${new Date(c.expires_at).toLocaleDateString()}`}
            </p>
            {c.near_tx_hash && (
              <p className="text-mono-sm text-[var(--color-text-tertiary)] break-all mt-1">
                Arbitrum Sepolia proof: {c.near_tx_hash}
              </p>
            )}
          </div>
          <Badge status={STATUS_BADGE[c.status] || "info"}>{c.status}</Badge>
        </div>
      ))}
    </div>
  );
}
