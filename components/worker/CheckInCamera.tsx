"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

interface CheckInCameraProps {
  onCapture: (file: File, base64: string) => void;
}

export function CheckInCamera({ onCapture }: CheckInCameraProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
      onCapture(file, result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Captured worksite photo"
          className="w-full aspect-video object-cover"
        />
      ) : (
        <div className="w-full aspect-video bg-[var(--color-bg-secondary)] flex items-center justify-center">
          <p className="text-body-sm text-[var(--color-text-tertiary)]">No photo yet</p>
        </div>
      )}
      <Button
        type="button"
        variant={preview ? "secondary" : "primary"}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? "Retake photo" : "Take photo"}
      </Button>
    </div>
  );
}
