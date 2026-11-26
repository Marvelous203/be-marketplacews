export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export const ALLOWED_QUOTATION_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  DRAFT: ['SENT', 'EXPIRED'],
  SENT: ['ACCEPTED', 'REJECTED', 'EXPIRED'],
  ACCEPTED: [], // Bất biến vĩnh viễn (BR-05/06)
  REJECTED: [],
  EXPIRED: [],
};

export interface QuotationLine {
  id: string;
  lineType: 'SERVICE' | 'LICENSE' | 'HOSTING' | 'MAINTENANCE';
  description: string;
  quantity: number;
  unit: string;
  unitPriceMinor: number;
  discountMinor: number;
  taxCode?: string;
  taxRateBasisPoints?: number;
  lineTotalMinor: number;
}

export interface QuotationScope {
  deliverables: string[];
  included: string[];
  excluded: string[];
  assumptions?: string[];
}

export interface PaymentMilestone {
  label: string;
  percent: number;
  amountMinor?: number;
}

export interface QuotationTerms {
  paymentSchedule: PaymentMilestone[];
  warrantyDays: number;
  supportSummary: string;
  termsVersion: string;
}

export interface QuotationVersion {
  id: string;
  quotationId: string;
  versionNumber: number;
  status: QuotationStatus;
  currency: string;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  scopeSnapshot: QuotationScope;
  termsSnapshot: QuotationTerms;
  lines: QuotationLine[];
  validUntil: string;
  sentAt?: string;
  acceptedAt?: string;
  acceptedByName?: string;
  acceptedNote?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface Quotation {
  id: string;
  quoteRequestId: string;
  sellerOrganizationId: string;
  sellerName: string;
  customerOrganizationId?: string;
  customerName: string;
  customerEmail: string;
  currentVersionNumber: number;
  status: QuotationStatus;
  createdAt: string;
  updatedAt: string;
  convertedOrderId?: string;
  orderNumber?: string;
  currentVersion: QuotationVersion;
  historyVersions: QuotationVersion[];
}
