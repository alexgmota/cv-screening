export { CvData } from './cv-data.entity';
export { CvPdf } from './cv-pdf.entity';
export type { ICvDataRepository } from './cv.repository';

/** Work experience entry */
export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
  technologies?: string[];
}

/** Education entry */
export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  gpa?: number;
}

/** Request to generate a batch of CVs */
export interface GenerateCVsRequest {
  count: number;
}

/** Response after generation job is accepted */
export interface GenerateCVsResponse {
  status: 'accepted';
  jobId: string;
  message: string;
}
