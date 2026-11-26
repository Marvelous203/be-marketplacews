import { PaymentMilestone } from '../quotations/quotations.types.js';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus =
  | 'UNPAID'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'REFUNDED';

export type OfflinePaymentMethod =
  | 'BANK_TRANSFER'
  | 'VIETQR'
  | 'CASH'
  | 'CREDIT_NOTE';

export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export interface MarketplaceOrderItem {
  id: string;
  lineType: 'SERVICE' | 'LICENSE' | 'HOSTING' | 'MAINTENANCE';
  description: string;
  quantity: number;
  unit: string;
  unitPriceMinor: number;
  discountMinor: number;
  lineTotalMinor: number;
}

export interface OfflinePaymentRecord {
  id: string;
  orderId: string;
  paymentMethod: OfflinePaymentMethod;
  amountMinor: number;
  currency: string;
  referenceCode?: string;
  receiptUrl?: string;
  note?: string;
  recordedBy: string;
  paidAt: string;
  createdAt: string;
}

export interface PaymentInstructions {
  bankName: string;
  bankBranch: string;
  accountNumber: string;
  accountHolder: string;
  qrUrl: string;
  transferSyntax: string;
}

export interface MarketplaceOrder {
  id: string;
  orderNumber: string; // e.g. ORD-2026-0001
  quotationId: string;
  quotationVersionNumber: number;
  quoteRequestId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerOrganizationId?: string;
  sellerOrganizationId: string;
  sellerName: string;

  // Financial fields in integer minor units (VND: 1 VND = 1 unit)
  currency: string;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  paidAmountMinor: number;
  balanceDueMinor: number;

  status: OrderStatus;
  paymentStatus: PaymentStatus;

  items: MarketplaceOrderItem[];
  deliverables: string[];
  termsSnapshot: {
    paymentSchedule: PaymentMilestone[];
    warrantyDays: number;
    supportSummary: string;
  };

  paymentInstructions?: PaymentInstructions;
  payments: OfflinePaymentRecord[];

  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}
