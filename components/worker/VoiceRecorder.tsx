"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

interface VoiceRecorderProps {
  language?: string;
  onTranscript: (transcript: string) => void;
}

const LANGUAGE_TO_BCP47: Record<string, string> = {
  en: "en-US",
  ms: "ms-MY",
  th: "th-TH",
  vi: "vi-VN",
};

export function VoiceRecorder({ language = "en", onTranscript }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = LANGUAGE_TO_BCP47[language] || "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalText = "";
      for (let i = 0; i < event.results.length; i++) {
        finalText += event.results[i][0].transcript;
      }
      setTranscript(finalText);
      onTranscript(finalText);
    };
    recognition.onend = () => setRecording(false);
    recognition.onerror = () => setRecording(false);

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  function toggleRecording() {
    if (!recognitionRef.current) return;
    if (recording) {
      recognitionRef.current.stop();
      setRecording(false);
    } else {
      setTranscript("");
      recognitionRef.current.start();
      setRecording(true);
    }
  }

  if (!supported) {
    return (
      <p className="text-body-sm text-[var(--color-text-tertiary)]">
        Voice notes aren&apos;t supported in this browser.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Button type="button" variant={recording ? "primary" : "secondary"} onClick={toggleRecording}>
        {recording ? "Stop recording" : "Record voice note"}
      </Button>
      {transcript && (
        <p className="text-body-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] p-4">
          {transcript}
        </p>
      )}
    </div>
  );
}
