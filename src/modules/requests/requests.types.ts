export type RequestStatus =
  | 'NEW'
  | 'TRIAGED'
  | 'IN_REVIEW'
  | 'WAITING_CUSTOMER'
  | 'QUOTATION_SENT'
  | 'CONVERTED'
  | 'CLOSED_WON'
  | 'CLOSED_LOST'
  | 'SPAM';

export type RequestPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export const ALLOWED_REQUEST_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  NEW: ['TRIAGED', 'SPAM', 'CLOSED_LOST'],
  TRIAGED: ['IN_REVIEW', 'WAITING_CUSTOMER', 'CLOSED_LOST', 'SPAM'],
  IN_REVIEW: ['WAITING_CUSTOMER', 'QUOTATION_SENT', 'CLOSED_LOST'],
  WAITING_CUSTOMER: ['IN_REVIEW', 'QUOTATION_SENT', 'CLOSED_LOST'],
  QUOTATION_SENT: ['CONVERTED', 'CLOSED_WON', 'CLOSED_LOST', 'WAITING_CUSTOMER'],
  CONVERTED: ['CLOSED_WON', 'CLOSED_LOST'],
  CLOSED_WON: [],
  CLOSED_LOST: ['TRIAGED'], // Cho phép mở lại khi khách hàng phản hồi tiếp
  SPAM: [],
};

export interface ContactSnapshot {
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

export interface BudgetSnapshot {
  minMinor?: number;
  maxMinor?: number;
  currency: string;
  flexibility?: 'STRICT' | 'NEGOTIABLE' | 'NOT_SURE';
}

export interface RequirementsSnapshot {
  estimatedPages?: string;
  features: string[];
  integrations?: string[];
  designReferenceUrls?: string[];
  technicalConfidence?: 'KNOW_EXACTLY' | 'NEED_CONSULTATION' | 'NO_PREFERENCE';
  rawAnswers?: Record<string, unknown>;
}

export interface InternalNote {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface RequestActivity {
  id: string;
  actor: string;
  activityType: 'CREATED' | 'ASSIGNED' | 'STATUS_CHANGED' | 'NOTE_ADDED' | 'QUOTATION_CREATED';
  fromStatus?: RequestStatus;
  toStatus?: RequestStatus;
  summary: string;
  reason?: string;
  createdAt: string;
}

export interface QuoteRequest {
  id: string;
  referenceCode: string;
  requesterUserId?: string;
  customerOrganizationId?: string;
  relatedListingId?: string;
  relatedOfferId?: string;
  title: string;
  industryCategoryId?: string;
  solutionType: string;
  goal: string;
  budget: BudgetSnapshot;
  targetDate?: string;
  status: RequestStatus;
  priority: RequestPriority;
  assignedToUserId?: string;
  assignedToName?: string;
  contactSnapshot: ContactSnapshot;
  requirementsSnapshot: RequirementsSnapshot;
  consentVersion: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  internalNotes: InternalNote[];
  activities: RequestActivity[];
}

export type PublicQuoteRequest = Omit<QuoteRequest, 'internalNotes' | 'assignedToUserId' | 'assignedToName'>;
