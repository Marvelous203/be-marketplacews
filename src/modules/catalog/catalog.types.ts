import { CurrencyCode } from '../../common/money/money.types.js';

export enum ListingKind {
  WEBSITE_TEMPLATE = 'WEBSITE_TEMPLATE',
  BUSINESS_WEBSITE = 'BUSINESS_WEBSITE',
  LANDING_PAGE = 'LANDING_PAGE',
  ECOMMERCE = 'ECOMMERCE',
  WEB_APPLICATION = 'WEB_APPLICATION',
  SAAS_PRODUCT = 'SAAS_PRODUCT',
  CUSTOM_SERVICE = 'CUSTOM_SERVICE',
  OTHER = 'OTHER',
}

export enum ListingStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
}

export enum FulfillmentType {
  SOURCE_CODE = 'SOURCE_CODE',
  MANAGED_SERVICE = 'MANAGED_SERVICE',
  SAAS = 'SAAS',
  CUSTOM_PROJECT = 'CUSTOM_PROJECT',
}

export enum PricingModel {
  FIXED = 'FIXED',
  STARTING_AT = 'STARTING_AT',
  QUOTE = 'QUOTE',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

export enum BillingInterval {
  ONE_TIME = 'ONE_TIME',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

export enum OfferStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum SellerType {
  PLATFORM = 'PLATFORM',
  PARTNER = 'PARTNER',
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconKey?: string;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  tagGroup: string; // e.g. "TECH", "INDUSTRY", "STYLE"
  isActive: boolean;
  createdAt: string;
}

export interface FeatureDefinition {
  id: string;
  key: string;
  label: string;
  dataType: 'BOOLEAN' | 'TEXT' | 'NUMBER';
  groupName: string;
  isFilterable: boolean;
}

export interface OfferPrice {
  id: string;
  currency: CurrencyCode;
  amountMinor: bigint;
  billingInterval: BillingInterval;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
}

export interface Offer {
  id: string;
  listingId: string;
  code: string;
  name: string;
  description: string;
  fulfillmentType: FulfillmentType;
  pricingModel: PricingModel;
  status: OfferStatus;
  requiresConsultation: boolean;
  licenseSummary?: string;
  deliveryScope: {
    included: string[];
    excluded: string[];
    deliverables: string[];
  };
  billingInterval?: BillingInterval;
  trialDays?: number;
  currentPrice?: OfferPrice;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListingMedia {
  id: string;
  url: string;
  altText: string;
  mediaType: 'IMAGE' | 'VIDEO';
  isPrimary: boolean;
  sortOrder: number;
}

export interface Listing {
  id: string;
  ownerOrganizationId: string;
  sellerType: SellerType;
  sellerName: string;
  sellerSlug: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  listingKind: ListingKind;
  status: ListingStatus;
  featured: boolean;
  demoUrl?: string;
  previewMode: 'EXTERNAL_LINK' | 'APPROVED_EMBED' | 'SCREENSHOTS';
  media: ListingMedia[];
  tags: Tag[];
  features: { key: string; label: string; value: string | boolean | number }[];
  offers: Offer[];
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}
