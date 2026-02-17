import { randomUUID } from 'crypto';
import { getDb } from '../db.js';
import { AuthService } from './authService.js';

export type ManagedUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  source: 'users' | 'admins';
};

function mapUser(row: any, source: 'users' | 'admins'): ManagedUser {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    role: row.role,
    isActive: Boolean(row.isActive ?? true),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    source,
  } as ManagedUser;
}

export class UserService {
  static async listAll(): Promise<ManagedUser[]> {
    const db = await getDb();
    const [userRows, adminRows] = await Promise.all([
      db.all('SELECT * FROM users'),
      db.all("SELECT * FROM admins WHERE role IN ('ADMIN', 'SUPERADMIN')"),
    ]);

    return [
      ...userRows.map((row: any) => mapUser(row, 'users')),
      ...adminRows.map((row: any) => mapUser(row, 'admins')),
    ].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  static async createUser(
    data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role?: 'USER' | 'ADMIN';
    },
    actorRole: 'ADMIN' | 'SUPERADMIN'
  ): Promise<ManagedUser> {
    const normalizedEmail = String(data.email || '').trim().toLowerCase();
    const db = await getDb();

    const existing = await db.get(
      'SELECT id FROM users WHERE lower(email) = ? LIMIT 1',
      normalizedEmail
    );

    const existingAdmin = await db.get(
      'SELECT id FROM admins WHERE lower(email) = ? LIMIT 1',
      normalizedEmail
    );

    if (existing || existingAdmin) {
      throw new Error('Email already exists');
    }

    const now = new Date().toISOString();
    const passwordHash = await AuthService.hashPassword(data.password);
    const requestedRole = data.role === 'ADMIN' && actorRole === 'SUPERADMIN'
      ? 'ADMIN'
      : 'USER';

    const table = requestedRole === 'ADMIN' ? 'admins' : 'users';
    const id = randomUUID();

    await db.run(
      `INSERT INTO ${table} (
        id, email, passwordHash, role, firstName, lastName, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
      ,
      id,
      normalizedEmail,
      passwordHash,
      requestedRole,
      data.firstName.trim(),
      data.lastName.trim(),
      now,
      now
    );

    return mapUser(
      {
        id,
        email: normalizedEmail,
        passwordHash,
        role: requestedRole,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        isActive: 1,
        createdAt: now,
        updatedAt: now,
      },
      table as 'users' | 'admins'
    );
  }

  static async deleteUser(id: string, actorRole: 'ADMIN' | 'SUPERADMIN'): Promise<void> {
    const db = await getDb();

    const adminRow = await db.get(
      "SELECT * FROM admins WHERE id = ? AND role IN ('ADMIN', 'SUPERADMIN')",
      id
    );

    if (adminRow) {
      if (adminRow.role === 'SUPERADMIN') {
        throw new Error('Cannot delete superadmin');
      }

      if (actorRole !== 'SUPERADMIN') {
        throw new Error('Only superadmin can delete admin accounts');
      }

      await db.run('DELETE FROM admins WHERE id = ?', id);
      return;
    }

    const userRow = await db.get('SELECT * FROM users WHERE id = ?', id);

    if (!userRow) {
      throw new Error('User not found');
    }

    await db.run('DELETE FROM users WHERE id = ?', id);
  }

  static async promoteToAdmin(id: string): Promise<ManagedUser> {
    const db = await getDb();
    const userRow = await db.get('SELECT * FROM users WHERE id = ?', id);

    if (!userRow) {
      throw new Error('User not found');
    }

    const adminExisting = await db.get(
      'SELECT id FROM admins WHERE lower(email) = ? LIMIT 1',
      String(userRow.email || '').toLowerCase()
    );

    if (adminExisting) {
      throw new Error('User is already an admin');
    }

    await db.run(
      `INSERT INTO admins (id, email, passwordHash, role, firstName, lastName, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, 'ADMIN', ?, ?, ?, ?, ?)`
      ,
      userRow.id,
      userRow.email,
      userRow.passwordHash,
      userRow.firstName,
      userRow.lastName,
      userRow.isActive ?? 1,
      userRow.createdAt ?? new Date().toISOString(),
      new Date().toISOString()
    );

    await db.run('DELETE FROM users WHERE id = ?', id);

    return mapUser(
      {
        ...userRow,
        role: 'ADMIN',
      },
      'admins'
    );
  }

  static async demoteToUser(id: string): Promise<ManagedUser> {
    const db = await getDb();
    const adminRow = await db.get(
      "SELECT * FROM admins WHERE id = ? AND role IN ('ADMIN', 'SUPERADMIN')",
      id
    );

    if (!adminRow) {
      throw new Error('Admin not found');
    }

    if (adminRow.role === 'SUPERADMIN') {
      throw new Error('Cannot demote superadmin');
    }

    const existingUser = await db.get(
      'SELECT id FROM users WHERE lower(email) = ? LIMIT 1',
      String(adminRow.email || '').toLowerCase()
    );

    if (existingUser) {
      throw new Error('A user with this email already exists');
    }

    await db.run(
      `INSERT INTO users (id, email, passwordHash, role, firstName, lastName, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, 'USER', ?, ?, ?, ?, ?)`
      ,
      adminRow.id,
      adminRow.email,
      adminRow.passwordHash,
      adminRow.firstName,
      adminRow.lastName,
      adminRow.isActive ?? 1,
      adminRow.createdAt ?? new Date().toISOString(),
      new Date().toISOString()
    );

    await db.run('DELETE FROM admins WHERE id = ?', id);

    return mapUser(
      {
        ...adminRow,
        role: 'USER',
      },
      'users'
    );
  }
}
