/**
 * Authentication Service
 * Handles JWT generation and validation
 */

import jwt, { type SignOptions, type Secret, type JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { getDb } from '../db.js';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET: Secret =
  process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
const JWT_EXPIRY = (process.env.JWT_EXPIRY || '15m') as SignOptions['expiresIn'];
const JWT_REFRESH_EXPIRY = (process.env.JWT_REFRESH_EXPIRY || '7d') as SignOptions['expiresIn'];

const SUPERADMIN_EMAIL =
  process.env.SUPERADMIN_EMAIL || 'tripathiaditya149@gmail.com';
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'Aditya123';
const SUPERADMIN_FIRST_NAME = process.env.SUPERADMIN_FIRST_NAME || 'Aditya';
const SUPERADMIN_LAST_NAME = process.env.SUPERADMIN_LAST_NAME || 'Tripathi';

interface TokenPayload {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
  firstName?: string;
  lastName?: string;
}

type UserRow = {
  id: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'USER' | 'SUPERADMIN';
  firstName: string;
  lastName: string;
  isActive: number;
};

type AdminRow = {
  id: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'SUPERADMIN';
  firstName: string;
  lastName: string;
  isActive: number;
};

export class AuthService {
  /**
   * Hash a password
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Verify a password
   */
  static async verifyPassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generate access token
   */
  static generateAccessToken(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: JWT_EXPIRY };
    return jwt.sign(payload as JwtPayload, JWT_SECRET, options);
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: JWT_REFRESH_EXPIRY };
    return jwt.sign(payload as JwtPayload, JWT_REFRESH_SECRET, options);
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  }

  /**
   * Login user
   */
  static async login(email: string, password: string) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const db = await getDb();
    const user = await db.get<UserRow>(
      'SELECT * FROM users WHERE lower(email) = ? LIMIT 1',
      normalizedEmail
    );

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    const ok = await this.verifyPassword(password, user.passwordHash);
    if (!ok) {
      throw new Error('Invalid credentials');
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Login admin user
   */
  static async loginAdmin(email: string, password: string) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const db = await getDb();
    const admin = await db.get<AdminRow>(
      'SELECT * FROM admins WHERE lower(email) = ? LIMIT 1',
      normalizedEmail
    );

    if (!admin || !admin.isActive) {
      throw new Error('Invalid credentials');
    }

    const ok = await this.verifyPassword(password, admin.passwordHash);
    if (!ok) {
      throw new Error('Invalid credentials');
    }

    const payload: TokenPayload = {
      userId: admin.id,
      email: admin.email,
      role: admin.role || 'ADMIN',
      firstName: admin.firstName,
      lastName: admin.lastName,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role || 'ADMIN',
        firstName: admin.firstName,
        lastName: admin.lastName,
      },
    };
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(refreshToken: string) {
    const payload = this.verifyRefreshToken(refreshToken);
    const db = await getDb();
    let user: UserRow | AdminRow | undefined;

    if (payload.role === 'ADMIN' || payload.role === 'SUPERADMIN') {
      user = await db.get<AdminRow>(
        'SELECT * FROM admins WHERE id = ? LIMIT 1',
        payload.userId
      );
    } else {
      user = await db.get<UserRow>(
        'SELECT * FROM users WHERE id = ? LIMIT 1',
        payload.userId
      );
    }

    if (!user || !user.isActive) {
      throw new Error('Invalid refresh token');
    }

    const accessToken = this.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return { accessToken };
  }

  /**
   * Register a new user
   */
  static async registerUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'ADMIN' | 'USER' | 'SUPERADMIN';
  }) {
    const normalizedEmail = String(data.email || '').trim().toLowerCase();
    const db = await getDb();
    const existing = await db.get<{ id: string }>(
      'SELECT id FROM users WHERE lower(email) = ? LIMIT 1',
      normalizedEmail
    );

    if (existing) {
      throw new Error('Email already in use');
    }

    const now = new Date().toISOString();
    const userId = randomUUID();
    const passwordHash = await this.hashPassword(data.password);
    const role = data.role || 'USER';

    await db.run(
      `INSERT INTO users (
        id, email, passwordHash, role, firstName, lastName, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
      ,
      userId,
      normalizedEmail,
      passwordHash,
      role,
      data.firstName.trim(),
      data.lastName.trim(),
      now,
      now
    );

    const payload: TokenPayload = {
      userId,
      email: normalizedEmail,
      role,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email: normalizedEmail,
        role,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
      },
    };
  }

  /**
   * Ensure the default superadmin account exists and is healthy
   */
  static async ensureSuperAdmin() {
    const db = await getDb();
    const email = SUPERADMIN_EMAIL.trim().toLowerCase();
    const existing = await db.get<AdminRow>(
      'SELECT * FROM admins WHERE lower(email) = ? LIMIT 1',
      email
    );

    const now = new Date().toISOString();
    const passwordHash = await this.hashPassword(SUPERADMIN_PASSWORD);

    if (!existing) {
      await db.run(
        `INSERT INTO admins (
          id, email, passwordHash, role, firstName, lastName, isActive, createdAt, updatedAt
        ) VALUES (?, ?, ?, 'SUPERADMIN', ?, ?, 1, ?, ?)`
        ,
        randomUUID(),
        email,
        passwordHash,
        SUPERADMIN_FIRST_NAME,
        SUPERADMIN_LAST_NAME,
        now,
        now
      );
      return;
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (existing.role !== 'SUPERADMIN') {
      updates.push('role = ?');
      params.push('SUPERADMIN');
    }

    if (!existing.isActive) {
      updates.push('isActive = 1');
    }

    const passwordMatches = existing.passwordHash
      ? await this.verifyPassword(SUPERADMIN_PASSWORD, existing.passwordHash)
      : false;

    if (!passwordMatches) {
      updates.push('passwordHash = ?');
      params.push(passwordHash);
    }

    if (existing.firstName !== SUPERADMIN_FIRST_NAME) {
      updates.push('firstName = ?');
      params.push(SUPERADMIN_FIRST_NAME);
    }

    if (existing.lastName !== SUPERADMIN_LAST_NAME) {
      updates.push('lastName = ?');
      params.push(SUPERADMIN_LAST_NAME);
    }

    if (updates.length) {
      updates.push('updatedAt = ?');
      params.push(new Date().toISOString());
      params.push(existing.id);

      await db.run(
        `UPDATE admins SET ${updates.join(', ')} WHERE id = ?`,
        ...params
      );
    }
  }
}
