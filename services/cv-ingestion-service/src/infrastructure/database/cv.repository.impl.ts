import { Pool } from 'pg';
import { CvEntity } from '../../domain/cv/cv.entity';
import { ICvRepository } from '../../domain/cv/cv.repository';

export class CvRepositoryImpl implements ICvRepository {
  constructor(private readonly pool: Pick<Pool, 'query'>) {}

  async save(cv: CvEntity): Promise<void> {
    await this.pool.query(
      this.cvInsertSql,
      this.cvParams(cv)
    );
  }

      private readonly cvInsertSql = `INSERT INTO cvs (id, name, email, phone, role, summary, photo_path, pdf_path, skills, education, experience, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         phone = EXCLUDED.phone,
         role = EXCLUDED.role,
         summary = EXCLUDED.summary,
         photo_path = EXCLUDED.photo_path,
         pdf_path = EXCLUDED.pdf_path,
         skills = EXCLUDED.skills,
         education = EXCLUDED.education,
         experience = EXCLUDED.experience`;

  private cvParams(cv: CvEntity): unknown[] {
    return [
      cv.id,
      cv.name,
      cv.email,
      cv.phone,
      cv.role,
      cv.summary,
      cv.photoPath,
      cv.pdfPath,
      cv.skills,
      JSON.stringify(cv.education),
      JSON.stringify(cv.experience),
      cv.createdAt,
    ];
  }
}