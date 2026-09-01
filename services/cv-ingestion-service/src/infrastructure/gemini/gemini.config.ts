export interface GeminiConfig {
  apiKey: string;
  model: string;
  embeddingModel: string;
  embeddingDimensions: number;
}

export function loadGeminiConfig(): GeminiConfig {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  const configuredEmbeddingModel = process.env.GEMINI_EMBEDDING_MODEL?.trim();
  const embeddingModel = configuredEmbeddingModel || 'gemini-embedding-001';

  return {
    apiKey,
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    embeddingModel,
    embeddingDimensions: 3072,
  };
}