import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService.js';

export class NotificationController {
  static async listMine(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.json({ success: true, data: [] });
      const data = NotificationService.getForUser(userId);
      return res.json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async markRead(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (userId) NotificationService.markAllRead(userId);
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async clear(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (userId) NotificationService.clear(userId);
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}
