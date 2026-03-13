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
    uom: string;
  category: string;
  make: string;
  model: string;
  unitCost: number;
  unitPrice: number;
    deliveryCharges: number;
    otherCharges: number;
    // computed
    margin: number;
    grossProfitPerUnit: number;
    netProfitPerUnit: number;
  specifications: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

  function computeFinancials(unitCost: number, unitPrice: number, deliveryCharges: number, otherCharges: number) {
    const grossProfitPerUnit = unitPrice - unitCost;
    const margin = unitCost > 0 ? (grossProfitPerUnit / unitCost) * 100 : 0;
    const netProfitPerUnit = grossProfitPerUnit - deliveryCharges - otherCharges;
    return {
      margin: Math.round(margin * 100) / 100,
      grossProfitPerUnit: Math.round(grossProfitPerUnit * 100) / 100,
      netProfitPerUnit: Math.round(netProfitPerUnit * 100) / 100,
    };
  }

  function mapDevice(row: any): InventoryItem {
    const unitCost = Number(row.unitCost ?? row.unitcost ?? 0);
    const unitPrice = Number(row.unitPrice ?? row.unitprice ?? 0);
    const deliveryCharges = Number(row.deliveryCharges ?? row.deliverycharges ?? 0);
    const otherCharges = Number(row.otherCharges ?? row.othercharges ?? 0);
    const computed = computeFinancials(unitCost, unitPrice, deliveryCharges, otherCharges);
    return {
      ...row,
      uom: row.uom ?? '',
      unitCost,
      unitPrice,
      deliveryCharges,
      otherCharges,
      margin: Number(row.margin ?? computed.margin),
      grossProfitPerUnit: Number(row.grossProfitPerUnit ?? row.grossprofitperunit ?? computed.grossProfitPerUnit),
      netProfitPerUnit: Number(row.netProfitPerUnit ?? row.netprofitperunit ?? computed.netProfitPerUnit),
      specifications: row.specifications ? JSON.parse(row.specifications) : {},
      isActive: Boolean(row.isActive ?? row.isactive),
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
      uom,
      unit,
      category,
      make,
      model,
      unitCost,
      unitPrice,
      specifications = {},
      deliveryCharges = 0,
      otherCharges = 0,
    } = req.body;

    const now = new Date().toISOString();

    const item: InventoryItem = {
      id: randomUUID(),
      name,
      description: description ?? '',
      uom: uom ?? unit ?? 'EA',
      category,
      make,
      model,
      unitCost,
      unitPrice,
      deliveryCharges: Number(deliveryCharges) || 0,
      otherCharges: Number(otherCharges) || 0,
      ...computeFinancials(Number(unitCost) || 0, Number(unitPrice) || 0, Number(deliveryCharges) || 0, Number(otherCharges) || 0),
      specifications: { ...specifications },
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDb();
    await db.run(
      `INSERT INTO devices (
          id, name, description, uom, category, make, model,
          unitCost, unitPrice, deliveryCharges, otherCharges,
          margin, grossProfitPerUnit, netProfitPerUnit,
          specifications, isActive, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      item.id,
      item.name,
      item.description ?? null,
        item.uom ?? null,
      item.category ?? null,
      item.make ?? null,
      item.model ?? null,
      item.unitCost,
      item.unitPrice,
        item.deliveryCharges,
        item.otherCharges,
      item.margin,
      item.grossProfitPerUnit,
      item.netProfitPerUnit,
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
      name = existing.name,
      description = existing.description,
      uom = existing.uom,
      unit,
      category = existing.category,
      make = existing.make,
      model = existing.model,
      unitCost = existing.unitCost,
      unitPrice = existing.unitPrice,
      specifications = existing.specifications,
      deliveryCharges = existing.deliveryCharges,
      otherCharges = existing.otherCharges,
    } = req.body;

    const updated: InventoryItem = {
      ...existing,
      name,
      description,
      uom: uom ?? unit ?? existing.uom,
      category,
      make,
      model,
      unitCost,
      unitPrice,
      deliveryCharges: Number(deliveryCharges) || 0,
      otherCharges: Number(otherCharges) || 0,
      ...computeFinancials(Number(unitCost) || 0, Number(unitPrice) || 0, Number(deliveryCharges) || 0, Number(otherCharges) || 0),
      specifications: { ...specifications },
      updatedAt: new Date().toISOString(),
    };

    await db.run(
      `UPDATE devices SET
        name = ?,
        description = ?,
          uom = ?,
        category = ?,
        make = ?,
        model = ?,
        unitCost = ?,
        unitPrice = ?,
          deliveryCharges = ?,
          otherCharges = ?,
        margin = ?,
        grossProfitPerUnit = ?,
        netProfitPerUnit = ?,
        specifications = ?,
        updatedAt = ?
      WHERE id = ?`,
      updated.name ?? null,
      updated.description ?? null,
        updated.uom ?? null,
      updated.category ?? null,
      updated.make ?? null,
      updated.model ?? null,
      updated.unitCost,
      updated.unitPrice,
        updated.deliveryCharges,
        updated.otherCharges,
      updated.margin,
      updated.grossProfitPerUnit,
      updated.netProfitPerUnit,
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
   * Hard delete a device
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

    await db.run('DELETE FROM devices WHERE id = ?', id);

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
      data: mapDevice(row),
      auditData,
    });
  }
}
