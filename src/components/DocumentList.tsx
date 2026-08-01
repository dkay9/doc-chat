"use client";

interface Document {
  document_id: number;
  name: string;
  chunks_stored: number;
  total_pages: number;
}

interface DocumentListProps {
  documents: Document[];
}

export default function DocumentList({ documents }: DocumentListProps) {
  if (documents.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium tracking-wider uppercase text-[var(--text-muted)] px-1">
        Documents
      </span>
      {documents.map((doc) => (
        <div
          key={doc.document_id}
          className="flex items-start gap-2.5 rounded-md px-2.5 py-2 bg-[var(--bg-tertiary)] border border-[var(--border)]"
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
              {doc.total_pages} pages · {doc.chunks_stored} chunks
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
