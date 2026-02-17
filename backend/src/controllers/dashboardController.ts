/**
 * Dashboard Controller
 * Provides real-time summary metrics for the dashboard
 */

import { Request, Response } from 'express';
import { getDb } from '../db.js';

export class DashboardController {
  /**
   * GET /api/dashboard/summary
   * Fetch summary stats and recent proposals
   */
  static async getSummary(req: Request, res: Response) {
    const db = await getDb();

    const activeClientsRow = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM clients WHERE isActive = 1'
    );
    const activeProposalsRow = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM proposals WHERE status != 'REJECTED'"
    );
    const activeDevicesRow = await db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM devices WHERE isActive = 1'
    );
    const totalValueRow = await db.get<{ total: number }>(
      "SELECT COALESCE(SUM(totalAmount), 0) as total FROM proposals WHERE status != 'REJECTED'"
    );

    const recentProposals = await db.all(
      `SELECT
        p.id,
        p.proposalNumber,
        p.totalAmount,
        p.status,
        p.createdAt,
        p.clientId,
        c.companyName as clientName
      FROM proposals p
      LEFT JOIN clients c ON c.id = p.clientId
      ORDER BY p.createdAt DESC
      LIMIT 5`
    );

    return res.json({
      success: true,
      data: {
        activeClients: activeClientsRow?.count || 0,
        activeProposals: activeProposalsRow?.count || 0,
        activeDevices: activeDevicesRow?.count || 0,
        totalValue: totalValueRow?.total || 0,
        recentProposals,
      },
    });
  }
}
