import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { supabase } from "@/lib/supabase";
import { generateEmbeddings } from "@/lib/embeddings";

export async function POST(req: NextRequest) {
  try {
    // 1. Get the file from the request
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Please upload a PDF file" },
        { status: 400 }
      );
    }

    // 2. Parse PDF → raw text
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await pdf(buffer);

    if (!parsed.text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from this PDF" },
        { status: 422 }
      );
    }

    // 3. Chunk the text
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await splitter.createDocuments([parsed.text]);

    // 4. Generate embeddings for all chunks
    const chunkTexts = chunks.map((chunk) => chunk.pageContent);
    const embeddings = await generateEmbeddings(chunkTexts);

    // 5. Insert the parent document record
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        name: file.name,
        mime_type: file.type,
        file_size: file.size,
        metadata: {
          total_pages: parsed.numpages,
          total_chunks: chunks.length,
        },
      })
      .select("id")
      .single();

    if (docError) throw docError;

    // 6. Insert all chunks with their embeddings
    const chunkRows = chunks.map((chunk, i) => ({
      document_id: doc.id,
      content: chunk.pageContent,
      chunk_index: i,
      embedding: JSON.stringify(embeddings[i]),
      metadata: {
        char_start: chunk.metadata?.loc?.lines?.from ?? null,
        char_end: chunk.metadata?.loc?.lines?.to ?? null,
      },
    }));

    // Supabase has a row limit per insert — batch in groups of 500
    const BATCH_SIZE = 500;
    for (let i = 0; i < chunkRows.length; i += BATCH_SIZE) {
      const batch = chunkRows.slice(i, i + BATCH_SIZE);
      const { error: chunkError } = await supabase
        .from("document_chunks")
        .insert(batch);

      if (chunkError) throw chunkError;
    }

    return NextResponse.json({
      success: true,
      document_id: doc.id,
      chunks_stored: chunks.length,
      total_pages: parsed.numpages,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 }
    );
  }
}
