/**
 * Inventory Controller
 * Handles CRUD operations for device items (formerly inventory)
 *
 * NOTE: This implementation is **in-memory only** so you can use the app
 * without a real database. Replace this with real DB logic later.
 */

import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { getDb } from '../db.js';
import { NotificationService } from '../services/notificationService.js';

type InventoryItem = {
  id: string;
  name: string;
  description: string;
  unit: string;
  category: string;
  make: string;
  model: string;
  unitCost: number;
  unitPrice: number;
  specifications: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function mapDevice(row: any): InventoryItem {
  return {
    ...row,
    specifications: row.specifications ? JSON.parse(row.specifications) : {},
    isActive: Boolean(row.isActive),
  } as InventoryItem;
}

export class InventoryController {
  /**
   * GET /api/inventory
   * Get all devices
   */
  static async getAll(req: Request, res: Response) {
    const db = await getDb();
    const rows = await db.all(
      'SELECT * FROM devices WHERE isActive = 1 ORDER BY createdAt DESC'
    );
    return res.json({
      success: true,
      data: rows.map(mapDevice),
    });
  }

  /**
   * GET /api/inventory/:id
   * Get a single device
   */
  static async getById(req: Request, res: Response) {
    const { id } = req.params;
    const db = await getDb();
    const row = await db.get(
      'SELECT * FROM devices WHERE id = ? AND isActive = 1',
      id
    );

    if (!row) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    return res.json({ success: true, data: mapDevice(row) });
  }

  /**
   * POST /api/inventory
   * Create a new device
   */
  static async create(req: Request, res: Response) {
    const {
      name,
      description,
      unit,
      category,
      make,
      model,
      unitCost,
      unitPrice,
      specifications = {},
    } = req.body;

    const now = new Date().toISOString();

    const item: InventoryItem = {
      id: randomUUID(),
      name,
      description: description ?? '',
      unit: unit ?? 'Unit',
      category,
      make,
      model,
      unitCost,
      unitPrice,
      specifications: {
        unit: unit ?? 'Unit',
        ...specifications,
      },
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDb();
    await db.run(
      `INSERT INTO devices (
        id, name, description, unit, category, make, model,
        unitCost, unitPrice, specifications, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ,
      item.id,
      item.name,
      item.description ?? null,
      item.unit ?? null,
      item.category ?? null,
      item.make ?? null,
      item.model ?? null,
      item.unitCost,
      item.unitPrice,
      JSON.stringify(item.specifications || {}),
      item.isActive ? 1 : 0,
      item.createdAt,
      item.updatedAt
    );

    const auditData = {
      entity: 'Device',
      recordId: item.id,
      action: 'CREATE',
      newValues: {
        name: item.name,
        category: item.category,
        make: item.make,
        model: item.model,
        unitPrice: item.unitPrice,
      },
    };

    const userRows = await db.all(`SELECT id FROM users WHERE isActive = 1`);
    const adminRows = await db.all(`SELECT id FROM admins WHERE isActive = 1`);
    const recipients = [...userRows, ...adminRows].map((r: any) => r.id as string);
    NotificationService.addForUsers(recipients, {
      title: 'Device added',
      message: `${req.user?.firstName || 'User'} added device ${item.name}`,
      type: 'ACTION',
      entity: 'Device',
      recordId: item.id,
    });

    return res.status(201).json({
      success: true,
      data: item,
      auditData,
    });
  }

  /**
   * PUT /api/inventory/:id
   * Update a device
   */
  static async update(req: Request, res: Response) {
    const { id } = req.params;
    const db = await getDb();
    const row = await db.get(
      'SELECT * FROM devices WHERE id = ? AND isActive = 1',
      id
    );

    if (!row) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const existing = mapDevice(row);
    const {
      description = existing.description,
      unit = existing.unit,
      category = existing.category,
      make = existing.make,
      model = existing.model,
      unitCost = existing.unitCost,
      unitPrice = existing.unitPrice,
      specifications = existing.specifications,
    } = req.body;

    const updated: InventoryItem = {
      ...existing,
      description,
      unit,
      category,
      make,
      model,
      unitCost,
      unitPrice,
      specifications: {
        unit,
        ...specifications,
      },
      updatedAt: new Date().toISOString(),
    };

    await db.run(
      `UPDATE devices SET
        description = ?,
        unit = ?,
        category = ?,
        make = ?,
        model = ?,
        unitCost = ?,
        unitPrice = ?,
        specifications = ?,
        updatedAt = ?
      WHERE id = ?`,
      updated.description ?? null,
      updated.unit ?? null,
      updated.category ?? null,
      updated.make ?? null,
      updated.model ?? null,
      updated.unitCost,
      updated.unitPrice,
      JSON.stringify(updated.specifications || {}),
      updated.updatedAt,
      id
    );

    const auditData = {
      entity: 'Device',
      recordId: id,
      action: 'UPDATE',
      oldValues: {
        name: existing.name,
        category: existing.category,
        make: existing.make,
        model: existing.model,
        unitPrice: existing.unitPrice,
      },
      newValues: {
        name: updated.name,
        category: updated.category,
        make: updated.make,
        model: updated.model,
        unitPrice: updated.unitPrice,
      },
    };

    const userRows = await db.all(`SELECT id FROM users WHERE isActive = 1`);
    const adminRows = await db.all(`SELECT id FROM admins WHERE isActive = 1`);
    const recipients = [...userRows, ...adminRows].map((r: any) => r.id as string);
    NotificationService.addForUsers(recipients, {
      title: 'Device updated',
      message: `${req.user?.firstName || 'User'} updated device ${updated.name}`,
      type: 'ACTION',
      entity: 'Device',
      recordId: id,
    });

    return res.json({ success: true, data: updated, auditData });
  }

  /**
   * DELETE /api/inventory/:id
   * Soft delete a device (set isActive to false)
   */
  static async delete(req: Request, res: Response) {
    const { id } = req.params;
    const db = await getDb();
    const row = await db.get(
      'SELECT * FROM devices WHERE id = ? AND isActive = 1',
      id
    );

    if (!row) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const updatedAt = new Date().toISOString();
    await db.run(
      'UPDATE devices SET isActive = 0, updatedAt = ? WHERE id = ?',
      updatedAt,
      id
    );

    const auditData = {
      entity: 'Device',
      recordId: id,
      action: 'DELETE',
      oldValues: {
        name: row.name,
        category: row.category,
        make: row.make,
        model: row.model,
        unitPrice: row.unitPrice,
      },
    };

    const userRows = await db.all(`SELECT id FROM users WHERE isActive = 1`);
    const adminRows = await db.all(`SELECT id FROM admins WHERE isActive = 1`);
    const recipients = [...userRows, ...adminRows].map((r: any) => r.id as string);
    NotificationService.addForUsers(recipients, {
      title: 'Device removed',
      message: `${req.user?.firstName || 'User'} deleted device ${row.name}`,
      type: 'ACTION',
      entity: 'Device',
      recordId: id,
    });

    return res.json({
      success: true,
      data: { ...mapDevice(row), isActive: false, updatedAt },
      auditData,
    });
  }
}
