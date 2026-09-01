import { ITextChunker } from '../../application/cv/cv-ingestion.service';

export interface ChunkerConfig {
  maxTokens?: number;
  overlapTokens?: number;
}

const DEFAULT_MAX_TOKENS = 512;
const DEFAULT_OVERLAP_TOKENS = 50;

/** Splits text into overlapping token-level chunks for embedding. */
export class TextChunkerService implements ITextChunker {
  private readonly maxTokens: number;
  private readonly overlapTokens: number;

  constructor(config?: ChunkerConfig) {
    this.maxTokens = config?.maxTokens ?? DEFAULT_MAX_TOKENS;
    this.overlapTokens = config?.overlapTokens ?? DEFAULT_OVERLAP_TOKENS;
  }

  /**
   * Splits text into chunks of up to maxTokens with overlapTokens overlap.
   * Tokenisation uses a whitespace-based heuristic.
   * @param text The raw text to chunk.
   * @returns Array of text chunks.
   */
  chunk(text: string): string[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const tokens = text.split(/\s+/).filter((t) => t.length > 0);

    if (tokens.length <= this.maxTokens) {
      return [tokens.join(' ')];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < tokens.length) {
      const end = Math.min(start + this.maxTokens, tokens.length);
      chunks.push(tokens.slice(start, end).join(' '));

      if (end >= tokens.length) {
        break;
      }

      start += this.maxTokens - this.overlapTokens;
    }

    return chunks;
  }
}