import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Repository } from '../models/Repository';
import { DemoDataService } from '../services/demoDataService';
import { getDatabaseStatus } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { RepositorySecurityService } from '../services/repository/RepositorySecurityService';
import { config } from '../config/env';

export const createRepositorySchema = z.object({
  name: z.string().max(100).optional(),
  owner: z.string().max(100).optional(),
  url: z.string().min(1, 'Repository URL is required').max(2048, 'Repository URL exceeds maximum allowed length of 2048 characters'),
  defaultBranch: z.string().default('main'),
  description: z.string().max(500).optional().default(''),
});

// In-memory store for newly registered repositories if MongoDB is in offline fallback mode
const offlineRepoStore = new Map<string, any>();

export class RepositoryController {
  static getOfflineRepository(id: string): any {
    return offlineRepoStore.get(id);
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dbStatus = getDatabaseStatus();

      // If connected to MongoDB, query DB; otherwise serve demo repositories + offline registered
      if (dbStatus.isConnected) {
        const dbRepos = await Repository.find().sort({ updatedAt: -1 }).lean();
        if (dbRepos.length > 0) {
          res.json({
            success: true,
            count: dbRepos.length,
            isDemoSource: false,
            data: dbRepos,
          });
          return;
        }
      }

      // Fallback to Demo Data Service combined with any locally registered repos
      const demoRepos = DemoDataService.getRepositories();
      const offlineRepos = Array.from(offlineRepoStore.values());
      const combined = [...offlineRepos, ...demoRepos];

      res.json({
        success: true,
        count: combined.length,
        isDemoSource: offlineRepos.length === 0,
        disclaimer: 'Benchmark demo repositories provided for architecture and UI validation.',
        data: combined,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const dbStatus = getDatabaseStatus();

      if (dbStatus.isConnected && id.match(/^[0-9a-fA-F]{24}$/)) {
        const repo = await Repository.findById(id).lean();
        if (repo) {
          res.json({ success: true, isDemoSource: repo.isDemo, data: repo });
          return;
        }
      }

      // Check offline store
      if (offlineRepoStore.has(id)) {
        const repo = offlineRepoStore.get(id);
        res.json({ success: true, isDemoSource: repo.isDemo, data: repo });
        return;
      }

      // Check Demo Repositories
      const demoRepo = DemoDataService.getRepositoryById(id);
      if (demoRepo) {
        res.json({
          success: true,
          isDemoSource: true,
          disclaimer: 'Benchmark demo repository provided for architecture and UI validation.',
          data: demoRepo,
        });
        return;
      }

      throw new AppError(`Repository with ID '${id}' not found.`, 404, 'REPOSITORY_NOT_FOUND');
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = req.body as z.infer<typeof createRepositorySchema>;

      // Validate URL against SSRF and injection
      const urlValidation = RepositorySecurityService.validateUrl(
        validated.url,
        config.allowLocalFixtureRepos
      );

      if (!urlValidation.isValid || !urlValidation.sanitizedUrl) {
        throw new AppError(
          urlValidation.error || 'Invalid repository URL.',
          400,
          'VALIDATION_ERROR'
        );
      }

      // Auto-extract owner and repo name from URL if omitted
      let owner = validated.owner;
      let name = validated.name;

      if (!owner || !name) {
        try {
          const cleanPath = urlValidation.sanitizedUrl.replace(/\.git$/i, '');
          const parts = cleanPath.split(/[/:]/).filter(Boolean);
          if (parts.length >= 2) {
            name = name || parts[parts.length - 1];
            owner = owner || parts[parts.length - 2];
          }
        } catch {
          // Keep defaults
        }
      }

      name = name || 'repository';
      owner = owner || 'organization';

      const dbStatus = getDatabaseStatus();

      if (dbStatus.isConnected) {
        const existing = await Repository.findOne({ owner, name });
        if (existing) {
          res.status(200).json({
            success: true,
            message: 'Repository already registered.',
            isDemoSource: existing.isDemo,
            data: existing,
          });
          return;
        }

        const newRepo = await Repository.create({
          name,
          owner,
          url: urlValidation.sanitizedUrl,
          defaultBranch: validated.defaultBranch || 'main',
          description: validated.description || '',
          isDemo: false,
          status: 'idle',
        });

        res.status(201).json({
          success: true,
          message: 'Repository registered successfully.',
          isDemoSource: false,
          data: newRepo,
        });
        return;
      }

      // Memory registration if MongoDB is offline
      const mockCreated = {
        _id: `repo-real-${Date.now()}`,
        id: `repo-real-${Date.now()}`,
        name,
        owner,
        url: urlValidation.sanitizedUrl,
        defaultBranch: validated.defaultBranch || 'main',
        description: validated.description || '',
        isDemo: false,
        status: 'idle',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      offlineRepoStore.set(mockCreated._id, mockCreated);

      res.status(201).json({
        success: true,
        message: 'Repository registered in memory mode (MongoDB offline).',
        isDemoSource: false,
        data: mockCreated,
      });
    } catch (error) {
      next(error);
    }
  }

  static getAllRepositories(): any[] {
    const demoRepos = DemoDataService.getRepositories();
    const offlineRepos = Array.from(offlineRepoStore.values());
    return [...offlineRepos, ...demoRepos];
  }
}
