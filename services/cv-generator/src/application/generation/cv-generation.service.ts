import { GeminiClient } from '../../infrastructure/gemini/gemini.client';
import { PhotoFetcherService } from '../../infrastructure/photo/photo-fetcher.service';
import { PdfRendererService } from '../../infrastructure/pdf/pdf-renderer.service';
import { FileSystemStorage } from '../../infrastructure/storage/file-system.storage';
import { ICvDataRepository } from '../../domain/cv/cv.repository';
import { CvData } from '../../domain/cv/cv-data.entity';
import { CvPdf } from '../../domain/cv/cv-pdf.entity';

export interface GeneratedCvResult {
  cvData: CvData;
  cvPdf: CvPdf;
}

/**
 * Orchestrates the full CV generation pipeline: data generation → photo fetch → PDF render → store.
 */
export class CvGenerationService {
  private lastGeminiCallAt = 0;

  constructor(
    private readonly geminiClient: GeminiClient,
    private readonly photoFetcher: PhotoFetcherService,
    private readonly pdfRenderer: PdfRendererService,
    private readonly storage: FileSystemStorage,
    private readonly cvRepository: ICvDataRepository,
    private readonly geminiDelayMs = 0
  ) {}

  /**
   * Generate a single CV for the given role through the complete pipeline.
   */
  async generate(role: string): Promise<GeneratedCvResult> {
    await this.waitForRateLimit();
    const profile = this.photoFetcher.fetchProfile
      ? await this.photoFetcher.fetchProfile()
      : null;
    const { cvData } = await this.geminiClient.generateCvData(role);
    this.lastGeminiCallAt = Date.now();

    const photoBuffer = profile?.photo ?? await this.photoFetcher.fetchPhoto();
    const photoKey = photoBuffer ? `photos/${cvData.id}.jpg` : undefined;

    if (photoBuffer && photoKey) {
      await this.storage.save(photoKey, photoBuffer);
    }

    const baseProps = this.extractProps(cvData);
    if (profile) {
      baseProps.name = profile.name;
      baseProps.email = profile.email;
      baseProps.phone = profile.phone;
    }
    const { photoUrl: _unusedPhotoUrl, ...cvDataPropsWithoutPhoto } = baseProps;
    const cvDataWithPhoto = CvData.create(
      photoKey
        ? { ...cvDataPropsWithoutPhoto, photoUrl: photoKey }
        : (cvDataPropsWithoutPhoto as any)
    );

    const pdfBuffer = await this.pdfRenderer.render(cvDataWithPhoto);
    const pdfKey = `cvs/${cvDataWithPhoto.id}.pdf`;
    const storedPdfKey = await this.storage.save(pdfKey, pdfBuffer);

    const cvPdf = CvPdf.create({
      cvDataId: cvDataWithPhoto.id,
      filePath: storedPdfKey,
      fileName: `${cvDataWithPhoto.name.replace(/\s+/g, '_')}.pdf`,
      fileSize: pdfBuffer.length,
    });

    await this.cvRepository.save(cvDataWithPhoto);

    return { cvData: cvDataWithPhoto, cvPdf };
  }

  private async waitForRateLimit(): Promise<void> {
    if (this.geminiDelayMs <= 0 || this.lastGeminiCallAt === 0) {
      return;
    }

    const elapsed = Date.now() - this.lastGeminiCallAt;
    const remaining = this.geminiDelayMs - elapsed;
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
  }

  private extractProps(cvData: CvData): {
    name: string;
    email: string;
    phone: string;
    role: string;
    photoUrl?: string;
    summary: string;
    skills: string[];
    education: CvData['education'];
    experience: CvData['experience'];
  } {
    return {
      name: cvData.name,
      email: cvData.email,
      phone: cvData.phone,
      role: cvData.role,
      photoUrl: cvData.photoUrl,
      summary: cvData.summary,
      skills: cvData.skills,
      education: cvData.education,
      experience: cvData.experience,
    };
  }
}
