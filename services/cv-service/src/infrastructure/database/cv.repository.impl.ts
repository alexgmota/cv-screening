import { Pool } from 'pg';
import { CvEntity, Education, Experience } from '../../domain/cv/cv.entity';
import { CvPageResult, ICvRepository } from '../../domain/cv/cv.repository';

interface CvRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  summary: string | null;
  photo_path: string | null;
  pdf_path: string | null;
  skills: string[];
  education: Education[];
  experience: Experience[];
  created_at: Date;
}

export class CvRepositoryImpl implements ICvRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<CvEntity | null> {
    const result = await this.pool.query<CvRow>(
      'SELECT * FROM cvs WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.toEntity(result.rows[0]);
  }

  async findAll(): Promise<CvEntity[]> {
    const result = await this.pool.query<CvRow>(
      'SELECT * FROM cvs ORDER BY created_at DESC'
    );

    return result.rows.map((row) => this.toEntity(row));
  }

  async findPage(params: { search?: string; limit: number; offset: number }): Promise<CvPageResult> {
    const { limit, offset } = params;
    const search = params.search?.trim() || '';
    const hasSearch = search.length > 0;
    const pattern = `%${search}%`;

    if (hasSearch) {
      const countResult = await this.pool.query<{ count: number }>(
        'SELECT COUNT(*)::int AS count FROM cvs WHERE name ILIKE $1 OR role ILIKE $1',
        [pattern]
      );
      const total = countResult.rows[0].count;

      const dataResult = await this.pool.query<CvRow>(
        'SELECT * FROM cvs WHERE name ILIKE $1 OR role ILIKE $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [pattern, limit, offset]
      );

      return {
        data: dataResult.rows.map((row) => this.toEntity(row)),
        total,
      };
    }

    const countResult = await this.pool.query<{ count: number }>(
      'SELECT COUNT(*)::int AS count FROM cvs'
    );
    const total = countResult.rows[0].count;

    const dataResult = await this.pool.query<CvRow>(
      'SELECT * FROM cvs ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    return {
      data: dataResult.rows.map((row) => this.toEntity(row)),
      total,
    };
  }

  private toEntity(row: CvRow): CvEntity {
    return new CvEntity(
      {
        name: row.name,
        email: row.email ?? undefined,
        phone: row.phone ?? undefined,
        role: row.role,
        summary: row.summary ?? undefined,
        photoPath: row.photo_path ?? undefined,
        pdfPath: row.pdf_path ?? undefined,
        skills: row.skills ?? [],
        education: row.education ?? [],
        experience: row.experience ?? [],
        createdAt: row.created_at,
      },
      row.id
    );
  }
}
