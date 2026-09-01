import { Pool } from 'pg';
import { CvEmbedding } from '../../domain/cv/cv-embedding.entity';
import { CvEntity, Education, Experience } from '../../domain/cv/cv.entity';
import { IEmbeddingRepository, SimilarChunk } from '../../domain/cv/cv.repository';

interface EmbeddingRow {
  id: string;
  cv_id: string;
  chunk_text: string;
  chunk_index: number;
  embedding: string;
  created_at: Date;
}

interface SimilarRow extends EmbeddingRow {
  similarity: number;
  cv_name: string;
  cv_email: string | null;
  cv_phone: string | null;
  cv_role: string;
  cv_summary: string | null;
  cv_photo_path: string | null;
  cv_pdf_path: string | null;
  cv_skills: string[];
  cv_education: Education[];
  cv_experience: Experience[];
  cv_created_at: Date;
}

export class EmbeddingRepositoryImpl implements IEmbeddingRepository {
  constructor(private readonly pool: Pool) {}

  async searchSimilar(vector: number[], limit: number): Promise<SimilarChunk[]> {
    const vectorStr = this.vectorToString(vector);

    const result = await this.pool.query<SimilarRow>(
      `SELECT
        e.id, e.cv_id, e.chunk_text, e.chunk_index, e.embedding, e.created_at,
        1 - (e.embedding <=> $1::vector) AS similarity,
        c.name AS cv_name, c.email AS cv_email, c.phone AS cv_phone,
        c.role AS cv_role, c.summary AS cv_summary, c.photo_path AS cv_photo_path, c.pdf_path AS cv_pdf_path,
        c.skills AS cv_skills, c.education AS cv_education, c.experience AS cv_experience,
        c.created_at AS cv_created_at
       FROM cv_embeddings e
       JOIN cvs c ON c.id = e.cv_id
       ORDER BY e.embedding <=> $1::vector
       LIMIT $2`,
      [vectorStr, limit]
    );

    return result.rows.map((row) => ({
      embedding: this.toEntity({
        id: row.id,
        cv_id: row.cv_id,
        chunk_text: row.chunk_text,
        chunk_index: row.chunk_index,
        embedding: row.embedding,
        created_at: row.created_at,
      }),
      cv: new CvEntity(
        {
          name: row.cv_name,
          email: row.cv_email ?? undefined,
          phone: row.cv_phone ?? undefined,
          role: row.cv_role,
          summary: row.cv_summary ?? undefined,
          photoPath: row.cv_photo_path ?? undefined,
          pdfPath: row.cv_pdf_path ?? undefined,
          skills: row.cv_skills ?? [],
          education: row.cv_education ?? [],
          experience: row.cv_experience ?? [],
          createdAt: row.cv_created_at,
        },
        row.cv_id
      ),
      similarity: row.similarity,
    }));
  }

  private toEntity(row: EmbeddingRow): CvEmbedding {
    const embeddingArray = typeof row.embedding === 'string'
      ? this.parseVector(row.embedding)
      : row.embedding;

    return new CvEmbedding(
      {
        cvId: row.cv_id,
        chunkText: row.chunk_text,
        chunkIndex: row.chunk_index,
        embedding: embeddingArray,
        createdAt: row.created_at,
      },
      row.id
    );
  }

  private vectorToString(vector: number[]): string {
    return `[${vector.join(',')}]`;
  }

  private parseVector(vectorStr: string): number[] {
    const cleaned = vectorStr.replace(/[\[\]]/g, '');
    return cleaned.split(',').map(Number);
  }
}
