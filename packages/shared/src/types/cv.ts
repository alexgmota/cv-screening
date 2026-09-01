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

/** Skill with optional proficiency level */
export interface Skill {
  name: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
}

/** CV entity representing a candidate's curriculum vitae */
export interface CV {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  photoPath?: string;
  pdfPath?: string;
  skills: string[];
  education: Education[];
  experience: Experience[];
  createdAt: Date;
}

/** CV metadata for list responses (without full details) */
export interface CVMetadata {
  id: string;
  name: string;
  email?: string;
  role: string;
  skills: string[];
  createdAt: Date;
}

/** Request to generate CVs */
export interface GenerateCVsRequest {
  count: number;
}

/** Response from CV generation */
export interface GenerateCVsResponse {
  status: 'accepted';
  jobId: string;
  message: string;
}

/** CV chunk for embedding and retrieval */
export interface CVChunk {
  cvId: string;
  chunkIndex: number;
  text: string;
  embedding?: number[];
}

/** Source attribution in chat response */
export interface ChatSource {
  cvId: string;
  name: string;
  role: string;
  relevance: number;
}

/** Chat request */
export interface ChatRequest {
  message: string;
}

/** Chat response */
export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
  requestId: string;
}
