import {
  Repository,
  Analysis,
  Hotspot,
  FileMetric,
  TrendPoint,
  Recommendation,
  FinancialValuation,
  AnalysisJobStatus,
  FinancialIntelligenceData,
  CostDriverBreakdown,
  PrioritizationResult,
  ScenarioResult,
  ScenarioComparison,
  PortfolioSummary,
  AnalysisComparisonSummary,
  ExecutiveReport,
  CurrencyCode,
  RepositoryConnection,
  AnalysisSnapshot,
  SnapshotComparisonResult,
  DebtItem,
  VerificationResult,
  EngineeringGoal,
  EngineeringAlert,
  AuditEvent,
  GitHubRepoSummary,
  PredictiveAssessment,
  ForecastHorizon,
  CapacityPlanResult,
  AccuracyReport,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

class ApiClient {
  private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.error?.message || `HTTP ${response.status}: Failed to fetch from ${endpoint}`
        );
      }

      return await response.json();
    } catch (error) {
      console.warn(`[API Client] Failed request to ${url}:`, error);
      throw error;
    }
  }

  async checkHealth(): Promise<{ status: string; database?: { isConnected: boolean }; demoMode?: boolean }> {
    return this.fetchJson('/health');
  }

  async getRepositories(): Promise<{ success: boolean; data: Repository[]; isDemoSource: boolean }> {
    return this.fetchJson('/repositories');
  }

  async getRepositoryById(id: string): Promise<{ success: boolean; data: Repository; isDemoSource: boolean }> {
    return this.fetchJson(`/repositories/${id}`);
  }

  async createRepository(payload: {
    name?: string;
    owner?: string;
    url: string;
    defaultBranch?: string;
    description?: string;
  }): Promise<{ success: boolean; data: Repository; message?: string; isDemoSource?: boolean }> {
    return this.fetchJson('/repositories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async startAnalysis(payload: {
    repositoryId: string;
    branch?: string;
    commitHash?: string;
    isDemo?: boolean;
    hourlyRate?: number;
  }): Promise<{ success: boolean; data: Analysis; message?: string; isDemoSource: boolean }> {
    return this.fetchJson('/analyses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAnalysisStatus(id: string): Promise<{
    success: boolean;
    data: AnalysisJobStatus;
    isDemoSource: boolean;
  }> {
    return this.fetchJson(`/analyses/${id}/status`);
  }

  async cancelAnalysis(id: string): Promise<{ success: boolean; message: string }> {
    return this.fetchJson(`/analyses/${id}/cancel`, {
      method: 'POST',
    });
  }

  async getAnalysis(id: string): Promise<{ success: boolean; data: Analysis; isDemoSource: boolean }> {
    return this.fetchJson(`/analyses/${id}`);
  }

  async getHotspots(analysisId: string): Promise<{ success: boolean; data: Hotspot[]; isDemoSource: boolean }> {
    return this.fetchJson(`/analyses/${analysisId}/hotspots`);
  }

  async getMetrics(analysisId: string): Promise<{ success: boolean; data: FileMetric[]; isDemoSource: boolean }> {
    return this.fetchJson(`/analyses/${analysisId}/metrics`);
  }

  async getTrends(repoOrAnalysisId: string): Promise<{ success: boolean; data: TrendPoint[]; isDemoSource: boolean }> {
    return this.fetchJson(`/analyses/${repoOrAnalysisId}/trends`);
  }

  async getRecommendations(
    analysisId: string
  ): Promise<{ success: boolean; data: Recommendation[]; isDemoSource: boolean }> {
    return this.fetchJson(`/analyses/${analysisId}/recommendations`);
  }

  async getCost(
    analysisId: string,
    hourlyRate?: number
  ): Promise<{ success: boolean; data: FinancialValuation; isDemoSource: boolean }> {
    const query = hourlyRate ? `?hourlyRate=${hourlyRate}` : '';
    return this.fetchJson(`/analyses/${analysisId}/cost${query}`);
  }

  // ==========================================
  // Phase 3: Financial Intelligence & Decision Support
  // ==========================================

  async getFinancialIntelligence(
    analysisId: string,
    currency?: CurrencyCode,
    hourlyRate?: number
  ): Promise<{ success: boolean; data: FinancialIntelligenceData; isDemoSource: boolean }> {
    const params = new URLSearchParams();
    if (currency) params.set('currency', currency);
    if (hourlyRate) params.set('hourlyRate', hourlyRate.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.fetchJson(`/analyses/${analysisId}/financial-intelligence${query}`);
  }

  async getCostDrivers(
    analysisId: string,
    currency?: CurrencyCode,
    hourlyRate?: number
  ): Promise<{ success: boolean; data: CostDriverBreakdown; isDemoSource: boolean }> {
    const params = new URLSearchParams();
    if (currency) params.set('currency', currency);
    if (hourlyRate) params.set('hourlyRate', hourlyRate.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.fetchJson(`/analyses/${analysisId}/cost-drivers${query}`);
  }

  async getPriorities(
    analysisId: string,
    currency?: CurrencyCode,
    hourlyRate?: number
  ): Promise<{ success: boolean; data: PrioritizationResult; isDemoSource: boolean }> {
    const params = new URLSearchParams();
    if (currency) params.set('currency', currency);
    if (hourlyRate) params.set('hourlyRate', hourlyRate.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.fetchJson(`/analyses/${analysisId}/priorities${query}`);
  }

  async getSavings(
    analysisId: string,
    currency?: CurrencyCode,
    hourlyRate?: number
  ): Promise<{ success: boolean; data: any; isDemoSource: boolean }> {
    const params = new URLSearchParams();
    if (currency) params.set('currency', currency);
    if (hourlyRate) params.set('hourlyRate', hourlyRate.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.fetchJson(`/analyses/${analysisId}/savings${query}`);
  }

  async runScenario(
    analysisId: string,
    payload: {
      scenarioName: string;
      selectedFilePaths: string[];
      hourlyRate?: number;
      remediationEffectiveness?: number;
      effortMultiplier?: number;
    }
  ): Promise<{ success: boolean; data: ScenarioResult; isDemoSource?: boolean }> {
    return this.fetchJson(`/analyses/${analysisId}/scenarios`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async comparePresets(
    analysisId: string,
    currency?: CurrencyCode,
    hourlyRate?: number
  ): Promise<{ success: boolean; data: ScenarioComparison; isDemoSource: boolean }> {
    const params = new URLSearchParams();
    if (currency) params.set('currency', currency);
    if (hourlyRate) params.set('hourlyRate', hourlyRate.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.fetchJson(`/analyses/${analysisId}/scenarios/presets${query}`);
  }

  async getExecutiveReport(
    analysisId: string,
    repoName?: string,
    currency?: CurrencyCode,
    hourlyRate?: number
  ): Promise<{ success: boolean; data: ExecutiveReport; isDemoSource: boolean }> {
    const params = new URLSearchParams();
    if (repoName) params.set('repoName', repoName);
    if (currency) params.set('currency', currency);
    if (hourlyRate) params.set('hourlyRate', hourlyRate.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.fetchJson(`/analyses/${analysisId}/executive-report${query}`);
  }

  async compareAnalyses(
    baselineAnalysisId: string,
    targetAnalysisId: string,
    currency?: CurrencyCode
  ): Promise<{ success: boolean; data: AnalysisComparisonSummary }> {
    return this.fetchJson(`/analyses/${baselineAnalysisId}/compare`, {
      method: 'POST',
      body: JSON.stringify({ targetAnalysisId, currency }),
    });
  }

  async getPortfolio(
    currency?: CurrencyCode,
    hourlyRate?: number
  ): Promise<{ success: boolean; data: PortfolioSummary }> {
    const params = new URLSearchParams();
    if (currency) params.set('currency', currency);
    if (hourlyRate) params.set('hourlyRate', hourlyRate.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.fetchJson(`/portfolio${query}`);
  }

  // ==========================================
  // PHASE 4 API CLIENT METHODS
  // ==========================================

  // 1. GitHub Integration
  async getGitHubConnectUrl(redirectUri?: string): Promise<{ success: boolean; data: { authUrl: string; state: string } }> {
    const q = redirectUri ? `?redirectUri=${encodeURIComponent(redirectUri)}` : '';
    return this.fetchJson(`/github/connect${q}`);
  }

  async getGitHubRepositories(): Promise<{ success: boolean; data: GitHubRepoSummary[] }> {
    return this.fetchJson('/github/repositories');
  }

  async handleGitHubCallback(code: string, state: string): Promise<{ success: boolean; data: any }> {
    return this.fetchJson(`/github/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`);
  }

  // 2. Repository Connections
  async getConnections(): Promise<{ success: boolean; data: RepositoryConnection[] }> {
    return this.fetchJson('/connections');
  }

  async connectRepository(payload: {
    repositoryId: string;
    repositoryName: string;
    owner?: string;
    provider?: string;
    providerRepositoryId?: string;
    defaultBranch?: string;
    visibility?: string;
    analysisFrequency?: string;
    webhookEnabled?: boolean;
  }): Promise<{ success: boolean; data: RepositoryConnection }> {
    return this.fetchJson('/connections', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateSchedule(
    connectionId: string,
    analysisFrequency: string,
    webhookEnabled?: boolean
  ): Promise<{ success: boolean; data: RepositoryConnection }> {
    return this.fetchJson(`/connections/${connectionId}/schedule`, {
      method: 'PATCH',
      body: JSON.stringify({ analysisFrequency, webhookEnabled }),
    });
  }

  async disconnectRepository(connectionId: string): Promise<{ success: boolean; data: RepositoryConnection }> {
    return this.fetchJson(`/connections/${connectionId}/disconnect`, {
      method: 'POST',
    });
  }

  async triggerConnectionAnalysis(connectionId: string): Promise<{ success: boolean; data: { success: boolean; analysisId: string } }> {
    return this.fetchJson(`/connections/${connectionId}/analyze`, {
      method: 'POST',
    });
  }

  // 3. Snapshots & Comparisons
  async getRepositorySnapshots(repositoryId: string, limit: number = 20): Promise<{ success: boolean; data: AnalysisSnapshot[] }> {
    return this.fetchJson(`/repositories/${repositoryId}/snapshots?limit=${limit}`);
  }

  async getSnapshotComparison(
    repositoryId: string,
    baselineId?: string,
    currentId?: string
  ): Promise<{ success: boolean; data: SnapshotComparisonResult }> {
    const params = new URLSearchParams();
    if (baselineId) params.set('baselineId', baselineId);
    if (currentId) params.set('currentId', currentId);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.fetchJson(`/repositories/${repositoryId}/comparison${q}`);
  }

  // 4. Debt Items & Lifecycle
  async getDebtItems(filter?: {
    repositoryId?: string;
    status?: string;
    priority?: string;
    category?: string;
    assignee?: string;
  }): Promise<{ success: boolean; data: DebtItem[] }> {
    const params = new URLSearchParams();
    if (filter?.repositoryId) params.set('repositoryId', filter.repositoryId);
    if (filter?.status && filter.status !== 'ALL') params.set('status', filter.status);
    if (filter?.priority && filter.priority !== 'ALL') params.set('priority', filter.priority);
    if (filter?.category && filter.category !== 'ALL') params.set('category', filter.category);
    if (filter?.assignee) params.set('assignee', filter.assignee);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.fetchJson(`/debt${q}`);
  }

  async getDebtItemById(id: string): Promise<{ success: boolean; data: DebtItem }> {
    return this.fetchJson(`/debt/${id}`);
  }

  async updateDebtStatus(
    id: string,
    newStatus: string,
    note?: string,
    actor?: string
  ): Promise<{ success: boolean; data: DebtItem }> {
    return this.fetchJson(`/debt/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ newStatus, note, actor }),
    });
  }

  async assignDebtItem(
    id: string,
    assignedTo: string,
    targetDate?: string,
    actor?: string
  ): Promise<{ success: boolean; data: DebtItem }> {
    return this.fetchJson(`/debt/${id}/assignment`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedTo, targetDate, actor }),
    });
  }

  async linkDebtWork(
    id: string,
    payload: {
      commitSha?: string;
      prNumber?: number;
      prUrl?: string;
      branch?: string;
      actor?: string;
    }
  ): Promise<{ success: boolean; data: DebtItem }> {
    return this.fetchJson(`/debt/${id}/link`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async verifyDebtItem(id: string): Promise<{ success: boolean; data: VerificationResult }> {
    return this.fetchJson(`/debt/${id}/verify`, {
      method: 'POST',
    });
  }

  // 5. Engineering Goals
  async getGoals(repositoryId?: string): Promise<{ success: boolean; data: EngineeringGoal[] }> {
    const q = repositoryId ? `?repositoryId=${encodeURIComponent(repositoryId)}` : '';
    return this.fetchJson(`/goals${q}`);
  }

  async createGoal(payload: {
    repositoryId: string;
    title: string;
    description?: string;
    metric: string;
    targetValue: number;
    startingValue: number;
    unit?: string;
    targetDate?: string;
    createdBy?: string;
  }): Promise<{ success: boolean; data: EngineeringGoal }> {
    return this.fetchJson('/goals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getGoalById(id: string): Promise<{ success: boolean; data: EngineeringGoal }> {
    return this.fetchJson(`/goals/${id}`);
  }

  async updateGoal(id: string, updates: Partial<EngineeringGoal>): Promise<{ success: boolean; data: EngineeringGoal }> {
    return this.fetchJson(`/goals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteGoal(id: string): Promise<{ success: boolean; message: string }> {
    return this.fetchJson(`/goals/${id}`, {
      method: 'DELETE',
    });
  }

  // 6. Alerts
  async getAlerts(repositoryId?: string, status?: string): Promise<{ success: boolean; data: EngineeringAlert[] }> {
    const params = new URLSearchParams();
    if (repositoryId) params.set('repositoryId', repositoryId);
    if (status) params.set('status', status);
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.fetchJson(`/alerts${q}`);
  }

  async updateAlertStatus(id: string, status: string): Promise<{ success: boolean; data: EngineeringAlert }> {
    return this.fetchJson(`/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async dismissAllAlerts(repositoryId?: string): Promise<{ success: boolean; message: string }> {
    return this.fetchJson('/alerts/dismiss-all', {
      method: 'POST',
      body: JSON.stringify({ repositoryId }),
    });
  }

  // 7. Activity Log
  async getActivityLog(repositoryId?: string, limit: number = 50): Promise<{ success: boolean; data: AuditEvent[] }> {
    const params = new URLSearchParams();
    if (repositoryId) params.set('repositoryId', repositoryId);
    if (limit) params.set('limit', limit.toString());
    const q = params.toString() ? `?${params.toString()}` : '';
    return this.fetchJson(`/activity${q}`);
  }

  // ==========================================
  // 8. Phase 5 Predictive Intelligence Endpoints
  // ==========================================

  async getPredictiveAssessment(
    repositoryId: string,
    horizon: ForecastHorizon = 'NEXT_ANALYSIS'
  ): Promise<{ success: boolean; data: PredictiveAssessment }> {
    return this.fetchJson(`/predictive/repositories/${repositoryId}?horizon=${horizon}`);
  }

  async getPredictiveForecast(
    repositoryId: string,
    horizon: ForecastHorizon = 'NEXT_ANALYSIS'
  ): Promise<{ success: boolean; data: any }> {
    return this.fetchJson(`/predictive/repositories/${repositoryId}/forecast?horizon=${horizon}`);
  }

  async getPredictiveHotspots(
    repositoryId: string,
    horizon: ForecastHorizon = 'NEXT_ANALYSIS'
  ): Promise<{ success: boolean; data: { predictedHotspots: any[]; fileLevelRiskForecasts: any[] } }> {
    return this.fetchJson(`/predictive/repositories/${repositoryId}/hotspots?horizon=${horizon}`);
  }

  async getPredictiveRisks(repositoryId: string): Promise<{ success: boolean; data: any }> {
    return this.fetchJson(`/predictive/repositories/${repositoryId}/risks`);
  }

  async getPredictiveRecommendations(
    repositoryId: string
  ): Promise<{ success: boolean; data: { recommendations: any[]; feedbackStats: any } }> {
    return this.fetchJson(`/predictive/repositories/${repositoryId}/recommendations`);
  }

  async getPredictiveExposure(repositoryId: string): Promise<{ success: boolean; data: any }> {
    return this.fetchJson(`/predictive/repositories/${repositoryId}/exposure`);
  }

  async getPredictiveGoals(repositoryId: string): Promise<{ success: boolean; data: any[] }> {
    return this.fetchJson(`/predictive/repositories/${repositoryId}/goals`);
  }

  async refreshPredictiveAssessment(
    repositoryId: string,
    horizon: ForecastHorizon = 'NEXT_ANALYSIS',
    currency: string = 'INR'
  ): Promise<{ success: boolean; message: string; data: PredictiveAssessment }> {
    return this.fetchJson(`/predictive/repositories/${repositoryId}/refresh`, {
      method: 'POST',
      body: JSON.stringify({ horizon, currency }),
    });
  }

  async simulatePredictiveScenarios(
    repositoryId: string,
    horizon: ForecastHorizon = 'NEXT_ANALYSIS'
  ): Promise<{ success: boolean; data: { baselineForecast: any; costOfDoingNothing: any; scenarios: any[] } }> {
    return this.fetchJson('/predictive/scenarios', {
      method: 'POST',
      body: JSON.stringify({ repositoryId, horizon }),
    });
  }

  async planPredictiveCapacity(
    repositoryId: string,
    sprintCapacityHours: number = 80
  ): Promise<{ success: boolean; data: CapacityPlanResult }> {
    return this.fetchJson('/predictive/capacity-plan', {
      method: 'POST',
      body: JSON.stringify({ repositoryId, sprintCapacityHours }),
    });
  }

  async submitRecommendationFeedback(
    actionId: string,
    feedback: 'HELPFUL' | 'NOT_HELPFUL' | 'NOT_APPLICABLE',
    userId?: string
  ): Promise<{ success: boolean; message: string }> {
    return this.fetchJson(`/predictive/recommendations/${actionId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ feedback, userId }),
    });
  }

  async getPredictiveAccuracy(repositoryId: string): Promise<{ success: boolean; data: AccuracyReport }> {
    return this.fetchJson(`/predictive/repositories/${repositoryId}/accuracy`);
  }
}

export const api = new ApiClient();
