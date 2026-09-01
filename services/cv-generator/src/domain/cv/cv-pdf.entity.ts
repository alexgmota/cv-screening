import { Entity } from '../shared/entity';

interface CvPdfProps {
  cvDataId: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  createdAt: Date;
}

/** Rendered PDF file representation with file metadata. */
export class CvPdf extends Entity<CvPdfProps> {
  get cvDataId(): string {
    return this.props.cvDataId;
  }

  get filePath(): string {
    return this.props.filePath;
  }

  get fileName(): string {
    return this.props.fileName;
  }

  get fileSize(): number {
    return this.props.fileSize;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  /** Create a CvPdf after successful PDF rendering. */
  static create(props: Omit<CvPdfProps, 'createdAt'>): CvPdf {
    return new CvPdf({
      ...props,
      createdAt: new Date(),
    });
  }
}
