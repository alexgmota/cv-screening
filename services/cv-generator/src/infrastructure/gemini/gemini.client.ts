import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { CvDomainError } from '../../domain/shared/app-error';
import { CvData } from '../../domain/cv/cv-data.entity';
import { Education, Experience } from '../../domain/cv/cv.types';

interface ParsedCvPayload {
  name: string;
  email: string;
  phone: string;
  role: string;
  photoUrl: string;
  summary: string;
  gender: 'male' | 'female';
  skills: string[];
  education: Education[];
  experience: Experience[];
}

export interface GeneratedCvData {
  cvData: CvData;
  gender: 'male' | 'female';
}

/**
 * Wraps the Google Gemini API for structured CV text generation.
 */
export class GeminiClient {
  private readonly model: GenerativeModel;
  private readonly apiKey: string;

  constructor(apiKey: string, modelName: string) {
    this.apiKey = apiKey;
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: modelName });
  }

  /**
   * Generate a single CV as structured data from a candidate role prompt.
   */
  async generateCvData(role: string): Promise<GeneratedCvData> {
    try {
      const prompt = this.buildPrompt(role);
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const payload = JSON.parse(text) as ParsedCvPayload;

      const { gender, ...cvProps } = payload;
      const cvData = CvData.create(cvProps);
      return { cvData, gender };
    } catch (error) {
      throw CvDomainError.generationFailed(error);
    }
  }

  private buildPrompt(role: string): string {
    return [
      'You are an expert CV writer. Generate a realistic, high-quality CV for a candidate.',
      'Generate a unique, culturally diverse full name. Vary ethnic backgrounds across candidates (South Asian, East Asian, African, Latin American, European, Middle Eastern, etc.). Do NOT use placeholder names like Alex, John, Jane, Smith, or other generic English names.',
      'Create a distinct email address derived from that name using varied providers (gmail.com, outlook.com, protonmail.com, icloud.com, yahoo.com, etc.). Never reuse the same email or name.',
      'Generate a realistic phone number with varied country codes (+44, +49, +91, +65, +52, +234, +33, +55, +81, +971, etc.). Never reuse a phone number.',
      'Use unique, fictional company names, universities, and skills for every candidate. Do not repeat companies, schools, or skill sets across CVs.',
      'Write a professional summary as a single 3-4 sentence paragraph describing the candidate\'s background, strengths, and career goals.',
      `Target role: ${role}.`,
      'Set gender to "male" or "female" based on the candidate\'s name. Only used to pick a matching portrait photo.',
      'Respond with ONLY valid JSON matching this TypeScript interface, no markdown:',
      JSON.stringify({
        name: 'string',
        email: 'string',
        phone: 'string',
        role: 'string',
        photoUrl: 'string',
        summary: 'string',
        gender: '"male" | "female"',
        skills: ['string'],
        education: [
          {
            institution: 'string',
            degree: 'string',
            field: 'string',
            startDate: 'string',
            endDate: 'string',
            gpa: 'number'
          }
        ],
        experience: [
          {
            company: 'string',
            position: 'string',
            startDate: 'string',
            endDate: 'string',
            description: 'string',
            technologies: ['string']
          }
        ]
      })
    ].join('\n');
  }
}