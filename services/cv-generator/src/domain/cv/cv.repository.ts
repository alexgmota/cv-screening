import { CvData } from './cv-data.entity';

/** Repository interface for storing and retrieving generated CV data. */
export interface ICvDataRepository {
  /** Save generated CV data. */
  save(cvData: CvData): Promise<void>;

  /** Find CV data by its unique identifier. */
  findById(id: string): Promise<CvData | null>;

  /** Retrieve all stored CV data entries. */
  findAll(): Promise<CvData[]>;
}
