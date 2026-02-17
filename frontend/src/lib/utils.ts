import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind utility function for merging classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency with proper locale
 */
export function formatCurrency(
  amount: number,
  currency: string = 'INR'
): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date to locale string
 */
export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(dateObj);
}

/**
 * Calculate line total with discount
 */
export function calculateLineTotal(
  price: number,
  quantity: number,
  discount: number = 0
): number {
  const subtotal = price * quantity;
  const discountAmount = (subtotal * discount) / 100;
  return subtotal - discountAmount;
}

/**
 * Calculate proposal totals
 */
export function calculateProposalTotals(
  items: Array<{ lineTotal: number }>,
  taxRate: number
) {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  return {
    subtotal,
    taxAmount,
    total,
  };
}

/**
 * Calculate profit margin
 */
export function calculateMargin(cost: number, price: number): number {
  if (price === 0) return 0;
  return ((price - cost) / price) * 100;
}

/**
 * Validate proposal before submission
 */
export function validateProposal(proposal: {
  clientId: string | null;
  items: any[];
  proposalTitle?: string;
  createdBy?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!proposal.clientId) {
    errors.push('Client must be selected');
  }

  if (!proposal.proposalTitle || !proposal.proposalTitle.trim()) {
    errors.push('Proposal title is required');
  }

  if (!proposal.createdBy || !proposal.createdBy.trim()) {
    errors.push('Please enter the name of the person managing this proposal');
  }

  if (proposal.items.length === 0) {
    errors.push('At least one item must be added to the proposal');
  }

  proposal.items.forEach((item, index) => {
    if (item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
    }
    if (item.price < 0) {
      errors.push(`Item ${index + 1}: Price cannot be negative`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate unique ID for temporary items
 */
export function generateId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Create a diff object between old and new values
 */
export function createDiff(
  oldObj: Record<string, any>,
  newObj: Record<string, any>
): { old: Record<string, any>; new: Record<string, any> } {
  const diff: { old: Record<string, any>; new: Record<string, any> } = {
    old: {},
    new: {},
  };

  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  allKeys.forEach((key) => {
    if (oldObj[key] !== newObj[key]) {
      diff.old[key] = oldObj[key];
      diff.new[key] = newObj[key];
    }
  });

  return diff;
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
