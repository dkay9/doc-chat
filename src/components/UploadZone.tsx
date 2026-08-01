"use client";

import { useState, useCallback, useRef } from "react";

interface UploadZoneProps {
  onUploadComplete: (doc: {
    document_id: number;
    name: string;
    chunks_stored: number;
    total_pages: number;
  }) => void;
}

export default function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        setError("Only PDF files are supported");
        return;
      }

      setUploading(true);
      setError("");
      setProgress("Extracting text...");

      try {
        const formData = new FormData();
        formData.append("file", file);

        setProgress("Chunking & embedding...");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const data = await res.json();
        setProgress("");
        onUploadComplete({ ...data, name: file.name });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setProgress("");
      } finally {
        setUploading(false);
      }
    },
    [onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`
        relative rounded-lg border border-dashed p-6 text-center cursor-pointer
        transition-all duration-150
        ${
          dragActive
            ? "drag-active border-(--accent) bg-(--accent-muted)"
            : "border-(--border-light) hover:border-(--text-muted) hover:bg-(--bg-tertiary)"
        }
        ${uploading ? "pointer-events-none opacity-60" : ""}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />

      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-(--text-secondary)">{progress}</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-(--text-muted)"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div>
            <span className="text-sm text-(--text-secondary)">
              Drop a PDF here or{" "}
              <span className="text-(--accent) font-medium">browse</span>
            </span>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-(--error)">{error}</p>
      )}
    </div>
  );
}
