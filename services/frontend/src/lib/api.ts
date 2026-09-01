export interface ChatSource {
  cvId: string;
  name: string;
  role: string;
  relevance: number;
}

export interface CvDetail {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  summary: string;
  skills: string[];
}

export interface ChatApiResponse {
  answer: string;
  sources: ChatSource[];
  requestId: string;
  conversationId: string;
}

export interface ChatApiError {
  status: number;
  message: string;
}

const CV_SERVICE_URL = process.env.NEXT_PUBLIC_CV_SERVICE_URL || 'http://localhost:4002';

export async function sendChatMessage(
  message: string,
  conversationId?: string
): Promise<ChatApiResponse> {
  const response = await fetch(`${CV_SERVICE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationId }),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to get response';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // Response body may not be JSON
    }
    const error: ChatApiError = { status: response.status, message: errorMessage };
    throw error;
  }

  return response.json();
}

export async function getCvDetail(cvId: string): Promise<CvDetail> {
  const response = await fetch(`${CV_SERVICE_URL}/api/cvs/${cvId}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to load CV details');
  }

  const json = await response.json();
  return json.data as CvDetail;
}
