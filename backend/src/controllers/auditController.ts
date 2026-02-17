/**
 * Audit Controller
 * Handles retrieval of audit logs
 */

import { Request, Response } from 'express';
import { AuditService } from '../services/auditService.js';
import { getDb } from '../db.js';

async function hydrateUsers(userIds: string[]) {
  if (!userIds.length) return {} as Record<string, any>;
  const db = await getDb();

  const placeholders = userIds.map(() => '?').join(',');

  const adminRows = await db.all(
    `SELECT id, email, firstName, lastName, role, isActive FROM admins WHERE id IN (${placeholders})`,
    userIds
  );
  const userRows = await db.all(
    `SELECT id, email, firstName, lastName, role, isActive FROM users WHERE id IN (${placeholders})`,
    userIds
  );

  const map: Record<string, any> = {};
  [...adminRows, ...userRows].forEach((row: any) => {
    map[row.id] = {
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      role: row.role,
      isActive: Boolean(row.isActive),
    };
  });

  return map;
}

export class AuditController {
  /**
   * GET /api/audit
   * Get all audit logs with filtering
   */
  static async getAll(req: Request, res: Response) {
    try {
      const {
        entity,
        recordId,
        userId,
        limit = 50,
        offset = 0,
      } = req.query as any;

      const result = await AuditService.getAll({
        entity,
        recordId,
        userId,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      });

      const ids = Array.from(
        new Set((result.logs || []).map((log) => log.userId).filter(Boolean))
      ) as string[];
      const userMap = await hydrateUsers(ids);

      const logsWithUsers = (result.logs || []).map((log) => ({
        ...log,
        user: log.userId ? userMap[log.userId] || null : null,
      }));

      res.json({ ...result, logs: logsWithUsers });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/audit/:entity/:recordId
   * Get audit logs for a specific entity and record
   */
  static async getByEntityRecord(req: Request, res: Response) {
    try {
      const { entity, recordId } = req.params;

      const logs = await AuditService.getByEntityRecord(entity, recordId);
      const ids = Array.from(
        new Set((logs || []).map((log) => log.userId).filter(Boolean))
      ) as string[];
      const userMap = await hydrateUsers(ids);
      const logsWithUsers = logs.map((log) => ({
        ...log,
        user: log.userId ? userMap[log.userId] || null : null,
      }));

      res.json({ logs: logsWithUsers });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
