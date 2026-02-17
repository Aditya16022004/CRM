/**
 * API Routes
 * Defines all API endpoints
 */

import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { InventoryController } from '../controllers/inventoryController.js';
import { ClientController } from '../controllers/clientController.js';
import { ProposalController } from '../controllers/proposalController.js';
import { AuditController } from '../controllers/auditController.js';
import { DashboardController } from '../controllers/dashboardController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateBody, schemas } from '../middleware/validation.js';
import { UserController } from '../controllers/userController.js';
import { NotificationController } from '../controllers/notificationController.js';
import { ProfileController } from '../controllers/profileController.js';

const router = Router();

// ============ Auth Routes ============
router.post('/auth/login', validateBody(schemas.login), AuthController.login);
router.post('/auth/admin/login', validateBody(schemas.login), AuthController.adminLogin);
router.post('/auth/refresh', AuthController.refresh);
router.post('/auth/logout', AuthController.logout);
router.get('/auth/me', authenticateToken, AuthController.me);

// ============ User Management (Admin/Superadmin) ============
router.get(
  '/users',
  authenticateToken,
  requireRole('ADMIN', 'SUPERADMIN'),
  UserController.list
);
router.post(
  '/users',
  authenticateToken,
  requireRole('ADMIN', 'SUPERADMIN'),
  validateBody(schemas.createUser),
  UserController.create
);
router.delete(
  '/users/:id',
  authenticateToken,
  requireRole('ADMIN', 'SUPERADMIN'),
  UserController.remove
);
router.post(
  '/users/:id/promote',
  authenticateToken,
  requireRole('SUPERADMIN'),
  UserController.promote
);
router.post(
  '/users/:id/demote',
  authenticateToken,
  requireRole('SUPERADMIN'),
  UserController.demote
);

// ============ Device Routes (Master Catalog) ============
router.get('/devices', authenticateToken, InventoryController.getAll);
router.get('/devices/:id', authenticateToken, InventoryController.getById);
router.post(
  '/devices',
  authenticateToken,
  requireRole('ADMIN', 'SUPERADMIN'),
  validateBody(schemas.device),
  InventoryController.create
);
router.put(
  '/devices/:id',
  authenticateToken,
  requireRole('ADMIN', 'SUPERADMIN'),
  validateBody(schemas.device),
  InventoryController.update
);
router.delete(
  '/devices/:id',
  authenticateToken,
  requireRole('ADMIN', 'SUPERADMIN'),
  InventoryController.delete
);

// ============ Client Routes ============
router.get('/clients', authenticateToken, ClientController.getAll);
router.get('/clients/:id', authenticateToken, ClientController.getById);
router.post(
  '/clients',
  authenticateToken,
  validateBody(schemas.client),
  ClientController.create
);
router.put(
  '/clients/:id',
  authenticateToken,
  validateBody(schemas.client),
  ClientController.update
);
router.delete(
  '/clients/:id',
  authenticateToken,
  requireRole('ADMIN'),
  ClientController.delete
);


// ============ Proposal Routes ============
router.get('/proposals', authenticateToken, ProposalController.getAll);
router.get('/proposals/:id', authenticateToken, ProposalController.getById);
router.post(
  '/proposals',
  authenticateToken,
  validateBody(schemas.proposal),
  ProposalController.create
);
router.patch(
  '/proposals/:id/status',
  authenticateToken,
  validateBody(schemas.updateProposalStatus),
  ProposalController.updateStatus
);
router.patch(
  '/proposals/:id/previewed',
  authenticateToken,
  ProposalController.markPreviewed
);
router.delete(
  '/proposals/:id',
  authenticateToken,
  ProposalController.delete
);

// ============ Audit Routes ============
router.get(
  '/audit',
  authenticateToken,
  requireRole('ADMIN', 'USER'),
  AuditController.getAll
);
router.get(
  '/audit/:entity/:recordId',
  authenticateToken,
  requireRole('ADMIN', 'USER'),
  AuditController.getByEntityRecord
);

// ============ Dashboard Routes ============
router.get(
  '/dashboard/summary',
  authenticateToken,
  DashboardController.getSummary
);

// ============ Notifications ============
router.get('/notifications', authenticateToken, NotificationController.listMine);
router.post('/notifications/read', authenticateToken, NotificationController.markRead);
router.post('/notifications/clear', authenticateToken, NotificationController.clear);

// ============ Profile / Settings ============
router.post('/profile/request-change', authenticateToken, ProfileController.requestChange);
router.get(
  '/profile/requests',
  authenticateToken,
  requireRole('ADMIN', 'SUPERADMIN'),
  ProfileController.listRequests
);
router.get('/profile/approval', authenticateToken, ProfileController.myApproval);
router.post(
  '/profile/requests/:id/decision',
  authenticateToken,
  requireRole('ADMIN', 'SUPERADMIN'),
  ProfileController.decide
);
router.post('/profile/update', authenticateToken, ProfileController.updateSelf);

export default router;
