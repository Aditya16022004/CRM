/**
 * Proposal Controller
 * Handles CRUD operations for proposals with snapshot logic
 *
 * NOTE: This is an in-memory implementation so you can
 * build and test the UI before wiring PostgreSQL.
 */

import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { getDb } from '../db.js';
import { NotificationService } from '../services/notificationService.js';

type ProposalItem = {
  id: string;
  inventoryItemId?: string;
  snapshotName?: string;
  snapshotMake?: string;
  snapshotModel?: string;
  snapshotPrice?: number;
  snapshotSpecs?: Record<string, any>;
  quantity: number;
  discount?: number;
  lineTotal: number;
};

type ProposalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED';

type Proposal = {
  id: string;
  proposalNumber: string;
  proposalTitle?: string | null;
  clientId: string;
  createdBy?: string;
  status: ProposalStatus;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  validUntil?: string;
  notes?: string;
  termsConditions?: string;
  version: number;
  parentId?: string;
  isPreviewed: boolean;
  items: ProposalItem[];
  createdAt: string;
  updatedAt: string;
};

function mapProposal(row: any, items: ProposalItem[]): Proposal {
  const { projectId: _projectId, ...rest } = row;
  return {
    ...rest,
    isPreviewed: Boolean(row.isPreviewed),
    items,
  } as Proposal;
}

function mapProposalItem(row: any): ProposalItem {
  return {
    ...row,
    snapshotSpecs: row.snapshotSpecs ? JSON.parse(row.snapshotSpecs) : undefined,
  } as ProposalItem;
}

export class ProposalController {
  /**
   * GET /api/proposals
   * Get all proposals with pagination and filtering
   */
  static async getAll(req: Request, res: Response) {
    const db = await getDb();
    const proposalRows = await db.all(
      'SELECT * FROM proposals ORDER BY createdAt DESC'
    );

    const clientIds = Array.from(new Set(proposalRows.map((p: any) => p.clientId).filter(Boolean)));
    const clientMap: Record<string, any> = {};
    if (clientIds.length) {
      const placeholders = clientIds.map(() => '?').join(',');
      const clients = await db.all(
        `SELECT * FROM clients WHERE id IN (${placeholders})`,
        clientIds
      );
      clients.forEach((c: any) => {
        clientMap[c.id] = c;
      });
    }

    const proposalIds = proposalRows.map((p: any) => p.id);
    let itemsByProposal = new Map<string, ProposalItem[]>();

    if (proposalIds.length > 0) {
      const placeholders = proposalIds.map(() => '?').join(',');
      const itemRows = await db.all(
        `SELECT * FROM proposal_items WHERE proposalId IN (${placeholders})`,
        proposalIds
      );

      for (const row of itemRows) {
        const item = mapProposalItem(row);
        const list = itemsByProposal.get(row.proposalId) || [];
        list.push(item);
        itemsByProposal.set(row.proposalId, list);
      }
    }

    return res.json({
      success: true,
      data: proposalRows.map((row: any) => {
        const proposal = mapProposal(row, itemsByProposal.get(row.id) || []);
        const client = proposal.clientId ? clientMap[proposal.clientId] : undefined;
        return {
          ...proposal,
          client: client
            ? {
                ...client,
                taxExempt: Boolean(client.taxExempt),
                isActive: Boolean(client.isActive),
              }
            : undefined,
          createdBy: proposal.createdBy || row.createdBy,
        };
      }),
    });
  }

  /**
   * GET /api/proposals/:id
   * Get a single proposal
   */
  static async getById(req: Request, res: Response) {
    const { id } = req.params;
    const db = await getDb();
    const proposalRow = await db.get('SELECT * FROM proposals WHERE id = ?', id);

    if (!proposalRow) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    const itemRows = await db.all(
      'SELECT * FROM proposal_items WHERE proposalId = ?',
      id
    );

    return res.json({
      success: true,
      data: mapProposal(proposalRow, itemRows.map(mapProposalItem)),
    });
  }

  /**
   * POST /api/proposals
   * Create a new proposal with snapshot data
   */
  static async create(req: Request, res: Response) {
    const { clientId, items, taxRate = 0, notes, termsConditions, validUntil, createdBy, proposalTitle } =
      req.body as {
        clientId: string;
        items: any[];
        taxRate?: number;
        notes?: string;
        termsConditions?: string;
        validUntil?: string;
        createdBy?: string;
        proposalTitle?: string;
      };

    const now = new Date().toISOString();
    const db = await getDb();
    await db.exec('BEGIN;');
    let proposalNumber = 'PROP-1000';
    try {
      const seqRow = await db.get<{ value: number }>(
        'SELECT value FROM proposal_sequence WHERE id = 1'
      );
      const seqValue = seqRow?.value ?? 1000;
      proposalNumber = `PROP-${seqValue}`;
      await db.run('UPDATE proposal_sequence SET value = value + 1 WHERE id = 1');
    } catch (error) {
      await db.exec('ROLLBACK;');
      throw error;
    }

    const proposalItems: ProposalItem[] = items.map((item) => {
      const price = item.snapshotPrice ?? 0;
      const qty = item.quantity ?? 1;
      const discount = item.discount ?? 0;
      const subtotal = price * qty;
      const discountAmount = (subtotal * discount) / 100;
      const lineTotal = item.lineTotal ?? subtotal - discountAmount;

      return {
        id: randomUUID(),
        inventoryItemId: item.inventoryItemId,
        snapshotName: item.snapshotName,
        snapshotMake: item.snapshotMake,
        snapshotModel: item.snapshotModel,
        snapshotPrice: price,
        snapshotSpecs: item.snapshotSpecs,
        quantity: qty,
        discount,
        lineTotal,
      };
    });

    const subtotal = proposalItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0
    );
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    const proposal: Proposal = {
      id: randomUUID(),
      proposalNumber,
      proposalTitle: proposalTitle?.trim() || null,
      clientId,
      createdBy,
      status: 'DRAFT',
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      validUntil,
      notes,
      termsConditions,
      version: 1,
      parentId: undefined,
      isPreviewed: false,
      items: proposalItems,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.run(
        `INSERT INTO proposals (
          id, proposalNumber, proposalTitle, clientId, createdBy, status,
          subtotal, taxRate, taxAmount, totalAmount, validUntil,
          notes, termsConditions, version, parentId, isPreviewed,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ,
        proposal.id,
        proposal.proposalNumber,
        proposal.proposalTitle ?? null,
        proposal.clientId,
        proposal.createdBy ?? null,
        proposal.status,
        proposal.subtotal,
        proposal.taxRate,
        proposal.taxAmount,
        proposal.totalAmount,
        proposal.validUntil ?? null,
        proposal.notes ?? null,
        proposal.termsConditions ?? null,
        proposal.version,
        proposal.parentId ?? null,
        proposal.isPreviewed ? 1 : 0,
        proposal.createdAt,
        proposal.updatedAt
      );

      for (const item of proposalItems) {
        await db.run(
          `INSERT INTO proposal_items (
            id, proposalId, inventoryItemId, snapshotName, snapshotMake,
            snapshotModel, snapshotPrice, snapshotSpecs, quantity, discount, lineTotal
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ,
          item.id,
          proposal.id,
          item.inventoryItemId ?? null,
          item.snapshotName ?? null,
          item.snapshotMake ?? null,
          item.snapshotModel ?? null,
          item.snapshotPrice ?? null,
          item.snapshotSpecs ? JSON.stringify(item.snapshotSpecs) : null,
          item.quantity,
          item.discount ?? null,
          item.lineTotal
        );
      }

      await db.exec('COMMIT;');
    } catch (error) {
      await db.exec('ROLLBACK;');
      throw error;
    }

    // Log audit entry for proposal creation
    const auditData = {
      entity: 'Proposal',
      recordId: proposal.id,
      action: 'CREATE',
      newValues: {
        proposalNumber: proposal.proposalNumber,
          proposalTitle: proposal.proposalTitle,
        clientId: proposal.clientId,
        createdBy: proposal.createdBy,
        status: proposal.status,
        totalAmount: proposal.totalAmount,
        itemCount: proposalItems.length,
      },
    };

    const users = await db.all(`SELECT id FROM users WHERE isActive = 1`);
    const admins = await db.all(`SELECT id FROM admins WHERE isActive = 1`);
    const recipients = [...users, ...admins].map((r: any) => r.id as string);
    NotificationService.addForUsers(recipients, {
      title: 'Proposal created',
      message: `${req.user?.firstName || 'User'} created proposal ${proposal.proposalNumber}`,
      type: 'ACTION',
      entity: 'Proposal',
      recordId: proposal.id,
    });

    return res.status(201).json({
      success: true,
      data: proposal,
      auditData,
    });
  }

  /**
   * PATCH /api/proposals/:id/status
   * Update proposal status
   */
  static async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body as { status: ProposalStatus };
    const db = await getDb();
    const proposal = await db.get('SELECT * FROM proposals WHERE id = ?', id);
    if (!proposal) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    const updatedAt = new Date().toISOString();
    await db.run(
      'UPDATE proposals SET status = ?, updatedAt = ? WHERE id = ?',
      status,
      updatedAt,
      id
    );

    const auditData = {
      entity: 'Proposal',
      recordId: id,
      action: 'UPDATE',
      oldValues: {
        status: proposal.status,
      },
      newValues: {
        status,
        updatedAt,
      },
    };

    const users = await db.all(`SELECT id FROM users WHERE isActive = 1`);
    const admins = await db.all(`SELECT id FROM admins WHERE isActive = 1`);
    const recipients = [...users, ...admins].map((r: any) => r.id as string);
    NotificationService.addForUsers(recipients, {
      title: 'Proposal status updated',
      message: `${req.user?.firstName || 'User'} set proposal ${proposal.proposalNumber || id} to ${status}`,
      type: 'ACTION',
      entity: 'Proposal',
      recordId: id,
    });

    return res.json({
      success: true,
      data: { ...proposal, status, updatedAt },
      auditData,
    });
  }

  /**
   * PATCH /api/proposals/:id/previewed
   * Mark proposal as previewed
   */
  static async markPreviewed(req: Request, res: Response) {
    const { id } = req.params;
    const db = await getDb();
    const proposal = await db.get('SELECT * FROM proposals WHERE id = ?', id);

    if (!proposal) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    const updatedAt = new Date().toISOString();
    await db.run(
      'UPDATE proposals SET isPreviewed = 1, updatedAt = ? WHERE id = ?',
      updatedAt,
      id
    );

    const auditData = {
      entity: 'Proposal',
      recordId: id,
      action: 'UPDATE',
      oldValues: {
        isPreviewed: proposal.isPreviewed,
      },
      newValues: {
        isPreviewed: 1,
        updatedAt,
      },
    };

    return res.json({
      success: true,
      data: { ...proposal, isPreviewed: 1, updatedAt },
      auditData,
    });
  }

  /**
   * DELETE /api/proposals/:id
   * Delete a proposal (only drafts in a real system)
   */
  static async delete(req: Request, res: Response) {
    const { id } = req.params;
    const db = await getDb();
    const proposal = await db.get('SELECT * FROM proposals WHERE id = ?', id);

    if (!proposal) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }

    await db.exec('BEGIN;');
    try {
      await db.run('DELETE FROM proposal_items WHERE proposalId = ?', id);
      await db.run('DELETE FROM proposals WHERE id = ?', id);
      await db.exec('COMMIT;');
    } catch (error) {
      await db.exec('ROLLBACK;');
      throw error;
    }

    const auditData = {
      entity: 'Proposal',
      recordId: id,
      action: 'DELETE',
      oldValues: {
        proposalNumber: proposal.proposalNumber,
        clientId: proposal.clientId,
        status: proposal.status,
        totalAmount: proposal.totalAmount,
      },
    };
    
      const users = await db.all(`SELECT id FROM users WHERE isActive = 1`);
      const admins = await db.all(`SELECT id FROM admins WHERE isActive = 1`);
      const recipients = [...users, ...admins].map((r: any) => r.id as string);
      NotificationService.addForUsers(recipients, {
        title: 'Proposal deleted',
        message: `${req.user?.firstName || 'User'} deleted proposal ${proposal.proposalNumber || id}`,
        type: 'ACTION',
        entity: 'Proposal',
        recordId: id,
      });

    return res.json({ success: true, data: proposal, auditData });
  }
}
