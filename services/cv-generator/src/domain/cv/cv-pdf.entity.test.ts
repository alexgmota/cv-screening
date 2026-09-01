import { describe, it, expect } from 'vitest';
import { CvPdf } from './cv-pdf.entity';

describe('CvPdf', () => {
  const baseProps = {
    cvDataId: 'cv-data-1',
    filePath: 'cvs/John_Doe.pdf',
    fileName: 'John_Doe.pdf',
    fileSize: 102400,
  };

  it('creates CvPdf with all fields', () => {
    const pdf = CvPdf.create(baseProps);

    expect(pdf.id).toBeDefined();
    expect(pdf.cvDataId).toBe('cv-data-1');
    expect(pdf.filePath).toBe('cvs/John_Doe.pdf');
    expect(pdf.fileName).toBe('John_Doe.pdf');
    expect(pdf.fileSize).toBe(102400);
    expect(pdf.createdAt).toBeInstanceOf(Date);
  });

  it('createdAt is close to now', () => {
    const before = Date.now();
    const pdf = CvPdf.create(baseProps);
    const after = Date.now();

    expect(pdf.createdAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(pdf.createdAt.getTime()).toBeLessThanOrEqual(after);
  });

  it('constructs with explicit id', () => {
    const pdf = new CvPdf(
      { ...baseProps, createdAt: new Date() },
      'custom-id'
    );
    expect(pdf.id).toBe('custom-id');
  });

  it('entity equals compares by id', () => {
    const pdf1 = CvPdf.create(baseProps);
    const pdf2 = CvPdf.create(baseProps);

    expect(pdf1.equals(pdf2)).toBe(false);
    expect(pdf1.equals(pdf1)).toBe(true);
  });
});
