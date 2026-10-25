import { AnalysisSnapshot, IAnalysisSnapshot } from '../../models/AnalysisSnapshot';
import { getDatabaseStatus } from '../../config/database';

// In-memory fallback
const memorySnapshots = new Map<string, IAnalysisSnapshot[]>();

export class AnalysisSnapshotService {
  /**
   * Creates and stores a snapshot in MongoDB if connected, and caches in memory.
   */
  static async createSnapshot(data: Partial<IAnalysisSnapshot>): Promise<IAnalysisSnapshot> {
    const isDbConnected = getDatabaseStatus().isConnected;
    let saved: any = null;

    if (isDbConnected) {
      try {
        saved = await AnalysisSnapshot.create({
          ...data,
          timestamp: data.timestamp || new Date(),
        });
      } catch (err) {
        console.warn('[AnalysisSnapshotService] MongoDB create failed, caching in memory:', err);
      }
    }

    if (!saved) {
      saved = {
        ...data,
        _id: `snapshot-${Date.now()}`,
        timestamp: data.timestamp || new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    this.storeMemorySnapshot(saved);
    return saved as IAnalysisSnapshot;
  }

  /**
   * Stores a snapshot in memory (for offline fallback or tests).
   */
  static storeMemorySnapshot(snapshot: any): void {
    const list = memorySnapshots.get(snapshot.repositoryId) || [];
    list.unshift(snapshot as IAnalysisSnapshot);
    memorySnapshots.set(snapshot.repositoryId, list);
  }

  /**
   * Retrieves snapshots for a repository, ordered by newest first.
   */
  static async getSnapshots(repositoryId: string, limit: number = 20): Promise<IAnalysisSnapshot[]> {
    const isDbConnected = getDatabaseStatus().isConnected;
    if (isDbConnected) {
      try {
        const docs = await AnalysisSnapshot.find({ repositoryId }).sort({ timestamp: -1 }).limit(limit);
        if (docs && docs.length > 0) return docs;
      } catch (err) {
        console.warn('[AnalysisSnapshotService] MongoDB find failed, checking memory:', err);
      }
    }

    const list = memorySnapshots.get(repositoryId) || [];
    return list.slice(0, limit);
  }

  /**
   * Gets the immediately preceding snapshot for a repository.
   */
  static async getLatestPreviousSnapshot(
    repositoryId: string,
    currentAnalysisId: string
  ): Promise<IAnalysisSnapshot | null> {
    const snapshots = await this.getSnapshots(repositoryId, 10);
    // Find the first snapshot that is NOT the current analysisId
    const previous = snapshots.find((s) => s.analysisId !== currentAnalysisId);
    return previous || null;
  }

  /**
   * Clears memory store (testing).
   */
  static clearMemory(): void {
    memorySnapshots.clear();
  }
}
