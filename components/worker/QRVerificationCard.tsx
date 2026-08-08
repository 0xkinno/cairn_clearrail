"use client";

import { QRCodeSVG } from "qrcode.react";

interface QRVerificationCardProps {
  workerId: string;
  fullName: string;
  trade: string | null;
  safetyScore: number;
}

export function QRVerificationCard({ workerId, fullName, trade, safetyScore }: QRVerificationCardProps) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify/${workerId}`;

  return (
    <div className="bg-[var(--color-bg-inverse)] text-[var(--color-text-inverse)] p-8 flex flex-col items-center gap-6 max-w-sm">
      <div className="bg-white p-4">
        <QRCodeSVG value={verifyUrl} size={160} />
      </div>
      <div className="text-center">
        <p className="text-heading-sm">{fullName}</p>
        {trade && <p className="text-body-sm text-[var(--color-text-inverse-secondary)]">{trade}</p>}
      </div>
      <div className="text-center">
        <p className="text-stat">{Number(safetyScore ?? 50).toFixed(0)}</p>
        <p className="text-mono-sm text-[var(--color-text-inverse-secondary)]">Safety Score</p>
      </div>
      <p className="text-mono-sm text-[var(--color-text-inverse-secondary)] break-all text-center">
        {verifyUrl}
      </p>
    </div>
  );
}
