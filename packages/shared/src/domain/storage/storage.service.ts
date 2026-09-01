/**
 * Interface for blob storage operations.
 * Implementations: FileSystemStorage, S3Storage, MinIOStorage.
 */
export interface StorageService {
  /** Save data and return the storage key */
  save(key: string, data: Buffer): Promise<string>;

  /** Retrieve data by key */
  get(key: string): Promise<Buffer>;

  /** Check if a key exists */
  exists(key: string): Promise<boolean>;

  /** Delete data by key */
  delete(key: string): Promise<void>;
}
