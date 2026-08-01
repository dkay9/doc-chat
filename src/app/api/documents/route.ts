import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET — list all documents
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("id, name, mime_type, file_size, metadata, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Fetch documents error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// DELETE — remove a document and its chunks (cascade handles chunks)
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Document ID required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}