"use client";

import { useState } from "react";

interface Document {
  document_id: number;
  name: string;
  total_pages: number;
}

interface DocumentListProps {
  documents: Document[];
  onDelete: (id: number) => void;
}

export default function DocumentList({ documents, onDelete }: DocumentListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  if (documents.length === 0) return null;

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch("/api/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) onDelete(id);
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium tracking-wider uppercase text-[var(--text-muted)] px-1">
        Documents
      </span>
      {documents.map((doc) => (
        <div
          key={doc.document_id}
          className="group flex items-start gap-2.5 rounded-md px-2.5 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)]"
        >
          <div className="mt-0.5 shrink-0">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-[var(--error)]"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[var(--text-primary)] truncate font-medium">
              {doc.name}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              {doc.total_pages} pages
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(doc.document_id);
            }}
            disabled={deletingId === doc.document_id}
            className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--error-muted)]"
          >
            {deletingId === doc.document_id ? (
              <div className="w-3.5 h-3.5 border border-[var(--text-muted)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-[var(--text-muted)] hover:text-[var(--error)]"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}