import { Request, Response } from 'express';
import { UserService } from '../services/userService.js';

export class UserController {
  static async list(req: Request, res: Response) {
    try {
      const users = await UserService.listAll();
      return res.json({ success: true, data: users });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const actorRole = req.user?.role === 'SUPERADMIN' ? 'SUPERADMIN' : 'ADMIN';
      const user = await UserService.createUser(
        {
          email: req.body.email,
          password: req.body.password,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          role: req.body.role,
        },
        actorRole
      );

      return res.status(201).json({ success: true, data: user });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const actorRole = req.user?.role === 'SUPERADMIN' ? 'SUPERADMIN' : 'ADMIN';
      await UserService.deleteUser(req.params.id, actorRole);
      return res.json({ success: true });
    } catch (error: any) {
      const status = error.message.includes('not found') ? 404 : 400;
      return res.status(status).json({ success: false, error: error.message });
    }
  }

  static async promote(req: Request, res: Response) {
    try {
      const user = await UserService.promoteToAdmin(req.params.id);
      return res.json({ success: true, data: user });
    } catch (error: any) {
      const status = error.message.includes('not found') ? 404 : 400;
      return res.status(status).json({ success: false, error: error.message });
    }
  }

  static async demote(req: Request, res: Response) {
    try {
      const user = await UserService.demoteToUser(req.params.id);
      return res.json({ success: true, data: user });
    } catch (error: any) {
      const status = error.message.includes('not found') ? 404 : 400;
      return res.status(status).json({ success: false, error: error.message });
    }
  }
}
