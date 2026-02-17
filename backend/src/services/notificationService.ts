import { randomUUID } from 'crypto';
import { pushNotification } from '../realtime/websocket.js';

export type NotificationType = 'INFO' | 'REQUEST' | 'ACTION';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  entity?: string;
  recordId?: string;
  createdAt: string;
  read: boolean;
  expiresAt: number;
  meta?: Record<string, any>;
}

const TTL_MS = 24 * 60 * 60 * 1000;
const store = new Map<string, Notification[]>();

function prune(userId: string) {
  const now = Date.now();
  const list = store.get(userId) || [];
  const filtered = list.filter((n) => n.expiresAt > now);
  store.set(userId, filtered);
}

export const NotificationService = {
  addForUsers(userIds: string[], input: Omit<Notification, 'id' | 'createdAt' | 'read' | 'expiresAt' | 'userId'>) {
    const now = Date.now();
    userIds.forEach((userId) => {
      const list = store.get(userId) || [];
      const notification: Notification = {
        ...input,
        id: randomUUID(),
        userId,
        createdAt: new Date(now).toISOString(),
        read: false,
        expiresAt: now + TTL_MS,
      };
      list.unshift(notification);
      store.set(userId, list.slice(0, 100));
      pushNotification(userId, notification);
    });
  },

  getForUser(userId: string): Notification[] {
    prune(userId);
    const list = store.get(userId) || [];
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  markAllRead(userId: string) {
    prune(userId);
    const list = store.get(userId) || [];
    store.set(
      userId,
      list.map((n) => ({ ...n, read: true }))
    );
  },

  clear(userId: string) {
    store.delete(userId);
  },
};
