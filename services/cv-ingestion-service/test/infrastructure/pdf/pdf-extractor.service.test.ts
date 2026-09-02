import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PdfExtractorService } from '../../../src/infrastructure/pdf/pdf-extractor.service';

const pdfMock = vi.fn();

vi.mock('pdf-parse', () => ({
  default: (...args: unknown[]) => pdfMock(...args),
}));

describe('PdfExtractorService', () => {
  let service: PdfExtractorService;
  const samplePdf = Buffer.from('%PDF-1.4\n%%EOF');

  beforeEach(() => {
    service = new PdfExtractorService();
    pdfMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns extracted text from valid PDF buffer', async () => {
    pdfMock.mockResolvedValue({ text: 'Hello world' });

    const result = await service.extract(samplePdf);

    expect(pdfMock).toHaveBeenCalledWith(samplePdf);
    expect(result).toBe('Hello world');
  });

  it('throws EXTRACTION_FAILED when pdf-parse fails', async () => {
    pdfMock.mockRejectedValue(new Error('invalid pdf'));

    await expect(service.extract(samplePdf)).rejects.toMatchObject({
      code: 'EXTRACTION_FAILED',
    });
  });
});
