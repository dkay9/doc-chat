"use client";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export default function ChatMessage({
  role,
  content,
  isStreaming,
}: ChatMessageProps) {
  const isUser = role === "user";

  // Extract source references like "Source 1", "Source 2" from the text
  const sourceRefs = content.match(/Source \d+/gi) || [];
  const uniqueSources = [...new Set(sourceRefs)];

  return (
    <div className={`animate-in flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`
          shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium mt-0.5
          ${
            isUser
              ? "bg-[var(--accent-muted)] text-[var(--accent)]"
              : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border)]"
          }
        `}
      >
        {isUser ? "Y" : "D"}
      </div>

      {/* Message bubble */}
      <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? "items-end" : ""}`}>
        <div
          className={`
            rounded-xl px-3.5 py-2.5 text-[14px] leading-relaxed
            ${
              isUser
                ? "bg-[var(--accent)] text-white rounded-br-sm"
                : "bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border)] rounded-bl-sm"
            }
          `}
        >
          <span className={isStreaming ? "typing-cursor" : ""}>
            {content || (isStreaming ? "" : "")}
          </span>
        </div>

        {/* Source cards */}
        {!isUser && !isStreaming && uniqueSources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {uniqueSources.map((src) => (
              <span
                key={src}
                className="source-card inline-flex items-center gap-1 px-2 py-1 rounded-md
                  text-[11px] font-medium text-[var(--accent)] bg-[var(--accent-muted)]
                  border border-transparent cursor-default"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                {src}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
