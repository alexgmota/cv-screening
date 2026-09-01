import { CvIngestionService } from './cv-ingestion.service';
import { CvEntity } from '../../domain/cv/cv.entity';

export interface CvIngestionCommand {
  cv: CvEntity;
  text: string;
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
   * @param command The CV and extracted text along with request context.
   */
  async execute(command: CvIngestionCommand): Promise<void> {
    return this.cvIngestionService.ingest(
      command.cv,
      command.text,
      command.requestId
    );
  }
}