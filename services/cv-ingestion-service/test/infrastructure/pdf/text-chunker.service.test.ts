import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TextChunkerService } from '../../../src/infrastructure/pdf/text-chunker.service';

describe('TextChunkerService', () => {
  it('returns empty array for empty text', () => {
    const chunker = new TextChunkerService();
    expect(chunker.chunk('')).toEqual([]);
    expect(chunker.chunk('   ')).toEqual([]);
  });

  it('returns single chunk when text fits in maxTokens', () => {
    const chunker = new TextChunkerService({ maxTokens: 512, overlapTokens: 50 });
    const text = 'This is a short text with ten words exactly here for testing purposes.';
    const result = chunker.chunk(text);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(text);
  });

  it('splits text into multiple chunks that fully cover the source', () => {
    const chunker = new TextChunkerService({ maxTokens: 5, overlapTokens: 1 });
    const tokens = Array.from({ length: 12 }, (_, i) => `word${i}`);
    const text = tokens.join(' ');
    const result = chunker.chunk(text);

    expect(result.length).toBeGreaterThan(1);

    const allTokens = result.join(' ').split(/\s+/);
    for (const token of tokens) {
      expect(allTokens).toContain(token);
    }
    expect(allTokens[0]).toBe('word0');
    expect(allTokens[allTokens.length - 1]).toBe('word11');
  });

  it('each chunk respects maxTokens limit', () => {
    const maxTokens = 3;
    const chunker = new TextChunkerService({ maxTokens, overlapTokens: 1 });
    const text = 'a b c d e f g h i j';
    const result = chunker.chunk(text);

    for (const chunk of result) {
      const tokenCount = chunk.split(/\s+/).filter((t) => t.length > 0).length;
      expect(tokenCount).toBeLessThanOrEqual(maxTokens);
    }
  });

  it('overlap is applied between consecutive chunks', () => {
    const chunker = new TextChunkerService({ maxTokens: 4, overlapTokens: 2 });
    const text = 'a b c d e f g h';
    const result = chunker.chunk(text);

    expect(result.length).toBeGreaterThan(1);

    const chunk1Tokens = result[0].split(/\s+/);
    const chunk2Tokens = result[1].split(/\s+/);

    const overlap = chunk1Tokens.slice(-2);
    expect(chunk2Tokens.slice(0, 2)).toEqual(overlap);
  });

  it('handles single token text', () => {
    const chunker = new TextChunkerService({ maxTokens: 10, overlapTokens: 5 });
    const result = chunker.chunk('hello');

    expect(result).toEqual(['hello']);
  });

  it('uses default config when none provided', () => {
    const chunker = new TextChunkerService();
    const text = 'word '.repeat(600).trim();
    const result = chunker.chunk(text);

    expect(result.length).toBeGreaterThan(1);
  });
});