import { WebSocketServer, WebSocket } from 'ws';
import type http from 'http';
import type { IncomingMessage } from 'http';
import { AuthService } from '../services/authService.js';
import type { Notification } from '../services/notificationService.js';

const clients = new Map<string, Set<WebSocket>>();

function attachClient(userId: string, socket: WebSocket) {
  const set = clients.get(userId) || new Set<WebSocket>();
  set.add(socket);
  clients.set(userId, set);
}

function detachClient(socket: WebSocket) {
  for (const [userId, set] of clients.entries()) {
    if (set.has(socket)) {
      set.delete(socket);
      if (set.size === 0) clients.delete(userId);
      break;
    }
  }
}

function sendToUser(userId: string, payload: unknown) {
  const set = clients.get(userId);
  if (!set) return;
  const data = JSON.stringify(payload);
  for (const ws of set) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

export function pushNotification(userId: string, notification: Notification) {
  sendToUser(userId, { type: 'notification', data: notification });
}

export function initWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket: WebSocket, request: IncomingMessage) => {
    try {
      // Prefer auth token from Sec-WebSocket-Protocol to avoid putting it in the URL
      const protocolHeader = request.headers['sec-websocket-protocol'];
      const protocolToken = Array.isArray(protocolHeader)
        ? protocolHeader[0]
        : protocolHeader?.split(',')[0];

      // Fallback to query param for backward compatibility
      const queryToken = (request.url?.split('token=')[1] || '').split('&')[0];

      const token = (protocolToken || queryToken || '').trim();
      if (!token) {
        socket.close();
        return;
      }
      const payload = AuthService.verifyAccessToken(token);
      const userId = (payload as any)?.userId as string | undefined;
      if (!userId) {
        socket.close();
        return;
      }
      attachClient(userId, socket);

      socket.on('close', () => detachClient(socket));
      socket.on('error', () => detachClient(socket));
    } catch (err) {
      socket.close();
    }
  });
}
