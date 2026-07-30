import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

// Cache the pipeline so the model loads once, not per request
let extractor: FeatureExtractionPipeline | null = null;

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractor) {
    extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
      { dtype: "fp32" }
    );
  }
  return extractor;
}

export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const ext = await getExtractor();
  const results: number[][] = [];

  // Process one at a time to avoid memory issues
  // The model is small so this is still fast
  for (const text of texts) {
    const output = await ext(text, {
      pooling: "mean",
      normalize: true,
    });
    results.push(Array.from(output.data as Float32Array));
  }

  return results;
}