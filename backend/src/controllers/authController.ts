/**
 * Authentication Controller
 * Handles user authentication and token management
 */

import { Request, Response } from 'express';
import { AuthService } from '../services/authService.js';
import { getDb } from '../db.js';

export class AuthController {
  /**
   * POST /api/auth/login
   * Login user and return tokens
   */
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login(email, password);

      // Set refresh token as HttpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  /**
   * POST /api/auth/admin/login
   * Login admin user and return tokens
   */
  static async adminLogin(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const result = await AuthService.loginAdmin(email, password);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  static async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
      }

      const result = await AuthService.refreshAccessToken(refreshToken);

      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  /**
   * POST /api/auth/logout
   * Clear refresh token cookie
   */
  static async logout(req: Request, res: Response) {
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  }

  /**
   * GET /api/auth/me
   * Get current user information
   */
  static async me(req: Request, res: Response) {
    try {
      if (!req.user?.userId) {
        return res.json({ user: null });
      }

      const db = await getDb();
      const table = req.user.role === 'ADMIN' || req.user.role === 'SUPERADMIN'
        ? 'admins'
        : 'users';
      const user = await db.get(
        `SELECT id, email, role, firstName, lastName, isActive FROM ${table} WHERE id = ? LIMIT 1`,
        req.user.userId
      );

      return res.json({ user: user || null });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/auth/register
   * Register a new user (Admin only)
   */
  static async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body;

      const result = await AuthService.registerUser({
        email,
        password,
        firstName,
        lastName,
        role: 'USER',
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
