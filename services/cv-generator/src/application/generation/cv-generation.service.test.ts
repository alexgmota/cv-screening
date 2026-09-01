import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CvGenerationService } from './cv-generation.service';
import { CvDomainError } from '../../domain/shared/app-error';
import { CvData } from '../../domain/cv/cv-data.entity';

function createMockGemini() {
  return {
    generateCvData: vi.fn().mockResolvedValue({
      gender: 'male',
      cvData: CvData.create({
        name: 'Test Candidate',
        email: 'test@test.com',
        phone: '+123',
        role: 'Developer',
        photoUrl: 'https://example.com/photo.jpg',
        skills: ['JS'],
        education: [],
        experience: [],
      }),
    }),
  } as any;
}

function createMockPhotoFetcher() {
  return {
    fetchPhoto: vi.fn().mockResolvedValue(Buffer.from('photo-data')),
  } as any;
}

function createMockPdfRenderer() {
  return {
    render: vi.fn().mockResolvedValue(Buffer.from('pdf-data')),
  } as any;
}

function createMockStorage() {
  return {
    save: vi.fn().mockImplementation(async (key: string) => key),
    get: vi.fn(),
    exists: vi.fn(),
    delete: vi.fn(),
  } as any;
}

function createMockCvRepo() {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn(),
    findAll: vi.fn(),
  } as any;
}

describe('CvGenerationService', () => {
  let gemini: ReturnType<typeof createMockGemini>;
  let photoFetcher: ReturnType<typeof createMockPhotoFetcher>;
  let pdfRenderer: ReturnType<typeof createMockPdfRenderer>;
  let storage: ReturnType<typeof createMockStorage>;
  let cvRepo: ReturnType<typeof createMockCvRepo>;
  let service: CvGenerationService;

  beforeEach(() => {
    gemini = createMockGemini();
    photoFetcher = createMockPhotoFetcher();
    pdfRenderer = createMockPdfRenderer();
    storage = createMockStorage();
    cvRepo = createMockCvRepo();
    service = new CvGenerationService(gemini, photoFetcher, pdfRenderer, storage, cvRepo);
  });

  it('runs full pipeline: gemini -> photo -> pdf -> store -> save', async () => {
    const result = await service.generate('Frontend Developer');

    expect(gemini.generateCvData).toHaveBeenCalledWith('Frontend Developer');
    expect(photoFetcher.fetchPhoto).toHaveBeenCalled();
    expect(pdfRenderer.render).toHaveBeenCalled();
    expect(cvRepo.save).toHaveBeenCalled();

    expect(result.cvData).toBeDefined();
    expect(result.cvPdf).toBeDefined();
    expect(result.cvPdf.cvDataId).toBe(result.cvData.id);
  });

  it('saves photo and pdf to storage with correct keys', async () => {
    await service.generate('Backend Developer');

    expect(storage.save).toHaveBeenCalledTimes(2);
    const photoKey = storage.save.mock.calls[0][0];
    expect(photoKey).toMatch(/^photos\/.*\.jpg$/);

    const pdfKey = storage.save.mock.calls[1][0];
    expect(pdfKey).toMatch(/^cvs\/.*\.pdf$/);
  });

  it('sets photoUrl to the stored photo key', async () => {
    await service.generate('DevOps Engineer');

    const renderCall = pdfRenderer.render.mock.calls[0][0];
    expect(renderCall.photoUrl).toMatch(/^photos\/.*\.jpg$/);
  });

  it('skips photo storage and renders without a photo when fetchPhoto returns null', async () => {
    photoFetcher.fetchPhoto.mockResolvedValue(null);

    await service.generate('Platform Engineer');

    expect(storage.save).toHaveBeenCalledTimes(1);
    expect(storage.save.mock.calls[0][0]).toMatch(/^cvs\/.*\.pdf$/);
    const renderCall = pdfRenderer.render.mock.calls[0][0];
    expect(renderCall.photoUrl).toBeUndefined();
  });

  it('throws when gemini fails', async () => {
    gemini.generateCvData.mockRejectedValue(CvDomainError.generationFailed());

    await expect(service.generate('Role')).rejects.toThrow(CvDomainError);
  });

  it('throws when photo fetch fails', async () => {
    photoFetcher.fetchPhoto.mockRejectedValue(CvDomainError.photoFetchFailed());

    await expect(service.generate('Role')).rejects.toThrow(CvDomainError);
  });

  it('throws when PDF render fails', async () => {
    pdfRenderer.render.mockRejectedValue(CvDomainError.pdfRenderingFailed());

    await expect(service.generate('Role')).rejects.toThrow(CvDomainError);
  });

  it('throws when storage save fails', async () => {
    storage.save.mockRejectedValue(CvDomainError.storageError());

    await expect(service.generate('Role')).rejects.toThrow(CvDomainError);
  });

  it('throws when cvRepository save fails', async () => {
    cvRepo.save.mockRejectedValue(new Error('DB fail'));

    await expect(service.generate('Role')).rejects.toThrow();
  });

  it('waits the configured delay between gemini calls', async () => {
    vi.useFakeTimers();
    try {
      service = new CvGenerationService(gemini, photoFetcher, pdfRenderer, storage, cvRepo, 30000);

      await service.generate('Role');
      expect(gemini.generateCvData).toHaveBeenCalledTimes(1);

      const second = service.generate('Role');
      await vi.advanceTimersByTimeAsync(29999);
      expect(gemini.generateCvData).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1);
      await second;
      expect(gemini.generateCvData).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
