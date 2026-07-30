import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  // OpenAI supports batch embedding — send all chunks at once
  // instead of one-by-one to save time and API calls
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });

  return response.data.map((item) => item.embedding);
}
