import { Request, Response } from 'express';
import { getDb } from '../db.js';
import { AuthService } from '../services/authService.js';
import { NotificationService } from '../services/notificationService.js';
import { ProfileRequestService, ProfileField } from '../services/profileRequestService.js';

const ALLOWED_FIELDS: ProfileField[] = ['firstName', 'lastName', 'email', 'password', 'role'];

async function getRecipients(role: 'USER' | 'ADMIN' | 'SUPERADMIN') {
  const db = await getDb();
  if (role === 'USER') {
    const admins = await db.all(`SELECT id FROM admins WHERE isActive = 1`);
    return admins.map((a: any) => a.id as string);
  }
  if (role === 'ADMIN') {
    const superadmins = await db.all(`SELECT id FROM admins WHERE role = 'SUPERADMIN' AND isActive = 1`);
    return superadmins.map((a: any) => a.id as string);
  }
  return [];
}

export class ProfileController {
  static async myApproval(req: Request, res: Response) {
    try {
      const userId = req.user?.userId as string;
      if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
      const approved = ProfileRequestService.peekApprovedForUser(userId);
      if (!approved) return res.json({ success: true, data: null });
      return res.json({
        success: true,
        data: {
          id: approved.id,
          fields: approved.fields,
          reason: approved.reason,
          createdAt: approved.createdAt,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async requestChange(req: Request, res: Response) {
    try {
      const userId = req.user?.userId as string;
      const role = req.user?.role as 'USER' | 'ADMIN' | 'SUPERADMIN';
      if (!userId || !role) return res.status(401).json({ success: false, error: 'Unauthorized' });
      if (role === 'SUPERADMIN') {
        return res.status(400).json({ success: false, error: 'Superadmins can edit directly' });
      }

      const fields = (req.body.fields || []) as ProfileField[];
      const reason = req.body.reason as string | undefined;
      const cleanFields = fields.filter((f) => ALLOWED_FIELDS.includes(f));
      if (!cleanFields.length) {
        return res.status(400).json({ success: false, error: 'No valid fields requested' });
      }

      const request = ProfileRequestService.create(userId, role, cleanFields, reason);
      const recipients = await getRecipients(role);
      if (recipients.length) {
        const requesterLabel = req.user?.email || 'User';
        NotificationService.addForUsers(recipients, {
          title: 'Profile change request',
          message: `${requesterLabel} requested changes: ${cleanFields.join(', ')}`,
          type: 'REQUEST',
          entity: 'ProfileRequest',
          recordId: request.id,
          meta: { fields: cleanFields, requesterId: userId },
        });
      }

      return res.status(201).json({ success: true, data: request });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async listRequests(req: Request, res: Response) {
    try {
      const role = req.user?.role as 'USER' | 'ADMIN' | 'SUPERADMIN';
      if (!role || (role !== 'ADMIN' && role !== 'SUPERADMIN')) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }
      const list = ProfileRequestService.listPending(role === 'ADMIN' ? 'ADMIN' : 'SUPERADMIN');
      return res.json({ success: true, data: list });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async decide(req: Request, res: Response) {
    try {
      const role = req.user?.role as 'USER' | 'ADMIN' | 'SUPERADMIN';
      const approverId = req.user?.userId as string;
      if (!role || (role !== 'ADMIN' && role !== 'SUPERADMIN')) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const requestId = req.params.id;
      const request = ProfileRequestService.get(requestId);
      if (!request) return res.status(404).json({ success: false, error: 'Request not found' });

      if (request.requesterRole === 'ADMIN' && role !== 'SUPERADMIN') {
        return res.status(403).json({ success: false, error: 'Only superadmins can approve admin requests' });
      }

      const action = (req.body.action || '').toUpperCase();
      if (action !== 'APPROVE' && action !== 'DENY') {
        return res.status(400).json({ success: false, error: 'Invalid action' });
      }

      const updated = ProfileRequestService.setStatus(requestId, action === 'APPROVE' ? 'APPROVED' : 'DENIED', approverId);
      if (!updated) return res.status(404).json({ success: false, error: 'Request not found' });

      NotificationService.addForUsers([request.requesterId], {
        title: 'Profile request update',
        message: action === 'APPROVE' ? 'Your profile change request was approved.' : 'Your profile change request was denied.',
        type: 'REQUEST',
        entity: 'ProfileRequest',
        recordId: request.id,
        meta: { status: updated.status },
      });

      return res.json({ success: true, data: updated });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async updateSelf(req: Request, res: Response) {
    try {
      const userId = req.user?.userId as string;
      const role = req.user?.role as 'USER' | 'ADMIN' | 'SUPERADMIN';
      if (!userId || !role) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const { firstName, lastName, email, password } = req.body as any;
      const requestedFields = (Object.keys(req.body || {}) as ProfileField[]).filter((f) => ALLOWED_FIELDS.includes(f));
      if (!requestedFields.length) {
        return res.status(400).json({ success: false, error: 'No fields provided' });
      }

      const db = await getDb();
      const isAdminTable = role === 'ADMIN' || role === 'SUPERADMIN';
      const table = isAdminTable ? 'admins' : 'users';

      if (role === 'USER') {
        const approved = ProfileRequestService.consumeForUser(userId);
        if (!approved) {
          return res.status(403).json({ success: false, error: 'Request approval required' });
        }
        const allowedSet = new Set(approved.fields);
        if (!requestedFields.every((f) => allowedSet.has(f))) {
          return res.status(403).json({ success: false, error: 'Requested fields not approved' });
        }
      }

      const updates: string[] = [];
      const params: any[] = [];

      if (firstName !== undefined) {
        updates.push('firstName = ?');
        params.push(firstName);
      }
      if (lastName !== undefined) {
        updates.push('lastName = ?');
        params.push(lastName);
      }
      if (email !== undefined) {
        updates.push('email = ?');
        params.push(email);
      }
      if (password !== undefined) {
        updates.push('passwordHash = ?');
        const hash = await AuthService.hashPassword(password);
        params.push(hash);
      }

      if (!updates.length) {
        return res.status(400).json({ success: false, error: 'No fields updated' });
      }

      updates.push('updatedAt = ?');
      params.push(new Date().toISOString());
      params.push(userId);

      await db.run(
        `UPDATE ${table} SET ${updates.join(', ')} WHERE id = ?`,
        ...params
      );

      NotificationService.addForUsers([userId], {
        title: 'Profile updated',
        message: 'Your profile changes were saved.',
        type: 'INFO',
        entity: 'Profile',
        recordId: userId,
      });

      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
