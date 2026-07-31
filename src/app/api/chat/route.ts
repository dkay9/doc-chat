import { supabase } from "@/lib/supabase";
import { generateEmbeddings } from "@/lib/embeddings";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 1. Get the latest user message
    const userMessage = messages[messages.length - 1]?.content;

    if (!userMessage) {
      return new Response("No message provided", { status: 400 });
    }

    // 2. Embed the question
    const [queryEmbedding] = await generateEmbeddings([userMessage]);

    // 3. Search for similar chunks
    const { data: chunks, error } = await supabase.rpc(
    "match_document_chunks",
    {
        query_embedding: `[${queryEmbedding.join(",")}]`,
        match_count: 5,
        match_threshold: 0.0,
    }
    );

    console.log("Chunks found:", chunks?.length ?? 0);
    console.log("RPC error:", error);

    if (error) throw error;

    // 4. Build context from retrieved chunks
    const context =
      chunks && chunks.length > 0
        ? chunks
            .map(
              (chunk: { content: string; similarity: number }, i: number) =>
                `[Source ${i + 1} (relevance: ${(chunk.similarity * 100).toFixed(0)}%)]\n${chunk.content}`
            )
            .join("\n\n")
        : "No relevant document sections found.";

    // 5. Call Ollama directly with streaming
    const ollamaResponse = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2",
        stream: true,
        messages: [
          {
            role: "system",
            content: `You are a helpful document assistant. Answer questions based on the provided document context.

Rules:
- Only answer based on the provided context. If the context doesn't contain enough information, say so.
- Reference which source(s) you're drawing from (e.g. "According to Source 1...").
- Be concise and direct.
- If the user asks something unrelated to the documents, let them know you can only answer questions about the uploaded documents.

Document context:
${context}`,
          },
          ...messages,
        ],
      }),
    });

    // 6. Transform Ollama's stream format into plain text stream
    const stream = new ReadableStream({
      async start(controller) {
        const reader = ollamaResponse.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          controller.close();
          return;
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            try {
              const json = JSON.parse(line);
              if (json.message?.content) {
                controller.enqueue(
                  new TextEncoder().encode(json.message.content)
                );
              }
            } catch {
              // skip malformed lines
            }
          }
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response("Failed to process question", { status: 500 });
  }
}