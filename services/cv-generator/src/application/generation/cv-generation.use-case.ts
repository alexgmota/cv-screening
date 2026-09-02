import { v4 as uuidv4 } from 'uuid';
import { CvGenerationService, GeneratedCvResult } from './cv-generation.service';
import { CvDomainError } from '../../domain/shared/app-error';

export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface GenerationJob {
  id: string;
  count: number;
  status: JobStatus;
  completedCount: number;
  failedCount: number;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface GenerateRequest {
  count: number;
}

export interface GenerateResponse {
  jobId: string;
  status: 'accepted';
  message: string;
}

/**
 * Executes the CV generation use case, managing job lifecycle and status tracking.
 */
export class GenerationUseCase {
  private readonly jobs = new Map<string, GenerationJob>();

  constructor(private readonly generationService: CvGenerationService) {}

  /**
   * Start a new CV generation job and return immediately with a job ID.
   */
  async execute(request: GenerateRequest): Promise<GenerateResponse> {
    const jobId = uuidv4();
    const job: GenerationJob = {
      id: jobId,
      count: request.count,
      status: 'pending',
      completedCount: 0,
      failedCount: 0,
      startedAt: new Date(),
    };

    this.jobs.set(jobId, job);

    this.runJob(jobId, request.count).catch(() => {});

    return {
      jobId,
      status: 'accepted',
      message: `Generation job accepted for ${request.count} CV(s)`,
    };
  }

  /**
   * Get the current status of a generation job.
   */
  getJobStatus(jobId: string): GenerationJob | null {
    return this.jobs.get(jobId) ?? null;
  }

  private async runJob(jobId: string, count: number): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'in_progress';
    console.log('[cv-generator] generation job started', { jobId, count, roles: this.generateRoles(count) });

    const roles = this.generateRoles(count);

    for (const role of roles) {
      try {
        const generated = await this.generationService.generate(role);
        await this.notifyBackendForIndexing(generated);
        job.completedCount++;
        console.log('[cv-generator] role generated', { jobId, role, completedCount: job.completedCount });
      } catch (error) {
        job.failedCount++;
        console.error('[cv-generator] role generation failed', {
          jobId,
          role,
          failedCount: job.failedCount,
          error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        });
        if (job.failedCount === count) {
          job.status = 'failed';
          job.completedAt = new Date();
          job.error = error instanceof Error ? error.message : 'Unknown error';
          console.error('[cv-generator] generation job failed', { jobId, count, failedCount: job.failedCount, error: job.error });
          return;
        }
      }
    }

    job.status = 'completed';
    job.completedAt = new Date();
    console.log('[cv-generator] generation job completed', {
      jobId,
      count,
      completedCount: job.completedCount,
      failedCount: job.failedCount,
    });
  }

  private async notifyBackendForIndexing(result: Pick<GeneratedCvResult, 'cvPdf'>): Promise<void> {
    const ingestionUrl = (process.env.CV_INGESTION_URL || 'http://cv-ingestion-service:4003').replace(/\/$/, '');

    try {
      const response = await fetch(`${ingestionUrl}/api/cvs/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfPath: result.cvPdf.filePath }),
      });

      if (!response.ok) {
        const body = await response.text();
        console.error('[cv-generator] backend indexing failed', {
          ingestionUrl,
          pdfPath: result.cvPdf.filePath,
          status: response.status,
          body,
        });
      }
    } catch (error) {
      console.error('[cv-generator] backend indexing request failed', {
        ingestionUrl,
        pdfPath: result.cvPdf.filePath,
        error,
      });
    }
  }

  private generateRoles(count: number): string[] {
    const roles = [
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Developer',
      'DevOps Engineer',
      'Data Scientist',
      'Product Manager',
      'UX Designer',
      'Mobile Developer',
      'Machine Learning Engineer',
      'QA Engineer',
      'Cloud Architect',
      'Security Engineer',
      'Site Reliability Engineer',
      'Data Engineer',
      'Platform Engineer',
      'Solutions Architect',
      'Technical Project Manager',
      'AI Research Engineer',
      'Database Administrator',
      'Scrum Master',
      'Digital Marketing Specialist',
      'Financial Analyst',
      'HR Business Partner',
      'Embedded Systems Engineer',
    ];

    const shuffled = this.shuffle(roles);
    return Array.from({ length: count }, (_, i) => shuffled[i % shuffled.length]);
  }

  private shuffle<T>(items: T[]): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
