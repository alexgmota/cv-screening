import { GeminiClient } from './gemini.client';
import { DomainError } from '../../domain/shared/app-error';

export interface ExtractedEducation {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
}

export interface ExtractedExperience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
}

export interface ExtractedCvMetadata {
  name: string;
  email: string;
  phone: string;
  role: string;
  summary: string;
  skills: string[];
  education: ExtractedEducation[];
  experience: ExtractedExperience[];
}

const EXTRACTION_PROMPT = `You are a CV data extraction assistant. Extract structured metadata from the given CV plain text.
Respond with ONLY valid JSON, no markdown, no code fences, no commentary.
The JSON must strictly match this exact schema:
{
  "name": string,
  "email": string,
  "phone": string,
  "role": string,
  "summary": string,
  "skills": string[],
  "education": [{ "institution": string, "degree": string, "field": string, "startDate": string, "endDate"?: string }],
  "experience": [{ "company": string, "position": string, "startDate": string, "endDate"?: string, "description": string }]
}
Instructions:
- Extract the candidate's name from the CV.
- Extract the email and phone from the CV's contact block.
- Extract the professional role from the most recent or stated position.
- Extract the professional summary from the CV's summary paragraph.
- Extract skills from the skills section.
- Extract education entries with institution, degree, field of study, and dates (use "YYYY-MM" or "Present" for endDate when ongoing).
- Extract experience entries with company, position, dates, and a description of responsibilities.
- Use empty strings or empty arrays when a field is not present.

Here is the CV plain text:
"""`;

/**
 * Extracts structured CV metadata from plain text using a Gemini model.
 */
export class CvMetadataExtractor {
  /**
   * @param geminiClient Gemini client used for text generation.
   */
  constructor(private readonly geminiClient: GeminiClient) {}

  /**
   * Extracts structured CV metadata from plain CV text.
   * @param pdfText The plain text extracted from a CV PDF.
   * @throws DomainError when the model output cannot be parsed or validated.
   */
  async extractMetadata(pdfText: string): Promise<ExtractedCvMetadata> {
    const prompt = `${EXTRACTION_PROMPT}\n${pdfText}\n"""`;

    let raw: string;
    try {
      raw = await this.geminiClient.generateContent(prompt);
    } catch (error) {
      throw new DomainError(
        'EXTRACTION_FAILED',
        'Failed to generate CV metadata from Gemini',
        { cause: error }
      );
    }

    const cleaned = this.stripMarkdownFences(raw);

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (error) {
      throw new DomainError(
        'EXTRACTION_FAILED',
        'Failed to parse CV metadata JSON from model output',
        { cause: error }
      );
    }

    return this.validateMetadata(parsed);
  }

  private stripMarkdownFences(text: string): string {
    const trimmed = text.trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    return (fenced ? fenced[1] : trimmed).trim();
  }

  private validateMetadata(value: unknown): ExtractedCvMetadata {
    const record = value as Record<string, unknown>;

    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new DomainError('EXTRACTION_FAILED', 'CV metadata is not a valid object');
    }

    if (typeof record.name !== 'string' || !record.name.trim()) {
      throw new DomainError('EXTRACTION_FAILED', 'CV metadata missing required field: name');
    }

    if (typeof record.role !== 'string' || !record.role.trim()) {
      throw new DomainError('EXTRACTION_FAILED', 'CV metadata missing required field: role');
    }

    if (typeof record.summary !== 'string') {
      throw new DomainError('EXTRACTION_FAILED', 'CV metadata missing required field: summary');
    }

    if (!Array.isArray(record.skills) || !record.skills.every((s) => typeof s === 'string')) {
      throw new DomainError('EXTRACTION_FAILED', 'CV metadata invalid field: skills');
    }

    if (!Array.isArray(record.education) || !record.education.every((e) => this.isEducation(e))) {
      throw new DomainError('EXTRACTION_FAILED', 'CV metadata invalid field: education');
    }

    if (!Array.isArray(record.experience) || !record.experience.every((e) => this.isExperience(e))) {
      throw new DomainError('EXTRACTION_FAILED', 'CV metadata invalid field: experience');
    }

    return {
      name: record.name,
      email: typeof record.email === 'string' ? record.email : '',
      phone: typeof record.phone === 'string' ? record.phone : '',
      role: record.role,
      summary: record.summary,
      skills: record.skills as string[],
      education: record.education as ExtractedEducation[],
      experience: record.experience as ExtractedExperience[],
    };
  }

  private isEducation(value: unknown): boolean {
    if (typeof value !== 'object' || value === null) return false;
    const record = value as Record<string, unknown>;
    return (
      typeof record.institution === 'string' &&
      typeof record.degree === 'string' &&
      typeof record.field === 'string' &&
      typeof record.startDate === 'string'
    );
  }

  private isExperience(value: unknown): boolean {
    if (typeof value !== 'object' || value === null) return false;
    const record = value as Record<string, unknown>;
    return (
      typeof record.company === 'string' &&
      typeof record.position === 'string' &&
      typeof record.startDate === 'string' &&
      typeof record.description === 'string'
    );
  }
}
