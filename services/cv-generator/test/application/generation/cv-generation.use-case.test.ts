import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GenerationUseCase } from '../../../src/application/generation/cv-generation.use-case';
import { CvDomainError } from '../../../src/domain/shared/app-error';

function createMockGenerationService() {
  return {
    generate: vi.fn().mockResolvedValue({
      cvData: {
        id: 'cv-1',
        name: 'Test Candidate',
        email: 'test@example.com',
        phone: '+1234567890',
        role: 'Software Engineer',
        summary: 'Experienced engineer who builds scalable systems.',
        skills: ['TypeScript', 'Node.js'],
        education: [{ institution: 'MIT', degree: 'BS', field: 'CS' }],
        experience: [{ company: 'Acme', position: 'Dev', description: 'Built things' }],
      },
      cvPdf: { filePath: 'cvs/cv-1.pdf' },
    }),
  } as any;
}

describe('GenerationUseCase', () => {
  let genService: ReturnType<typeof createMockGenerationService>;
  let useCase: GenerationUseCase;

  beforeEach(() => {
    genService = createMockGenerationService();
    useCase = new GenerationUseCase(genService);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('execute returns accepted response with a jobId', async () => {
    const response = await useCase.execute({ count: 3 });

    expect(response.status).toBe('accepted');
    expect(response.jobId).toBeDefined();
    expect(response.message).toContain('3');
  });

  it('getJobStatus returns null for unknown job', () => {
    expect(useCase.getJobStatus('nonexistent')).toBeNull();
  });

  it('job status transitions to completed', async () => {
    const response = await useCase.execute({ count: 1 });
    const jobId = response.jobId;

    await vi.waitFor(() => {
      const final = useCase.getJobStatus(jobId);
      expect(final!.status).toBe('completed');
      expect(final!.completedCount).toBe(1);
      expect(final!.failedCount).toBe(0);
    }, { timeout: 5000 });
  });

  it('reports failed count when generation fails', async () => {
    genService.generate.mockRejectedValue(CvDomainError.generationFailed());

    const response = await useCase.execute({ count: 1 });

    await vi.waitFor(() => {
      const status = useCase.getJobStatus(response.jobId);
      expect(status!.status).toBe('failed');
      expect(status!.failedCount).toBe(1);
      expect(status!.error).toBeDefined();
    }, { timeout: 5000 });
  });

  it('partial success marks completed when some succeed', async () => {
    genService.generate
      .mockResolvedValueOnce({
        cvData: {
          id: '1', name: 'Candidate A', email: 'a@test.com', phone: '+111',
          role: 'Dev', summary: 'Summary A', skills: ['JS'], education: [], experience: [],
        },
        cvPdf: { filePath: 'cvs/1.pdf' },
      })
      .mockRejectedValueOnce(CvDomainError.generationFailed())
      .mockResolvedValueOnce({
        cvData: {
          id: '3', name: 'Candidate C', email: 'c@test.com', phone: '+333',
          role: 'Dev', summary: 'Summary C', skills: ['Python'], education: [], experience: [],
        },
        cvPdf: { filePath: 'cvs/3.pdf' },
      });

    const response = await useCase.execute({ count: 3 });

    await vi.waitFor(() => {
      const status = useCase.getJobStatus(response.jobId);
      expect(status!.status).toBe('completed');
      expect(status!.completedCount).toBe(2);
      expect(status!.failedCount).toBe(1);
    }, { timeout: 5000 });
  });

  it('generates correct role names', async () => {
    const response = await useCase.execute({ count: 2 });

    await vi.waitFor(() => {
      expect(genService.generate).toHaveBeenCalledTimes(2);
    }, { timeout: 5000 });

    const roles = genService.generate.mock.calls.map((c: any[]) => c[0]);
    const validRoles = [
      'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
      'DevOps Engineer', 'Data Scientist', 'Product Manager', 'UX Designer',
      'Mobile Developer', 'Machine Learning Engineer', 'QA Engineer',
      'Cloud Architect', 'Security Engineer', 'Site Reliability Engineer',
      'Data Engineer', 'Platform Engineer', 'Solutions Architect',
      'Technical Project Manager', 'AI Research Engineer', 'Database Administrator',
      'Scrum Master', 'Digital Marketing Specialist', 'Financial Analyst',
      'HR Business Partner', 'Embedded Systems Engineer',
    ];
    for (const role of roles) {
      expect(validRoles).toContain(role);
    }
  });

  it('wraps generation service errors in job error field', async () => {
    genService.generate.mockRejectedValue(new Error('Network timeout'));

    const response = await useCase.execute({ count: 1 });

    await vi.waitFor(() => {
      const status = useCase.getJobStatus(response.jobId);
      expect(status!.error).toBe('Network timeout');
    }, { timeout: 5000 });
  });
});
