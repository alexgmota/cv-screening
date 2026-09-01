import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import type { StorageService } from '@leadtech/shared';
import { CvDomainError } from '../../domain/shared/app-error';

/**
 * Local filesystem implementation of the StorageService interface.
 */
export class FileSystemStorage implements StorageService {
  private readonly rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  /**
   * Save data to the filesystem and return the full storage key.
   */
  async save(key: string, data: Buffer): Promise<string> {
    try {
      const safeKey = this.sanitizeKey(key);
      const filePath = join(this.rootPath, safeKey);
      await fs.mkdir(dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, data);
      return safeKey;
    } catch (error) {
      throw CvDomainError.storageError(error);
    }
  }

  /**
   * Retrieve file contents by key.
   */
  async get(key: string): Promise<Buffer> {
    try {
      const filePath = join(this.rootPath, this.sanitizeKey(key));
      return await fs.readFile(filePath);
    } catch (error) {
      throw CvDomainError.storageError(error);
    }
  }

  /**
   * Check whether a file exists for the given key.
   */
  async exists(key: string): Promise<boolean> {
    try {
      const filePath = join(this.rootPath, this.sanitizeKey(key));
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete a file by key.
   */
  async delete(key: string): Promise<void> {
    try {
      const filePath = join(this.rootPath, this.sanitizeKey(key));
      await fs.unlink(filePath);
    } catch (error) {
      throw CvDomainError.storageError(error);
    }
  }

  private sanitizeKey(key: string): string {
    return key.replace(/[/\\]/g, '/');
  }
}
