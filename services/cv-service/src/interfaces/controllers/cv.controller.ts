import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { DomainError } from '../../domain/shared/app-error';
import { ICvQueryService } from '../../application/cv/cv-query.service';
import { CvEntity } from '../../domain/cv/cv.entity';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Read-only controller handling CV metadata and PDF endpoints.
 */
export class CvController {
  constructor(private readonly cvQueryService: ICvQueryService) {}

  async getAllCvs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || DEFAULT_PAGE);
      const limit = Math.min(
        MAX_LIMIT,
        Math.max(1, parseInt(req.query.limit as string, 10) || DEFAULT_LIMIT)
      );

      const allCvs = await this.cvQueryService.findAll();
      const total = allCvs.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const cvs = allCvs.slice(offset, offset + limit);

      res.json({
        data: cvs.map((cv) => ({
          id: cv.id,
          name: cv.name,
          email: cv.email,
          phone: cv.phone,
          role: cv.role,
          skills: cv.skills,
          createdAt: cv.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getCvById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const cv = await this.cvQueryService.findById(id);

      if (!cv) {
        throw new DomainError('NOT_FOUND', `CV with id '${id}' not found`);
      }

      res.json({
        data: {
          id: cv.id,
          name: cv.name,
          email: cv.email,
          phone: cv.phone,
          role: cv.role,
          photoPath: cv.photoPath,
          pdfPath: cv.pdfPath,
          summary: cv.summary ?? this.buildSummary(cv),
          skills: cv.skills,
          education: cv.education,
          experience: cv.experience,
          createdAt: cv.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getCvPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const cv = await this.cvQueryService.findById(id);

      if (!cv) {
        throw new DomainError('NOT_FOUND', `CV with id '${id}' not found`);
      }

      if (!cv.pdfPath) {
        throw new DomainError('NOT_FOUND', `PDF not available for CV '${id}'`);
      }

      const dataVolume = process.env.DATA_VOLUME_PATH || '/data/cvs';
      const pdfFullPath = path.join(dataVolume, cv.pdfPath);

      if (!fs.existsSync(pdfFullPath)) {
        throw new DomainError('NOT_FOUND', `PDF file not found on disk for CV '${id}'`);
      }

      const pdfBuffer = fs.readFileSync(pdfFullPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${cv.name.replace(/[^a-zA-Z0-9 ]/g, '')}.pdf"`);
      res.send(pdfBuffer);
    } catch (err) {
      if (err instanceof DomainError) {
        next(err);
        return;
      }
      next(new DomainError('STORAGE_ERROR', 'Failed to read PDF file'));
    }
  }

  private buildSummary(cv: CvEntity): string {
    const descriptions = (cv.experience ?? [])
      .map((exp) => exp?.description?.trim())
      .filter((d): d is string => Boolean(d));

    if (descriptions.length === 0) {
      return `${cv.name} is a ${cv.role}.`;
    }

    const summary = descriptions.join(' ');
    return summary.length > 240 ? `${summary.slice(0, 237).trimEnd()}...` : summary;
  }
}