export type SellerListingStatus = 'DRAFT' | 'SUBMITTED' | 'PUBLISHED' | 'REJECTED';

export type SellerFulfillmentType = 'SOURCE_CODE' | 'MANAGED_SERVICE' | 'SUBSCRIPTION';

export interface ReviewTimelineEntry {
  id: string;
  status: SellerListingStatus;
  actorName: string;
  summary: string;
  createdAt: string;
}

export interface AnchoredReviewFeedback {
  id: string;
  fieldKey: 'title' | 'demoUrl' | 'priceMinor' | 'summary' | 'fulfillmentType';
  fieldLabel: string;
  comment: string;
  authorName: string;
  resolved: boolean;
  createdAt: string;
}

export interface SellerListing {
  id: string;
  slug: string;
  title: string;
  categoryId: string;
  categoryName: string;
  sellerId: string;
  sellerName: string;
  summary: string;
  demoUrl: string;
  fulfillmentType: SellerFulfillmentType;
  priceMinor: number;
  currency: 'VND';
  status: SellerListingStatus;
  reviewTimeline: ReviewTimelineEntry[];
  reviewerFeedback: AnchoredReviewFeedback[];
  viewsCount: number;
  leadsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SellerLeadItem {
  id: string;
  referenceCode: string;
  title: string;
  industryCategoryId?: string;
  budgetSummary: string;
  status: string;
  submittedAt: string;
  // Note: internalNotes are strictly excluded from Seller DTO per WM-033
}

export const ALLOWED_SELLER_LISTING_TRANSITIONS: Record<
  SellerListingStatus,
  SellerListingStatus[]
> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['PUBLISHED', 'REJECTED'],
  REJECTED: ['SUBMITTED'],
  PUBLISHED: ['DRAFT'],
};
