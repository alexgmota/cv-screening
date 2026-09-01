import { Request, Response, NextFunction } from 'express';
import { DomainError } from '../../domain/shared/app-error';
import { CvIngestionUseCase } from '../../application/cv/cv-ingestion.use-case';
import { CvEntity } from '../../domain/cv/cv.entity';

/**
 * Controller handling the CV ingestion endpoint.
 */
export class CvController {
  constructor(
    private readonly cvIngestionUseCase?: CvIngestionUseCase
  ) {}

  async indexGeneratedCv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as Partial<{
        cv?: Record<string, unknown>;
        text?: string;
        rawText?: string;
      }>;

      if (!this.cvIngestionUseCase) {
        throw new DomainError('STORAGE_ERROR', 'CV ingestion service is not configured');
      }

      const cvPayload = body.cv ?? {};
      const text = (body.text ?? body.rawText ?? this.buildCvTextFromPayload(cvPayload)).trim();

      if (!cvPayload || typeof cvPayload !== 'object') {
        throw new DomainError('VALIDATION_ERROR', 'cv payload is required');
      }

      if (!text) {
        throw new DomainError('VALIDATION_ERROR', 'text is required for CV indexing');
      }

      const cv = CvEntity.create({
        name: String(cvPayload.name ?? 'Unknown Candidate'),
        email: typeof cvPayload.email === 'string' ? cvPayload.email : undefined,
        phone: typeof cvPayload.phone === 'string' ? cvPayload.phone : undefined,
        role: String(cvPayload.role ?? 'Unknown Role'),
        summary: typeof cvPayload.summary === 'string' ? cvPayload.summary : undefined,
        photoPath: typeof cvPayload.photoPath === 'string' ? cvPayload.photoPath : undefined,
        pdfPath: typeof cvPayload.pdfPath === 'string' ? cvPayload.pdfPath : undefined,
        skills: Array.isArray(cvPayload.skills) ? cvPayload.skills.map(String) : [],
        education: Array.isArray(cvPayload.education) ? (cvPayload.education as any[]) : [],
        experience: Array.isArray(cvPayload.experience) ? (cvPayload.experience as any[]) : [],
      });

      const requestId = (req as Request & { requestId?: string }).requestId;
      await this.cvIngestionUseCase.execute({ cv, text, requestId });

      res.status(202).json({
        data: {
          id: cv.id,
          status: 'indexed',
        },
      });
    } catch (err) {
      next(err instanceof DomainError ? err : new DomainError('STORAGE_ERROR', 'Failed to index generated CV'));
    }
  }

  private buildCvTextFromPayload(cvPayload: Record<string, unknown>): string {
    const sections: string[] = [];
    const name = typeof cvPayload.name === 'string' ? cvPayload.name : 'Unknown Candidate';
    const role = typeof cvPayload.role === 'string' ? cvPayload.role : 'Unknown Role';
    const summary = typeof cvPayload.summary === 'string' ? cvPayload.summary : '';
    const email = typeof cvPayload.email === 'string' ? cvPayload.email : '';
    const phone = typeof cvPayload.phone === 'string' ? cvPayload.phone : '';
    const skills = Array.isArray(cvPayload.skills) ? cvPayload.skills.map(String).join(', ') : '';

    sections.push(`Candidate: ${name}`);
    sections.push(`Role: ${role}`);
    if (summary) sections.push(`Summary: ${summary}`);
    if (email) sections.push(`Email: ${email}`);
    if (phone) sections.push(`Phone: ${phone}`);
    if (skills) sections.push(`Skills: ${skills}`);

    const education = Array.isArray(cvPayload.education) ? cvPayload.education : [];
    const experience = Array.isArray(cvPayload.experience) ? cvPayload.experience : [];

    if (education.length > 0) {
      sections.push('Education:');
      for (const item of education) {
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>;
          const degree = typeof record.degree === 'string' ? record.degree : '';
          const institution = typeof record.institution === 'string' ? record.institution : '';
          const field = typeof record.field === 'string' ? record.field : '';
          sections.push([institution, degree, field].filter(Boolean).join(' - '));
        }
      }
    }

    if (experience.length > 0) {
      sections.push('Experience:');
      for (const item of experience) {
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>;
          const company = typeof record.company === 'string' ? record.company : '';
          const position = typeof record.position === 'string' ? record.position : '';
          const description = typeof record.description === 'string' ? record.description : '';
          sections.push([company, position, description].filter(Boolean).join(' - '));
        }
      }
    }

    return sections.join('\n');
  }
}