"use client";

import { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
  };

  return (
    <div className="relative flex items-end gap-2 rounded-xl border border-(--border-light) bg-(--bg-tertiary) px-3 py-2 focus-within:border-(--accent) transition-colors">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="Ask about your document..."
        rows={1}
        disabled={disabled}
        className="flex-1 bg-transparent text-sm text-(--text-primary) placeholder-(--text-muted) resize-none outline-none leading-relaxed disabled:opacity-40"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !input.trim()}
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
          bg-(--accent) text-white
          disabled:opacity-30 disabled:cursor-not-allowed
          hover:bg-(--accent-hover) transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      </button>
    </div>
  );
}
