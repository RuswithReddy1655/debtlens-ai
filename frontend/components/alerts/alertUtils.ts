import { EngineeringAlert } from '../../types';

export interface ParsedAlertIntelligence {
  assetName: string;
  assetPath: string;
  isFilePath: boolean;
  whyItMatters: string;
  recommendedAction: string;
  actionEffort?: string;
  actionSavings?: string;
  churn: string;
  complexity: string;
  forecast: string;
  trajectory: 'Accelerating' | 'Worsening' | 'Improving' | 'Stable' | 'Critical' | 'Unavailable';
  trajectoryBadge: string;
  categoryLabel: string;
  categoryBadge: string;
  chain: {
    signal: { title: string; value: string; classification: string };
    complexity: { title: string; value: string; classification: string };
    forecast: { title: string; value: string; classification: string };
    risk: { title: string; value: string; classification: string };
    recommendation: { title: string; value: string; classification: string };
  };
}

export function parseAlertIntelligence(alert: EngineeringAlert): ParsedAlertIntelligence {
  const msg = alert.message || '';
  const title = alert.title || '';
  const metric = alert.metric || '';

  // 1. Asset identification
  let assetPath = '';
  let assetName = '';
  let isFilePath = false;

  // Check if metric looks like a file path
  if (metric && (metric.includes('/') || metric.endsWith('.ts') || metric.endsWith('.js') || metric.endsWith('.tsx') || metric.endsWith('.jsx'))) {
    assetPath = metric;
    assetName = metric.split('/').pop() || metric;
    isFilePath = true;
  } else if (title.includes(':')) {
    const afterColon = title.split(':').slice(1).join(':').trim();
    if (afterColon.includes('/') || afterColon.endsWith('.ts') || afterColon.endsWith('.js')) {
      assetPath = afterColon;
      assetName = afterColon.split('/').pop() || afterColon;
      isFilePath = true;
    }
  }

  // Fallback to checking words in message
  if (!assetPath) {
    const fileMatch = msg.match(/([a-zA-Z0-9_\-\/]+\.(?:ts|tsx|js|jsx|py|go|java))/i);
    if (fileMatch) {
      assetPath = fileMatch[1];
      assetName = assetPath.split('/').pop() || assetPath;
      isFilePath = true;
    } else {
      assetName = metric || 'Repository Core';
      assetPath = metric ? `metric:${metric}` : 'Repository-wide telemetry';
      isFilePath = false;
    }
  }

  // 2. Churn, Complexity, Forecast, Trajectory
  let churn = 'N/A';
  let complexity = 'N/A';
  let forecast = 'N/A';
  let trajectory: ParsedAlertIntelligence['trajectory'] = 'Unavailable';

  // Extract from message or alert fields
  const churnMatch = msg.match(/churn\s*\(([^\)]+)\)/i) || msg.match(/(\d+\s*lines)/i);
  if (churnMatch) {
    churn = churnMatch[1];
  }

  const complexityMatch = msg.match(/complexity\s*\(([^\)]+)\)/i) || msg.match(/complexity:\s*([0-9]+)/i);
  if (complexityMatch) {
    complexity = complexityMatch[1];
  } else if (metric === 'complexity' && alert.currentValue !== undefined) {
    complexity = `${alert.currentValue}`;
  }

  const forecastMatch = msg.match(/projected\s*([+\-0-9%]+)/i) || msg.match(/forecast[a-z]*\s*([+\-0-9%]+)/i);
  if (forecastMatch) {
    forecast = forecastMatch[1];
  } else if (alert.previousValue !== undefined && alert.currentValue !== undefined) {
    const diff = alert.currentValue - alert.previousValue;
    forecast = `${diff > 0 ? '+' : ''}${diff} pts`;
  }

  // Trajectory determination
  if (alert.type === 'ACCELERATING_DEBT' || msg.toLowerCase().includes('accelerat')) {
    trajectory = 'Accelerating';
  } else if (alert.severity === 'CRITICAL' || msg.toLowerCase().includes('critical')) {
    trajectory = 'Critical';
  } else if (alert.type === 'DEBT_SCORE_INCREASED' || msg.toLowerCase().includes('worsened')) {
    trajectory = 'Worsening';
  } else if (msg.toLowerCase().includes('improv')) {
    trajectory = 'Improving';
  } else if (alert.severity === 'INFO') {
    trajectory = 'Stable';
  } else {
    trajectory = 'Worsening';
  }

  // Trajectory badge styling
  let trajectoryBadge = 'bg-zinc-800 text-zinc-300 border-zinc-700';
  if (trajectory === 'Accelerating') {
    trajectoryBadge = 'bg-rose-950/80 text-rose-300 border-rose-800';
  } else if (trajectory === 'Critical') {
    trajectoryBadge = 'bg-rose-950/60 text-rose-400 border-rose-800/80';
  } else if (trajectory === 'Worsening') {
    trajectoryBadge = 'bg-amber-950/80 text-amber-300 border-amber-800';
  } else if (trajectory === 'Improving') {
    trajectoryBadge = 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
  } else if (trajectory === 'Stable') {
    trajectoryBadge = 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
  }

  // 3. Why this matters
  let whyItMatters = '';
  if (alert.type === 'PREDICTED_CRITICAL_HOTSPOT') {
    whyItMatters = 'Elevated code churn combined with cyclomatic branching complexity is accelerating this file toward critical risk status.';
  } else if (alert.type === 'DEBT_REOPENED') {
    whyItMatters = 'The attempted refactor pull request failed telemetry verification. Branching complexity and rework churn did not improve to required thresholds.';
  } else if (alert.type === 'CRITICAL_HOTSPOT_INCREASED') {
    whyItMatters = `Recent commit activity created or degraded ${alert.currentValue || 'new'} critical hotspots, increasing architectural fragility.`;
  } else if (alert.type === 'DEBT_SCORE_INCREASED') {
    whyItMatters = 'Repository-wide technical debt score exhibited significant upward drift, indicating code complexity is outpacing refactoring.';
  } else if (alert.type === 'ACCELERATING_DEBT') {
    whyItMatters = 'Telemetry slope across recent cycles reveals compounding maintenance drag and destabilizing churn.';
  } else if (alert.type === 'FORECASTED_EXPOSURE_INCREASE') {
    whyItMatters = 'Projected capacity drag will increase significantly if unaddressed, diverting senior engineering bandwidth into avoidable rework.';
  } else if (alert.type === 'PREDICTED_GOAL_MISS') {
    whyItMatters = 'Current burn-down velocity indicates active engineering commitments will miss target completion dates.';
  } else {
    whyItMatters = msg.split('. ')[0] + '.';
  }

  // 4. Recommended Action
  let recommendedAction = '';
  const actionMatch = msg.match(/Action:\s*([^.]+)/i);
  if (actionMatch) {
    recommendedAction = actionMatch[1].trim();
  } else if (alert.type === 'PREDICTED_CRITICAL_HOTSPOT') {
    recommendedAction = 'Refactor and decouple decision branches within the next sprint to halt complexity momentum.';
  } else if (alert.type === 'DEBT_REOPENED') {
    recommendedAction = 'Re-open refactoring task. Inspect cyclomatic branches and verify changes against AST metrics before merging.';
  } else if (alert.type === 'CRITICAL_HOTSPOT_INCREASED') {
    recommendedAction = 'Prioritize top quick-win hotspots in current sprint planning to restore baseline health.';
  } else if (alert.type === 'DEBT_SCORE_INCREASED') {
    recommendedAction = 'Allocate 15-20% capacity in next sprint to high-churn hotspot stabilization.';
  } else if (alert.type === 'FORECASTED_EXPOSURE_INCREASE') {
    recommendedAction = 'Execute targeted remediation on top 5 impact hotspots to avoid modeled capacity inflation.';
  } else if (alert.type === 'PREDICTED_GOAL_MISS') {
    recommendedAction = 'Adjust sprint velocity or reduce scope to realign goal with projected trajectory.';
  } else {
    recommendedAction = 'Inspect affected telemetry and plan remediation in next engineering cycle.';
  }

  // 5. Category label & badge
  let categoryLabel = 'SYSTEM TELEMETRY';
  let categoryBadge = 'bg-zinc-800 text-zinc-300 border-zinc-700';

  if (
    alert.type === 'PREDICTED_CRITICAL_HOTSPOT' ||
    alert.type === 'ACCELERATING_DEBT' ||
    alert.type === 'FORECASTED_EXPOSURE_INCREASE' ||
    alert.type === 'PREDICTED_GOAL_MISS' ||
    alert.type === 'RISK_ESCALATION'
  ) {
    categoryLabel = 'PREDICTIVE SIGNAL';
    categoryBadge = 'bg-indigo-950/70 text-indigo-300 border-indigo-800/80';
  } else if (alert.type === 'DEBT_REOPENED') {
    categoryLabel = 'VERIFICATION AUDIT';
    categoryBadge = 'bg-rose-950/70 text-rose-300 border-rose-800/80';
  } else if (
    alert.type === 'CRITICAL_HOTSPOT_INCREASED' ||
    alert.type === 'DEBT_SCORE_INCREASED' ||
    alert.type === 'EXPOSURE_INCREASED' ||
    alert.type === 'NEW_CRITICAL_DEBT'
  ) {
    categoryLabel = 'DEBT REGRESSION';
    categoryBadge = 'bg-amber-950/70 text-amber-300 border-amber-800/80';
  } else if (alert.type === 'GOAL_AT_RISK' || alert.type === 'GOAL_ACHIEVED') {
    categoryLabel = 'GOAL OUTLOOK';
    categoryBadge = 'bg-yellow-950/70 text-yellow-300 border-yellow-800/80';
  }

  // 6. Intelligence Chain
  const chain = {
    signal: {
      title: 'Signal',
      value: churn !== 'N/A' ? `High Churn: ${churn}` : alert.previousValue !== undefined ? `Prior: ${alert.previousValue}` : 'Telemetry Drift',
      classification: 'OBSERVED',
    },
    complexity: {
      title: 'Complexity',
      value: complexity !== 'N/A' ? `AST Branching: ${complexity}` : alert.currentValue !== undefined ? `Current: ${alert.currentValue}` : 'Elevated AST',
      classification: 'DERIVED',
    },
    forecast: {
      title: 'Forecast',
      value: forecast !== 'N/A' ? `Projected: ${forecast}` : `Trend: ${trajectory}`,
      classification: 'MODELED',
    },
    risk: {
      title: 'Risk',
      value: `${alert.severity} Risk Tier`,
      classification: 'DERIVED',
    },
    recommendation: {
      title: 'Action',
      value: recommendedAction.slice(0, 48) + (recommendedAction.length > 48 ? '...' : ''),
      classification: 'ACTIONABLE',
    },
  };

  return {
    assetName,
    assetPath,
    isFilePath,
    whyItMatters,
    recommendedAction,
    actionEffort: '12–22 hrs',
    churn,
    complexity,
    forecast,
    trajectory,
    trajectoryBadge,
    categoryLabel,
    categoryBadge,
    chain,
  };
}
