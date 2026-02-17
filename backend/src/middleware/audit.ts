/**
 * Audit Middleware
 * Automatically logs changes to tracked entities
 */

import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/auditService.js';

/**
 * Extract client IP address
 */
function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Middleware to capture response data for audit logging
 */
export function auditMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Only audit write operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to intercept response
  res.json = function (body: any) {
    // Extract audit information if available
    if (body.auditData) {
      const { entity, recordId, action, oldValues, newValues } = body.auditData;

      // Log asynchronously (don't await)
      AuditService.log({
        entity,
        recordId,
        action,
        oldValues,
        newValues,
        userId: req.user?.userId,
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'],
      });

      // Remove audit data from response
      delete body.auditData;
    }

    return originalJson(body);
  };

  next();
}
