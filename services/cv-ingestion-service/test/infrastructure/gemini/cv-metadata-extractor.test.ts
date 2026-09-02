import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CvMetadataExtractor } from '../../../src/infrastructure/gemini/cv-metadata-extractor';

function createMockGemini() {
  return {
    generateContent: vi.fn(),
  } as any;
}

const validMetadata = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '123-456-7890',
  role: 'Frontend Developer',
  summary: 'Summary paragraph.',
  skills: ['React', 'TypeScript'],
  education: [{ institution: 'U', degree: 'BS', field: 'CS', startDate: '2016' }],
  experience: [{ company: 'Co', position: 'Dev', startDate: '2020', description: 'built things' }],
};

describe('CvMetadataExtractor', () => {
  let gemini: ReturnType<typeof createMockGemini>;
  let extractor: CvMetadataExtractor;
  const pdfText = 'Jane Smith, jane@example.com, Frontend Developer';

  beforeEach(() => {
    gemini = createMockGemini();
    extractor = new CvMetadataExtractor(gemini);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('extracts valid metadata from plain JSON response', async () => {
    gemini.generateContent.mockResolvedValue(JSON.stringify(validMetadata));

    const result = await extractor.extractMetadata(pdfText);

    expect(gemini.generateContent).toHaveBeenCalled();
    expect(result).toEqual(validMetadata);
  });

  it('strips markdown fences from model output', async () => {
    gemini.generateContent.mockResolvedValue(`\`\`\`json\n${JSON.stringify(validMetadata)}\n\`\`\``);

    const result = await extractor.extractMetadata(pdfText);

    expect(result).toEqual(validMetadata);
  });

  it('throws EXTRACTION_FAILED when model output is invalid JSON', async () => {
    gemini.generateContent.mockResolvedValue('this is not json');

    await expect(extractor.extractMetadata(pdfText)).rejects.toMatchObject({
      code: 'EXTRACTION_FAILED',
    });
  });

  it('throws EXTRACTION_FAILED when required fields are missing', async () => {
    gemini.generateContent.mockResolvedValue(JSON.stringify({ name: 'Jane' }));

    await expect(extractor.extractMetadata(pdfText)).rejects.toMatchObject({
      code: 'EXTRACTION_FAILED',
    });
  });

  it('throws EXTRACTION_FAILED when Gemini client throws', async () => {
    gemini.generateContent.mockRejectedValue(new Error('API down'));

    await expect(extractor.extractMetadata(pdfText)).rejects.toMatchObject({
      code: 'EXTRACTION_FAILED',
    });
  });
});
