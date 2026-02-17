/**
 * Audit Service
 * Handles tracking and diffing of all database changes
 */

import { getDb } from '../db.js';

interface AuditLogData {
  entity: string;
  recordId: string;
  action: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditLog extends AuditLogData {
  id: string;
  timestamp: string;
}

function mapAuditLog(row: any): AuditLog {
  return {
    ...row,
    oldValues: row.oldValues ? JSON.parse(row.oldValues) : undefined,
    newValues: row.newValues ? JSON.parse(row.newValues) : undefined,
  } as AuditLog;
}

export class AuditService {
  /**
   * Create an audit log entry
   */
  static async log(data: AuditLogData) {
    const auditLog: AuditLog = {
      ...data,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    const db = await getDb();
    await db.run(
      `INSERT INTO audit_logs (
        id, entity, recordId, action, oldValues, newValues,
        userId, ipAddress, userAgent, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ,
      auditLog.id,
      auditLog.entity,
      auditLog.recordId,
      auditLog.action,
      auditLog.oldValues ? JSON.stringify(auditLog.oldValues) : null,
      auditLog.newValues ? JSON.stringify(auditLog.newValues) : null,
      auditLog.userId ?? null,
      auditLog.ipAddress ?? null,
      auditLog.userAgent ?? null,
      auditLog.timestamp
    );

    console.log('Audit log created:', auditLog);
    return auditLog;
  }

  /**
   * Create a diff between old and new objects
   * Only includes fields that actually changed
   */
  static createDiff(
    oldObj: Record<string, any>,
    newObj: Record<string, any>
  ): { old: Record<string, any>; new: Record<string, any> } {
    const diff: { old: Record<string, any>; new: Record<string, any> } = {
      old: {},
      new: {},
    };

    // Fields to exclude from audit (sensitive or large data)
    const excludeFields = [
      'passwordHash',
      'password',
      'createdAt',
      'updatedAt',
    ];

    const allKeys = new Set([
      ...Object.keys(oldObj || {}),
      ...Object.keys(newObj || {}),
    ]);

    allKeys.forEach((key) => {
      if (excludeFields.includes(key)) return;

      const oldValue = oldObj?.[key];
      const newValue = newObj?.[key];

      // Compare values (handle dates and objects)
      const oldStr = JSON.stringify(oldValue);
      const newStr = JSON.stringify(newValue);

      if (oldStr !== newStr) {
        diff.old[key] = oldValue;
        diff.new[key] = newValue;
      }
    });

    return diff;
  }

  /**
   * Get all audit logs with optional filtering
   */
  static async getAll(params?: {
    entity?: string;
    recordId?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }) {
    const db = await getDb();
    const whereClauses: string[] = [];
    const values: any[] = [];

    if (params?.entity) {
      whereClauses.push('entity = ?');
      values.push(params.entity);
    }
    if (params?.recordId) {
      whereClauses.push('recordId = ?');
      values.push(params.recordId);
    }
    if (params?.userId) {
      whereClauses.push('userId = ?');
      values.push(params.userId);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const offset = params?.offset || 0;
    const limit = params?.limit || 100;

    const totalRow = await db.get<{ total: number }>(
      `SELECT COUNT(*) as total FROM audit_logs ${whereSql}`,
      values
    );

    const logs = await db.all(
      `SELECT * FROM audit_logs ${whereSql} ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    return { logs: logs.map(mapAuditLog), total: totalRow?.total || 0 };
  }

  /**
   * Get logs for a specific entity and record
   */
  static async getByEntityRecord(entity: string, recordId: string) {
    const db = await getDb();
    const rows = await db.all(
      'SELECT * FROM audit_logs WHERE entity = ? AND recordId = ? ORDER BY timestamp DESC',
      entity,
      recordId
    );

    return rows.map(mapAuditLog);
  }
}
