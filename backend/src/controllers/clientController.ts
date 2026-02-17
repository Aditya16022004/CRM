/**
 * Client Controller
 * Handles CRUD operations for clients
 *
 * NOTE: This is an in-memory implementation so you can
 * use the UI before wiring PostgreSQL.
 */

import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { getDb } from '../db.js';
import { NotificationService } from '../services/notificationService.js';

type Client = {
  id: string;
  companyName: string;
  billingAddress: string;
  shippingAddress?: string;
  location?: string;
  taxId?: string;
  taxExempt: boolean;
  defaultCurrency: string;
  paymentTerms: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function mapClient(row: any): Client {
  return {
    ...row,
    taxExempt: Boolean(row.taxExempt),
    isActive: Boolean(row.isActive),
  } as Client;
}

export class ClientController {
  /**
   * GET /api/clients
   * Get all clients
   */
  static async getAll(req: Request, res: Response) {
    const db = await getDb();
    const rows = await db.all(
      'SELECT * FROM clients WHERE isActive = 1 ORDER BY createdAt DESC'
    );
    return res.json({
      success: true,
      data: rows.map(mapClient),
    });
  }

  /**
   * GET /api/clients/:id
   * Get a single client
   */
  static async getById(req: Request, res: Response) {
    const { id } = req.params;
    const db = await getDb();
    const row = await db.get(
      'SELECT * FROM clients WHERE id = ? AND isActive = 1',
      id
    );

    if (!row) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    return res.json({ success: true, data: mapClient(row) });
  }

  /**
   * POST /api/clients
   * Create a new client
   */
  static async create(req: Request, res: Response) {
    const {
      companyName,
      billingAddress,
      shippingAddress,
      taxId,
      taxExempt = false,
      defaultCurrency = 'INR',
      paymentTerms = 'Net 30',
      contactName,
      contactEmail,
      contactPhone,
    } = req.body;

    const now = new Date().toISOString();

    const client: Client = {
      id: randomUUID(),
      companyName,
      billingAddress,
      shippingAddress,
      location: billingAddress,
      taxId,
      taxExempt,
      defaultCurrency,
      paymentTerms,
      contactName,
      contactEmail,
      contactPhone,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDb();
    await db.run(
      `INSERT INTO clients (
        id, companyName, billingAddress, shippingAddress, location, taxId,
        taxExempt, defaultCurrency, paymentTerms, contactName, contactEmail,
        contactPhone, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ,
      client.id,
      client.companyName,
      client.billingAddress,
      client.shippingAddress ?? null,
      client.location ?? null,
      client.taxId ?? null,
      client.taxExempt ? 1 : 0,
      client.defaultCurrency,
      client.paymentTerms,
      client.contactName ?? null,
      client.contactEmail ?? null,
      client.contactPhone ?? null,
      client.isActive ? 1 : 0,
      client.createdAt,
      client.updatedAt
    );

    const auditData = {
      entity: 'Client',
      recordId: client.id,
      action: 'CREATE',
      newValues: {
        companyName: client.companyName,
        billingAddress: client.billingAddress,
        taxId: client.taxId,
      },
    };

    const users = await db.all(`SELECT id FROM users WHERE isActive = 1`);
    const admins = await db.all(`SELECT id FROM admins WHERE isActive = 1`);
    const recipients = [...users, ...admins].map((r: any) => r.id as string);
    NotificationService.addForUsers(recipients, {
      title: 'Client added',
      message: `${req.user?.firstName || 'User'} added client ${client.companyName}`,
      type: 'ACTION',
      entity: 'Client',
      recordId: client.id,
    });

    return res.status(201).json({
      success: true,
      data: client,
      auditData,
    });
  }

  /**
   * PUT /api/clients/:id
   * Update a client
   */
  static async update(req: Request, res: Response) {
    const { id } = req.params;
    const db = await getDb();
    const row = await db.get(
      'SELECT * FROM clients WHERE id = ? AND isActive = 1',
      id
    );

    if (!row) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    const existing = mapClient(row);
    const {
      companyName = existing.companyName,
      billingAddress = existing.billingAddress,
      shippingAddress = existing.shippingAddress,
      taxId = existing.taxId,
      taxExempt = existing.taxExempt,
      defaultCurrency = existing.defaultCurrency,
      paymentTerms = existing.paymentTerms,
      contactName = existing.contactName,
      contactEmail = existing.contactEmail,
      contactPhone = existing.contactPhone,
    } = req.body;

    const updated: Client = {
      ...existing,
      companyName,
      billingAddress,
      shippingAddress,
      location: billingAddress,
      taxId,
      taxExempt,
      defaultCurrency,
      paymentTerms,
      contactName,
      contactEmail,
      contactPhone,
      updatedAt: new Date().toISOString(),
    };

    await db.run(
      `UPDATE clients SET
        companyName = ?,
        billingAddress = ?,
        shippingAddress = ?,
        location = ?,
        taxId = ?,
        taxExempt = ?,
        defaultCurrency = ?,
        paymentTerms = ?,
        contactName = ?,
        contactEmail = ?,
        contactPhone = ?,
        updatedAt = ?
      WHERE id = ?`,
      updated.companyName,
      updated.billingAddress,
      updated.shippingAddress ?? null,
      updated.location ?? null,
      updated.taxId ?? null,
      updated.taxExempt ? 1 : 0,
      updated.defaultCurrency,
      updated.paymentTerms,
      updated.contactName ?? null,
      updated.contactEmail ?? null,
      updated.contactPhone ?? null,
      updated.updatedAt,
      id
    );

    const auditData = {
      entity: 'Client',
      recordId: id,
      action: 'UPDATE',
      oldValues: {
        companyName: existing.companyName,
        billingAddress: existing.billingAddress,
        taxId: existing.taxId,
      },
      newValues: {
        companyName: updated.companyName,
        billingAddress: updated.billingAddress,
        taxId: updated.taxId,
      },
    };

    const users = await db.all(`SELECT id FROM users WHERE isActive = 1`);
    const admins = await db.all(`SELECT id FROM admins WHERE isActive = 1`);
    const recipients = [...users, ...admins].map((r: any) => r.id as string);
    NotificationService.addForUsers(recipients, {
      title: 'Client updated',
      message: `${req.user?.firstName || 'User'} updated client ${updated.companyName}`,
      type: 'ACTION',
      entity: 'Client',
      recordId: id,
    });

    return res.json({ success: true, data: updated, auditData });
  }

  /**
   * DELETE /api/clients/:id
   * Soft delete a client
   */
  static async delete(req: Request, res: Response) {
    const { id } = req.params;
    const db = await getDb();
    const row = await db.get(
      'SELECT * FROM clients WHERE id = ? AND isActive = 1',
      id
    );

    if (!row) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    const updatedAt = new Date().toISOString();
    await db.run(
      'UPDATE clients SET isActive = 0, updatedAt = ? WHERE id = ?',
      updatedAt,
      id
    );

    const auditData = {
      entity: 'Client',
      recordId: id,
      action: 'DELETE',
      oldValues: {
        companyName: row.companyName,
        billingAddress: row.billingAddress,
        taxId: row.taxId,
      },
    };

    const users = await db.all(`SELECT id FROM users WHERE isActive = 1`);
    const admins = await db.all(`SELECT id FROM admins WHERE isActive = 1`);
    const recipients = [...users, ...admins].map((r: any) => r.id as string);
    NotificationService.addForUsers(recipients, {
      title: 'Client removed',
      message: `${req.user?.firstName || 'User'} deleted client ${row.companyName}`,
      type: 'ACTION',
      entity: 'Client',
      recordId: id,
    });

    return res.json({
      success: true,
      data: { ...mapClient(row), isActive: false, updatedAt },
      auditData,
    });
  }
}
