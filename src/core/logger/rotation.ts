/**
 * Log rotation utilities
 *
 * Provides file-based log rotation with configurable size limits,
 * retention policies, and compression options.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createGzip, createGunzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'node:fs';

/**
 * Log rotation configuration
 */
export interface RotationConfig {
  /** Maximum size of a single log file in bytes (default: 10MB) */
  maxSize: number;
  /** Maximum number of rotated files to keep (default: 5) */
  maxFiles: number;
  /** Whether to compress rotated files (default: true) */
  compress: boolean;
  /** Date pattern for rotated file names (default: 'YYYY-MM-DD') */
  datePattern: string;
  /** Whether to create directory if it doesn't exist (default: true) */
  createDirectory: boolean;
}

/**
 * Default rotation configuration
 */
export const DEFAULT_ROTATION_CONFIG: RotationConfig = {
  maxSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  compress: true,
  datePattern: 'YYYY-MM-DD',
  createDirectory: true,
};

/**
 * Result of a rotation check
 */
export interface RotationCheckResult {
  shouldRotate: boolean;
  currentSize: number;
  maxSize: number;
}

/**
 * File info for rotation management
 */
export interface RotatedFileInfo {
  path: string;
  index: number;
  compressed: boolean;
  size: number;
  mtime: Date;
}

/**
 * Format a date according to the date pattern
 */
export function formatDate(date: Date, pattern: string): string {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return pattern
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * Check if a log file should be rotated
 */
export function shouldRotate(
  filePath: string,
  config: Partial<RotationConfig> = {}
): RotationCheckResult {
  const { maxSize = DEFAULT_ROTATION_CONFIG.maxSize } = config;

  try {
    const stats = fs.statSync(filePath);
    return {
      shouldRotate: stats.size >= maxSize,
      currentSize: stats.size,
      maxSize,
    };
  } catch (err) {
    // File doesn't exist, no rotation needed
    return {
      shouldRotate: false,
      currentSize: 0,
      maxSize,
    };
  }
}

/**
 * Get list of existing rotated log files
 */
export function getRotatedFiles(
  basePath: string,
  baseFileName: string
): RotatedFileInfo[] {
  const dir = path.dirname(basePath);
  const files: RotatedFileInfo[] = [];

  try {
    const entries = fs.readdirSync(dir);

    // Pattern: basename.N or basename.N.gz
    const rotatedPattern = new RegExp(
      `^${escapeRegExp(baseFileName)}\\.(\\d+)(\\.gz)?$`
    );

    for (const entry of entries) {
      const match = entry.match(rotatedPattern);
      if (match) {
        const filePath = path.join(dir, entry);
        const stats = fs.statSync(filePath);

        files.push({
          path: filePath,
          index: parseInt(match[1], 10),
          compressed: !!match[2],
          size: stats.size,
          mtime: stats.mtime,
        });
      }
    }

    // Sort by index (newest first)
    files.sort((a, b) => b.index - a.index);
  } catch (err) {
    // Directory doesn't exist or not readable
  }

  return files;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Rotate a log file
 * Renames current file and shifts existing rotated files
 */
export async function rotateFile(
  filePath: string,
  config: Partial<RotationConfig> = {}
): Promise<void> {
  const finalConfig = { ...DEFAULT_ROTATION_CONFIG, ...config };
  const dir = path.dirname(filePath);
  const baseFileName = path.basename(filePath);

  // Ensure directory exists
  if (finalConfig.createDirectory) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return;
  }

  // Get existing rotated files
  const rotatedFiles = getRotatedFiles(filePath, baseFileName);

  // Delete files that exceed maxFiles
  for (const file of rotatedFiles) {
    if (file.index >= finalConfig.maxFiles - 1) {
      fs.unlinkSync(file.path);
    }
  }

  // Shift existing rotated files
  const filesToShift = rotatedFiles.filter(
    (f) => f.index < finalConfig.maxFiles - 1
  );

  // Sort by index descending so we shift from highest to lowest
  filesToShift.sort((a, b) => b.index - a.index);

  for (const file of filesToShift) {
    const newIndex = file.index + 1;
    const ext = file.compressed ? '.gz' : '';
    const newPath = path.join(dir, `${baseFileName}.${newIndex}${ext}`);
    fs.renameSync(file.path, newPath);
  }

  // Rotate current file
  const rotatedPath = path.join(dir, `${baseFileName}.1`);

  if (finalConfig.compress) {
    // Compress the current file
    await compressFile(filePath, `${rotatedPath}.gz`);
    // Remove original after compression
    fs.unlinkSync(filePath);
  } else {
    // Just rename
    fs.renameSync(filePath, rotatedPath);
  }

  // Create new empty file
  fs.writeFileSync(filePath, '');
}

/**
 * Compress a file using gzip
 */
export async function compressFile(
  sourcePath: string,
  destPath: string
): Promise<void> {
  const source = createReadStream(sourcePath);
  const destination = createWriteStream(destPath);
  const gzip = createGzip({ level: 9 });

  await pipeline(source, gzip, destination);
}

/**
 * Decompress a gzipped file
 */
export async function decompressFile(
  sourcePath: string,
  destPath: string
): Promise<void> {
  const source = createReadStream(sourcePath);
  const destination = createWriteStream(destPath);
  const gunzip = createGunzip();

  await pipeline(source, gunzip, destination);
}

/**
 * Clean up old log files based on retention policy
 */
export function cleanupOldFiles(
  basePath: string,
  config: Partial<RotationConfig> = {}
): number {
  const { maxFiles = DEFAULT_ROTATION_CONFIG.maxFiles } = config;
  const baseFileName = path.basename(basePath);
  const rotatedFiles = getRotatedFiles(basePath, baseFileName);

  let deletedCount = 0;

  for (const file of rotatedFiles) {
    if (file.index > maxFiles) {
      try {
        fs.unlinkSync(file.path);
        deletedCount++;
      } catch (err) {
        // Ignore deletion errors
      }
    }
  }

  return deletedCount;
}

/**
 * Get total size of all log files (current + rotated)
 */
export function getTotalLogSize(basePath: string): number {
  const baseFileName = path.basename(basePath);
  const rotatedFiles = getRotatedFiles(basePath, baseFileName);

  let totalSize = 0;

  // Current file
  try {
    const stats = fs.statSync(basePath);
    totalSize += stats.size;
  } catch {
    // File doesn't exist
  }

  // Rotated files
  for (const file of rotatedFiles) {
    totalSize += file.size;
  }

  return totalSize;
}

/**
 * Create a rotating write stream
 * Automatically rotates when file exceeds maxSize
 */
export class RotatingWriteStream {
  private filePath: string;
  private config: RotationConfig;
  private stream: fs.WriteStream | null = null;
  private currentSize: number = 0;
  private rotationInProgress: boolean = false;
  private pendingWrites: Array<{ data: string; callback?: () => void }> = [];

  constructor(filePath: string, config: Partial<RotationConfig> = {}) {
    this.filePath = filePath;
    this.config = { ...DEFAULT_ROTATION_CONFIG, ...config };

    // Ensure directory exists
    if (this.config.createDirectory) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    // Get current file size
    try {
      const stats = fs.statSync(filePath);
      this.currentSize = stats.size;
    } catch {
      this.currentSize = 0;
    }

    this.stream = fs.createWriteStream(filePath, { flags: 'a' });
  }

  /**
   * Write data to the log file, rotating if necessary
   */
  async write(data: string): Promise<void> {
    const bytes = Buffer.byteLength(data);

    // Check if we need to rotate
    if (this.currentSize + bytes >= this.config.maxSize) {
      if (!this.rotationInProgress) {
        await this.rotate();
      } else {
        // Queue the write for after rotation
        return new Promise((resolve) => {
          this.pendingWrites.push({ data, callback: resolve });
        });
      }
    }

    // Write the data
    return new Promise((resolve, reject) => {
      if (!this.stream) {
        reject(new Error('Stream is closed'));
        return;
      }

      this.stream.write(data, (err) => {
        if (err) {
          reject(err);
        } else {
          this.currentSize += bytes;
          resolve();
        }
      });
    });
  }

  /**
   * Perform log rotation
   */
  private async rotate(): Promise<void> {
    if (this.rotationInProgress) return;

    this.rotationInProgress = true;

    try {
      // Close current stream
      await this.close();

      // Perform rotation
      await rotateFile(this.filePath, this.config);

      // Reopen stream
      this.stream = fs.createWriteStream(this.filePath, { flags: 'a' });
      this.currentSize = 0;

      // Process pending writes
      while (this.pendingWrites.length > 0) {
        const pending = this.pendingWrites.shift()!;
        await this.write(pending.data);
        pending.callback?.();
      }
    } finally {
      this.rotationInProgress = false;
    }
  }

  /**
   * Close the stream
   */
  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.stream) {
        resolve();
        return;
      }

      this.stream.end((err: Error | null | undefined) => {
        if (err) {
          reject(err);
        } else {
          this.stream = null;
          resolve();
        }
      });
    });
  }

  /**
   * Get the current file path
   */
  getFilePath(): string {
    return this.filePath;
  }

  /**
   * Get the current file size
   */
  getCurrentSize(): number {
    return this.currentSize;
  }
}

/**
 * Create a rotating write stream
 */
export function createRotatingStream(
  filePath: string,
  config?: Partial<RotationConfig>
): RotatingWriteStream {
  return new RotatingWriteStream(filePath, config);
}
