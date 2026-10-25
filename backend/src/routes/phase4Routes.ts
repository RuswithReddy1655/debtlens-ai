import { Router } from 'express';
import { Phase4Controller } from '../controllers/phase4Controller';
import { authenticate, requireRole } from '../middleware/auth';

export const githubRouter = Router();
githubRouter.get('/connect', Phase4Controller.getGitHubConnectUrl);
githubRouter.get('/callback', Phase4Controller.handleGitHubCallback);
githubRouter.get('/repositories', Phase4Controller.getGitHubRepositories);

export const connectionRouter = Router();
connectionRouter.get('/', Phase4Controller.getConnections);
connectionRouter.post('/', authenticate, requireRole(['admin', 'engineer']), Phase4Controller.connectRepository);
connectionRouter.patch('/:id/schedule', authenticate, requireRole(['admin']), Phase4Controller.updateSchedule);
connectionRouter.post('/:id/disconnect', authenticate, requireRole(['admin']), Phase4Controller.disconnectRepository);
connectionRouter.post('/:id/analyze', authenticate, requireRole(['admin', 'engineer']), Phase4Controller.triggerAnalysis);

export const debtRouter = Router();
debtRouter.get('/', Phase4Controller.getDebtItems);
debtRouter.get('/:id', Phase4Controller.getDebtItemById);
debtRouter.patch('/:id/status', Phase4Controller.updateDebtStatus);
debtRouter.patch('/:id/assignment', Phase4Controller.assignDebtItem);
debtRouter.post('/:id/link', Phase4Controller.linkDebtWork);
debtRouter.post('/:id/verify', Phase4Controller.verifyDebtItem);

export const goalRouter = Router();
goalRouter.get('/', Phase4Controller.getGoals);
goalRouter.post('/', authenticate, requireRole(['admin', 'engineer']), Phase4Controller.createGoal);
goalRouter.get('/:id', Phase4Controller.getGoalById);
goalRouter.patch('/:id', authenticate, requireRole(['admin', 'engineer']), Phase4Controller.updateGoal);
goalRouter.delete('/:id', authenticate, requireRole(['admin']), Phase4Controller.deleteGoal);

export const alertRouter = Router();
alertRouter.get('/', Phase4Controller.getAlerts);
alertRouter.patch('/:id', Phase4Controller.updateAlertStatus);
alertRouter.post('/dismiss-all', authenticate, requireRole(['admin']), Phase4Controller.dismissAllAlerts);

export const activityRouter = Router();
activityRouter.get('/', Phase4Controller.getActivityLog);

export const webhookRouter = Router();
webhookRouter.post('/github', Phase4Controller.handleGitHubWebhook);
