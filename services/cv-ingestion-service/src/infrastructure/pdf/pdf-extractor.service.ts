import pdf from 'pdf-parse';
import { DomainError } from '../../domain/shared/app-error';

/**
 * Extracts plain text from PDF buffers using pdf-parse.
 */
export class PdfExtractorService {
  /**
   * Extracts plain text from a PDF buffer.
   * @param buffer The PDF file buffer.
   * @throws DomainError when the PDF cannot be parsed.
   */
  async extract(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      throw new DomainError(
        'EXTRACTION_FAILED',
        'Failed to extract text from PDF',
        { cause: error }
      );
    }
  }
}
