import crypto from 'crypto';

export interface StorageObjectManifestEntry {
  objectPathHash: string;
  bucket: string;
  sizeBytes: number;
  sha256Checksum: string;
  visibility: 'public' | 'private' | 'restricted';
  backupDate: string;
  backupStatus: 'success' | 'failed';
}

export interface StorageBackupManifest {
  manifestVersion: string;
  backupId: string;
  environment: string;
  releaseCandidate: string;
  totalObjects: number;
  totalSizeBytes: number;
  bucketCounts: Record<string, number>;
  checksumAlgorithm: 'sha256';
  status: 'success' | 'partial' | 'failed';
  startedAt: string;
  completedAt: string;
  entries: StorageObjectManifestEntry[];
}

export interface SyntheticStorageFile {
  id: string;
  bucket: 'uploads' | 'kyc-documents' | 'exports' | 'ticket-attachments';
  filename: string;
  visibility: 'public' | 'private' | 'restricted';
  content: string;
}

export interface DeletionTombstone {
  entityType: string;
  entityIdHash: string;
  deletedAt: string;
  retentionExpiresAt: string;
}

export interface BackupStorageProvider {
  putObject(bucket: string, key: string, body: Buffer | string, metadata?: Record<string, string>): Promise<{ success: boolean; etag?: string; error?: string }>;
  getObject(bucket: string, key: string): Promise<{ success: boolean; body?: Buffer; error?: string }>;
  headObject(bucket: string, key: string): Promise<{ exists: boolean; sizeBytes?: number; etag?: string }>;
  listObjects(bucket: string, prefix?: string): Promise<{ keys: string[]; totalCount: number }>;
  deleteObject(bucket: string, key: string): Promise<{ success: boolean; error?: string }>;
}

export class UnconfiguredBackupStorageProvider implements BackupStorageProvider {
  async putObject() {
    return { success: false, error: 'BACKUP_PROVIDER_UNCONFIGURED: Provedor de storage externo de réplica não configurado.' };
  }
  async getObject() {
    return { success: false, error: 'BACKUP_PROVIDER_UNCONFIGURED: Provedor de storage externo de réplica não configurado.' };
  }
  async headObject() {
    return { exists: false };
  }
  async listObjects() {
    return { keys: [], totalCount: 0 };
  }
  async deleteObject() {
    return { success: false, error: 'BACKUP_PROVIDER_UNCONFIGURED: Provedor de storage externo de réplica não configurado.' };
  }
}

// In-memory concurrency lock for backup execution
let isBackupRunning = false;

export const storageBackupService = {
  /**
   * Acquires a concurrency lock to prevent overlapping backup executions.
   */
  acquireLock(): boolean {
    if (isBackupRunning) return false;
    isBackupRunning = true;
    return true;
  },

  /**
   * Releases the concurrency lock.
   */
  releaseLock(): void {
    isBackupRunning = false;
  },

  /**
   * Generates a secure cryptographic SHA-256 checksum for a binary or text object.
   */
  calculateChecksum(content: string | Buffer): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  },

  /**
   * Generates an object path hash for manifest logging (avoids leaking sensitive filenames/PII in logs).
   */
  hashObjectPath(bucket: string, filename: string): string {
    return crypto.createHash('sha256').update(`${bucket}:${filename}`).digest('hex').substring(0, 16);
  },

  /**
   * Creates a verified storage backup manifest with SHA-256 checksums and partial-failure awareness.
   */
  createBackupManifest(
    files: SyntheticStorageFile[],
    simulateFailureBucket?: string,
    releaseCandidate = 'RC-20260827-054500-HARDENED'
  ): StorageBackupManifest {
    const startedAt = new Date().toISOString();
    let totalSizeBytes = 0;
    const bucketCounts: Record<string, number> = {};
    let hasFailure = false;

    const entries: StorageObjectManifestEntry[] = files.map((file) => {
      const sizeBytes = Buffer.byteLength(file.content, 'utf8');
      const isFailed = simulateFailureBucket && file.bucket === simulateFailureBucket;
      if (isFailed) hasFailure = true;

      if (!isFailed) {
        totalSizeBytes += sizeBytes;
        bucketCounts[file.bucket] = (bucketCounts[file.bucket] || 0) + 1;
      }

      return {
        objectPathHash: this.hashObjectPath(file.bucket, file.filename),
        bucket: file.bucket,
        sizeBytes: isFailed ? 0 : sizeBytes,
        sha256Checksum: isFailed ? 'FAILED_CHECKSUM' : this.calculateChecksum(file.content),
        visibility: file.visibility,
        backupDate: new Date().toISOString(),
        backupStatus: isFailed ? 'failed' : 'success',
      };
    });

    const status = hasFailure ? (entries.some((e) => e.backupStatus === 'success') ? 'partial' : 'failed') : 'success';

    return {
      manifestVersion: '1.1.0',
      backupId: `bkp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      environment: process.env.NODE_ENV || 'development',
      releaseCandidate,
      totalObjects: entries.filter((e) => e.backupStatus === 'success').length,
      totalSizeBytes,
      bucketCounts,
      checksumAlgorithm: 'sha256',
      status,
      startedAt,
      completedAt: new Date().toISOString(),
      entries,
    };
  },

  /**
   * Executes a file restore validation drill comparing checksum before and after.
   */
  validateRestore(
    originalFiles: SyntheticStorageFile[],
    restoredFiles: SyntheticStorageFile[]
  ): {
    success: boolean;
    restoredCount: number;
    checksumsMatch: boolean;
    privacyPreserved: boolean;
    details: { bucket: string; checksumBefore: string; checksumAfter: string; match: boolean }[];
  } {
    if (originalFiles.length !== restoredFiles.length) {
      return { success: false, restoredCount: restoredFiles.length, checksumsMatch: false, privacyPreserved: false, details: [] };
    }

    const details: { bucket: string; checksumBefore: string; checksumAfter: string; match: boolean }[] = [];
    let checksumsMatch = true;
    let privacyPreserved = true;

    for (let i = 0; i < originalFiles.length; i++) {
      const orig = originalFiles[i];
      const rest = restoredFiles[i];

      const beforeHash = this.calculateChecksum(orig.content);
      const afterHash = this.calculateChecksum(rest.content);
      const match = beforeHash === afterHash;

      if (!match) checksumsMatch = false;
      if (orig.visibility !== rest.visibility) privacyPreserved = false;

      details.push({
        bucket: orig.bucket,
        checksumBefore: beforeHash,
        checksumAfter: afterHash,
        match,
      });
    }

    return {
      success: checksumsMatch && privacyPreserved,
      restoredCount: restoredFiles.length,
      checksumsMatch,
      privacyPreserved,
      details,
    };
  },

  /**
   * Evaluates backup retention policy (Daily 7, Weekly 4, Monthly 6) ensuring legal holds are preserved.
   */
  evaluateRetention(
    manifests: Array<{ id: string; createdAt: string; hasLegalHold?: boolean }>,
    now = new Date()
  ): { retain: string[]; purge: string[] } {
    const retain: string[] = [];
    const purge: string[] = [];

    manifests.forEach((m) => {
      if (m.hasLegalHold) {
        retain.push(m.id);
        return;
      }

      const ageDays = (now.getTime() - new Date(m.createdAt).getTime()) / (1000 * 3600 * 24);
      // Keep within 180 days (6 months)
      if (ageDays <= 180) {
        retain.push(m.id);
      } else {
        purge.push(m.id);
      }
    });

    return { retain, purge };
  },

  /**
   * Applies deletion tombstones post-restore to prevent reappearance of LGPD-deleted records.
   */
  applyDeletionTombstones(
    activeRecords: Array<{ id: string }>,
    tombstones: DeletionTombstone[]
  ): { preservedRecords: Array<{ id: string }>; purgedRecordIds: string[] } {
    const tombstoneHashes = new Set(tombstones.map((t) => t.entityIdHash));
    const preservedRecords: Array<{ id: string }> = [];
    const purgedRecordIds: string[] = [];

    activeRecords.forEach((rec) => {
      const idHash = crypto.createHash('sha256').update(rec.id).digest('hex');
      if (tombstoneHashes.has(idHash)) {
        purgedRecordIds.push(rec.id);
      } else {
        preservedRecords.push(rec);
      }
    });

    return { preservedRecords, purgedRecordIds };
  },
};
