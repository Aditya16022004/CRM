import { randomUUID } from 'crypto';

export type ProfileField = 'firstName' | 'lastName' | 'email' | 'password' | 'role';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'USED';

export interface ProfileChangeRequest {
  id: string;
  requesterId: string;
  requesterRole: 'USER' | 'ADMIN' | 'SUPERADMIN';
  fields: ProfileField[];
  reason?: string;
  status: RequestStatus;
  approverId?: string;
  createdAt: string;
  expiresAt: number;
}

const TTL_MS = 24 * 60 * 60 * 1000;
const requests = new Map<string, ProfileChangeRequest>();

function pruneExpired() {
  const now = Date.now();
  for (const [id, req] of requests.entries()) {
    if (req.expiresAt <= now || req.status === 'USED') {
      requests.delete(id);
    }
  }
}

export const ProfileRequestService = {
  create(requesterId: string, requesterRole: 'USER' | 'ADMIN' | 'SUPERADMIN', fields: ProfileField[], reason?: string) {
    pruneExpired();
    const req: ProfileChangeRequest = {
      id: randomUUID(),
      requesterId,
      requesterRole,
      fields,
      reason,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + TTL_MS,
    };
    requests.set(req.id, req);
    return req;
  },

  listPending(forRole: 'ADMIN' | 'SUPERADMIN') {
    pruneExpired();
    return Array.from(requests.values()).filter((r) => {
      if (r.status !== 'PENDING') return false;
      if (r.requesterRole === 'ADMIN' && forRole !== 'SUPERADMIN') return false;
      return true;
    });
  },

  peekApprovedForUser(userId: string) {
    pruneExpired();
    return Array.from(requests.values()).find(
      (r) => r.requesterId === userId && r.status === 'APPROVED'
    );
  },

  get(id: string) {
    pruneExpired();
    return requests.get(id);
  },

  setStatus(id: string, status: RequestStatus, approverId?: string) {
    const existing = requests.get(id);
    if (!existing) return null;
    const updated = { ...existing, status, approverId };
    requests.set(id, updated);
    return updated;
  },

  consumeForUser(userId: string) {
    pruneExpired();
    const req = Array.from(requests.values()).find(
      (r) => r.requesterId === userId && r.status === 'APPROVED'
    );
    if (!req) return null;
    const updated = { ...req, status: 'USED' as RequestStatus };
    requests.set(req.id, updated);
    return updated;
  },
};
