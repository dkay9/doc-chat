"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import UploadZone from "@/components/UploadZone";
import DocumentList from "@/components/DocumentList";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Doc {
  document_id: number;
  name: string;
  chunks_stored: number;
  total_pages: number;
}

export default function Home() {
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUploadComplete = useCallback((doc: Doc) => {
    setDocuments((prev) => [...prev, doc]);
  }, []);

  const handleSend = useCallback(
    async (content: string) => {
      if (isStreaming) return;

      const userMessage: Message = { role: "user", content };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setIsStreaming(true);

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newMessages }),
        });

        if (!res.ok) throw new Error("Chat request failed");

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("No response stream");

        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: accumulated,
            };
            return updated;
          });
        }
      } catch {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "Something went wrong. Make sure Ollama is running and try again.",
          };
          return updated;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming]
  );

  const hasDocuments = documents.length > 0;

  return (
    <div className="h-full flex">
      {/* Left panel */}
      <aside className="w-70 shrink-0 border-r border-(--border) bg-(--bg-secondary) flex flex-col">
        <div className="px-4 py-4 border-b border-(--border)">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-(--accent-muted) flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-(--accent)">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">DocChat</h1>
              <p className="text-[11px] text-(--text-muted)">Chat with your PDFs</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          <UploadZone onUploadComplete={handleUploadComplete} />
          <DocumentList documents={documents} />
        </div>

        <div className="px-4 py-3 border-t border-(--border)]">
          <p className="text-[11px] text-(--text-muted)">Using local embeddings · Ollama</p>
        </div>
      </aside>

      {/* Right panel */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="px-5 py-3 border-b border-(--border) flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-foreground">
              {hasDocuments
                ? `Chatting with ${documents.length} document${documents.length > 1 ? "s" : ""}`
                : "No documents uploaded"}
            </h2>
            {hasDocuments && (
              <p className="text-[11px] text-(--text-muted) mt-0.5">
                Ask anything about your uploaded PDFs
              </p>
            )}
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="text-[11px] text-(--text-muted) hover:text-(--text-secondary) px-2 py-1 rounded-md hover:bg-(--bg-tertiary) transition-colors"
            >
              Clear chat
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-sm">
                {hasDocuments ? (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-(--accent-muted) flex items-center justify-center mx-auto mb-4">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-(--accent)">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-foreground mb-1">Ready to chat</h3>
                    <p className="text-[13px] text-(--text-muted) leading-relaxed">
                      Ask a question about your document and get answers with source references.
                    </p>
                    <div className="mt-5 flex flex-col gap-2">
                      {["What is this document about?", "Summarize the key points", "What are the main conclusions?"].map((q) => (
                        <button
                          key={q}
                          onClick={() => handleSend(q)}
                          className="text-left text-[13px] text-(--text-secondary) px-3 py-2 rounded-lg border border-(--border) hover:border-(--accent) hover:text-(--accent) hover:bg-(--accent-muted) transition-all"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-(--bg-tertiary) border border-(--border) flex items-center justify-center mx-auto mb-4">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-(--text-muted)">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-foreground mb-1">Upload a document to start</h3>
                    <p className="text-[13px] text-(--text-muted) leading-relaxed">
                      Drop a PDF in the sidebar to begin chatting with it.
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 max-w-2xl mx-auto">
              {messages.map((msg, i) => (
                <ChatMessage
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  isStreaming={isStreaming && i === messages.length - 1 && msg.role === "assistant"}
                />
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-(--border)">
          <div className="max-w-2xl mx-auto">
            <ChatInput onSend={handleSend} disabled={isStreaming || !hasDocuments} />
            {!hasDocuments && (
              <p className="text-[11px] text-(--text-muted) text-center mt-2">
                Upload a document first to start chatting
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
