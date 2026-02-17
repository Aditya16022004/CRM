/**
 * Request Validation Middleware
 * Uses Zod schemas to validate incoming requests
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

/**
 * Validate request body against Zod schema
 */
export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}

/**
 * Validate query parameters
 */
export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}

// Common validation schemas
export const schemas = {
  // Pagination
  pagination: z.object({
    page: z.string().optional().transform(val => parseInt(val || '1', 10)),
    limit: z.string().optional().transform(val => parseInt(val || '50', 10)),
  }),

  // ID parameter
  idParam: z.object({
    id: z.string().uuid(),
  }),

  // Login
  login: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),

  // Create user
  createUser: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    role: z.enum(['ADMIN', 'USER']).optional(),
  }),

  // Public signup
  signup: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
  }),

  // Create/Update device (no stock tracking)
  device: z.object({
    name: z.string().min(1),
    make: z.string().min(1),
    model: z.string().min(1),
    category: z.string().min(1),
    description: z.string().optional(),
    unit: z.string().optional(),
    unitCost: z.number().min(0),
    unitPrice: z.number().min(0),
    specifications: z.record(z.any()).optional(),
  }),

  // Create/Update client
  client: z.object({
    companyName: z.string().min(1),
    billingAddress: z.string().min(1),
    shippingAddress: z.string().optional(),
    taxId: z.string().optional(),
    taxExempt: z.boolean().optional(),
    defaultCurrency: z.string().optional(),
    paymentTerms: z.string().optional(),
    contactName: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
  }),

  // Create/Update proposal
  proposal: z.object({
    clientId: z.string().uuid(),
    proposalTitle: z.string().min(1).optional(),
    items: z
      .array(
        z.object({
          inventoryItemId: z.string().uuid().optional(),
          quantity: z.number().int().min(1),
          discount: z.number().min(0).max(100).optional(),
          // Snapshot fields from frontend (for in-memory mode)
          snapshotName: z.string().optional(),
          snapshotMake: z.string().optional(),
          snapshotModel: z.string().optional(),
          snapshotPrice: z.number().optional(),
          snapshotSpecs: z.record(z.any()).optional(),
          lineTotal: z.number().optional(),
        })
      )
      .min(1),
    taxRate: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
    termsConditions: z.string().optional(),
    validUntil: z.string().datetime().optional(),
    createdBy: z.string().optional(),
  }),

  // Update proposal status
  updateProposalStatus: z.object({
    status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'SENT', 'ACCEPTED', 'REJECTED']),
  }),

};
