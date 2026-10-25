'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Repository, Analysis } from '../types';
import { api } from '../services/api';

interface RepositoryContextType {
  repositories: Repository[];
  selectedRepo: Repository | null;
  selectedRepoId: string;
  setSelectedRepoId: (id: string) => void;
  analysis: Analysis | null;
  selectedAnalysis: Analysis | null;
  isLoading: boolean;
  error: string | null;
  financialRate: number;
  setFinancialRate: (rate: number) => void;
  refresh: () => Promise<void>;
  isDemoMode: boolean;
  isHydrated: boolean;
}

const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);

export const RepositoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepoId, setSelectedRepoIdState] = useState<string>('repo-demo-fintech-01');
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [financialRate, setFinancialRate] = useState<number>(95);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const isDemoMode = selectedRepo ? selectedRepo.isDemo : (analysis ? analysis.isDemo : true);

  // Restore persisted repository selection from localStorage strictly after mount
  useEffect(() => {
    setIsHydrated(true);
    try {
      const savedId = localStorage.getItem('debtlens_selected_repo_id');
      if (savedId) {
        setSelectedRepoIdState(savedId);
      }
    } catch {
      // localStorage unavailable or restricted
    }
  }, []);

  const setSelectedRepoId = useCallback((id: string) => {
    setSelectedRepoIdState(id);
    try {
      localStorage.setItem('debtlens_selected_repo_id', id);
    } catch {
      // localStorage unavailable or restricted
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const repoRes = await api.getRepositories();
      setRepositories(repoRes.data);

      const activeRepo =
        repoRes.data.find((r) => r._id === selectedRepoId || r.id === selectedRepoId) ||
        repoRes.data[0];

      if (activeRepo) {
        setSelectedRepo(activeRepo);
        const analysisRes = await api.getAnalysis(activeRepo._id || activeRepo.id || selectedRepoId);
        setAnalysis(analysisRes.data);
      }
    } catch (err) {
      console.warn('[RepositoryProvider] Backend fetch failed, falling back to benchmark baseline:', err);
      // Stable fallback repo with deterministic timestamps
      const fallbackRepo: Repository = {
        _id: 'repo-demo-fintech-01',
        name: 'fintech-core-ledger',
        owner: 'enterprise-payments',
        url: 'https://github.com/enterprise-payments/fintech-core-ledger',
        defaultBranch: 'main',
        isDemo: true,
        primaryLanguage: 'TypeScript',
        status: 'completed',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };
      setRepositories([fallbackRepo]);
      setSelectedRepo(fallbackRepo);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRepoId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <RepositoryContext.Provider
      value={{
        repositories,
        selectedRepo,
        selectedRepoId,
        setSelectedRepoId,
        analysis,
        selectedAnalysis: analysis,
        isLoading,
        error,
        financialRate,
        setFinancialRate,
        refresh: loadData,
        isDemoMode,
        isHydrated,
      }}
    >
      {children}
    </RepositoryContext.Provider>
  );
};

export const useRepository = (): RepositoryContextType => {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error('useRepository must be used within a RepositoryProvider');
  }
  return context;
};
