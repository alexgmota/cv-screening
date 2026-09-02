import { promises as fs } from 'fs';
import { join } from 'path';
import { DomainError } from '../../domain/shared/app-error';

/**
 * File-system storage that reads files from a shared root directory.
 */
export class FileSystemStorage {
  /**
   * @param rootPath Root directory that keys are resolved against.
   */
  constructor(private readonly rootPath: string) {}

  /**
   * Reads a file's contents as a buffer by its storage key.
   * @param key Storage key relative to the root path.
   * @throws DomainError when the file is missing or unreadable.
   */
  async read(key: string): Promise<Buffer> {
    try {
      const safeKey = this.sanitizeKey(key);
      const filePath = join(this.rootPath, safeKey);
      return await fs.readFile(filePath);
    } catch (error) {
      throw new DomainError(
        'STORAGE_ERROR',
        'Failed to read file from storage',
        { key, cause: error }
      );
    }
  }

  private sanitizeKey(key: string): string {
    return key.replace(/[/\\]/g, '/');
  }
}
