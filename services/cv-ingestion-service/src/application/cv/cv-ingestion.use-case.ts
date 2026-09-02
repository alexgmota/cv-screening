import { CvIngestionService } from './cv-ingestion.service';
import { CvEntity } from '../../domain/cv/cv.entity';

export interface CvIngestionCommand {
  pdfPath: string;
  requestId?: string;
}

/**
 * Use case that executes a CV ingestion command against the CvIngestionService.
 * Acts as a thin application boundary that holds request context and
 * propagates errors from the underlying service.
 */
export class CvIngestionUseCase {
  /**
   * @param cvIngestionService Service that orchestrates the ingestion pipeline.
   */
  constructor(private readonly cvIngestionService: CvIngestionService) {}

  /**
   * Executes an ingestion for a single CV.
   * @param command The PDF path reference and request context.
   * @returns The created CV entity.
   */
  async execute(command: CvIngestionCommand): Promise<CvEntity> {
    return this.cvIngestionService.ingest(
      command.pdfPath,
      command.requestId
    );
  }
}
