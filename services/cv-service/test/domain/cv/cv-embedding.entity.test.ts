import { describe, it, expect } from 'vitest';
import { CvEmbedding } from '../../../src/domain/cv/cv-embedding.entity';

describe('CvEmbedding', () => {
  const baseData = {
    cvId: 'cv-1',
    chunkText: 'John is a React developer with 5 years experience.',
    chunkIndex: 0,
    embedding: [0.1, 0.2, 0.3, 0.4],
  };

  it('creates an embedding with all fields', () => {
    const emb = CvEmbedding.create(baseData);

    expect(emb.id).toBeDefined();
    expect(emb.cvId).toBe('cv-1');
    expect(emb.chunkText).toBe('John is a React developer with 5 years experience.');
    expect(emb.chunkIndex).toBe(0);
    expect(emb.embedding).toEqual([0.1, 0.2, 0.3, 0.4]);
    expect(emb.createdAt).toBeInstanceOf(Date);
  });

  it('embedding returns a defensive copy', () => {
    const emb = CvEmbedding.create(baseData);
    const vec = emb.embedding;
    vec.push(0.5);
    expect(emb.embedding).toEqual([0.1, 0.2, 0.3, 0.4]);
  });

  it('constructs with an explicit id', () => {
    const emb = new CvEmbedding(
      { ...baseData, createdAt: new Date() },
      'emb-id'
    );

    expect(emb.id).toBe('emb-id');
  });

  it('entity equals compares by id', () => {
    const emb1 = CvEmbedding.create(baseData);
    const emb2 = CvEmbedding.create(baseData);

    expect(emb1.equals(emb2)).toBe(false);
    expect(emb1.equals(emb1)).toBe(true);
  });
});