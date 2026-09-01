import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { CvDomainError } from '../../domain/shared/app-error';
import { CvData } from '../../domain/cv/cv-data.entity';
import { Education, Experience } from '../../domain/cv/cv.types';

interface ParsedCvPayload {
  role: string;
  summary: string;
  skills: string[];
  education: Education[];
  experience: Experience[];
}

export interface GeneratedCvData {
  cvData: CvData;
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

      const cvData = CvData.create({
        name: '',
        email: '',
        phone: '',
        role: payload.role,
        summary: payload.summary,
        skills: payload.skills,
        education: payload.education,
        experience: payload.experience,
      });
      return { cvData };
    } catch (error) {
      throw CvDomainError.generationFailed(error);
    }
  }

  private buildPrompt(role: string): string {
    return [
      'You are an expert CV writer. Generate a realistic, high-quality CV for a candidate.',
      'Use unique, fictional company names, universities, and skills for every candidate. Do not repeat companies, schools, or skill sets across CVs.',
      'Write a professional summary as a single 3-4 sentence paragraph describing the candidate\'s background, strengths, and career goals.',
      `Target role: ${role}.`,
      'Respond with ONLY valid JSON matching this TypeScript interface, no markdown:',
      JSON.stringify({
        role: 'string',
        summary: 'string',
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