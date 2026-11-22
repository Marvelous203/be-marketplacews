import { describe, it, expect, beforeEach } from 'vitest';
import { CatalogService } from './catalog.service.js';
import { MoneyService } from '../../common/money/money.service.js';
import {
  ListingKind,
  ListingStatus,
  FulfillmentType,
  PricingModel,
  BillingInterval,
} from './catalog.types.js';

describe('CatalogService (WM-EP02 Catalog & Offers)', () => {
  let service: CatalogService;
  let moneyService: MoneyService;

  beforeEach(() => {
    moneyService = new MoneyService();
    service = new CatalogService(moneyService);
  });

  describe('Categories & Tags', () => {
    it('retrieves seeded categories and tags', () => {
      const categories = service.getCategories();
      expect(categories.length).toBeGreaterThanOrEqual(5);
      expect(categories[0].slug).toBe('food-beverage');

      const tags = service.getTags();
      expect(tags.length).toBeGreaterThanOrEqual(3);
    });

    it('creates a new category with unique slug', () => {
      const created = service.createCategory({
        name: 'Bất động sản',
        slug: 'real-estate',
        description: 'Mẫu website dự án bds, môi giới nhà đất',
        sortOrder: 6,
      });

      expect(created.id).toBeDefined();
      expect(created.slug).toBe('real-estate');

      expect(() =>
        service.createCategory({
          name: 'Bất động sản 2',
          slug: 'real-estate',
          description: 'Duplicate slug test',
        }),
      ).toThrow(/already exists/);
    });
  });

  describe('Public Listing Search and Filters', () => {
    it('returns published listings by default', () => {
      const result = service.findPublicListings({});
      expect(result.items.length).toBeGreaterThanOrEqual(3);
      expect(result.items.every((i) => i.status === ListingStatus.PUBLISHED)).toBe(true);
    });

    it('filters listings by category slug', () => {
      const result = service.findPublicListings({ category: 'food-beverage' });
      expect(result.items.length).toBe(1);
      expect(result.items[0].slug).toBe('restaurant-pro');
    });

    it('filters listings by fulfillment type (SOURCE_CODE)', () => {
      const result = service.findPublicListings({
        fulfillment: FulfillmentType.SOURCE_CODE,
      });
      expect(result.items.length).toBeGreaterThanOrEqual(2);
      expect(
        result.items.every((i) =>
          i.availableFulfillmentTypes.includes(FulfillmentType.SOURCE_CODE),
        ),
      ).toBe(true);
    });

    it('searches listings by keyword in title or short description', () => {
      const result = service.findPublicListings({ q: 'nhà hàng' });
      expect(result.items.length).toBe(1);
      expect(result.items[0].slug).toBe('restaurant-pro');
    });

    it('gets full detail of published listing by slug', () => {
      const detail = service.getPublicListingBySlug('restaurant-pro');
      expect(detail.slug).toBe('restaurant-pro');
      expect(detail.offers.length).toBe(2);
      expect(detail.priceSummary?.formattedPrice).toBe('3.500.000 ₫');
      expect(detail.gallery.length).toBeGreaterThanOrEqual(2);
    });

    it('throws 404 when listing slug not found', () => {
      expect(() => service.getPublicListingBySlug('non-existing-slug')).toThrow(
        /not found or not published/,
      );
    });
  });

  describe('Offer Management & PRD Compatibility Rules', () => {
    it('prevents invalid combinations: SOURCE_CODE + SUBSCRIPTION', () => {
      const listing = service.createListing({
        title: 'Test Software Solution',
        slug: 'test-software',
        shortDescription: 'Short description for test',
        description: '<p>Full description</p>',
        categorySlug: 'food-beverage',
        listingKind: ListingKind.BUSINESS_WEBSITE,
      });

      expect(() =>
        service.addOfferToListing(listing.id, {
          code: 'INVALID_OFFER',
          name: 'Invalid Subscription Source',
          description: 'This must fail PRD rules',
          fulfillmentType: FulfillmentType.SOURCE_CODE,
          pricingModel: PricingModel.SUBSCRIPTION,
          amountMinor: 500000,
          billingInterval: BillingInterval.MONTH,
        }),
      ).toThrow(/SOURCE_CODE does not support SUBSCRIPTION/);
    });

    it('adds valid offers and computes minor unit prices', () => {
      const listing = service.createListing({
        title: 'Coffee Shop Landing Page',
        slug: 'coffee-landing',
        shortDescription: 'Short description',
        description: '<p>Details</p>',
        categorySlug: 'food-beverage',
        listingKind: ListingKind.LANDING_PAGE,
      });

      const offer = service.addOfferToListing(listing.id, {
        code: 'SOURCE_LICENSE',
        name: 'Single Site License',
        description: 'Complete source files',
        fulfillmentType: FulfillmentType.SOURCE_CODE,
        pricingModel: PricingModel.FIXED,
        amountMinor: 2500000,
        currency: 'VND',
        licenseSummary: 'Standard License',
      });

      expect(offer.id).toBeDefined();
      expect(offer.price?.amountMinor).toBe(2500000);
      expect(offer.price?.formattedPrice).toBe('2.500.000 ₫');
    });
  });

  describe('Listing Lifecycle & State Transitions', () => {
    it('blocks publishing a draft with no offers', () => {
      const draft = service.createListing({
        title: 'Empty Draft',
        slug: 'empty-draft',
        shortDescription: 'No offers yet',
        description: '<p>Desc</p>',
        categorySlug: 'food-beverage',
        listingKind: ListingKind.BUSINESS_WEBSITE,
      });

      expect(() => service.publishListing(draft.id, 'actor-admin')).toThrow(
        /at least one commercial offer/,
      );
    });

    it('publishes listing when it has valid active offer and suspends with reason', () => {
      const draft = service.createListing({
        title: 'Agency Portfolio',
        slug: 'agency-portfolio',
        shortDescription: 'Modern creative portfolio',
        description: '<p>Desc</p>',
        categorySlug: 'fashion-apparel',
        listingKind: ListingKind.BUSINESS_WEBSITE,
        offers: [
          {
            code: 'MANAGED_SETUP',
            name: 'Managed Setup',
            description: 'Full installation',
            fulfillmentType: FulfillmentType.MANAGED_SERVICE,
            pricingModel: PricingModel.FIXED,
            amountMinor: 6000000,
          },
        ],
      });

      const published = service.publishListing(draft.id, 'actor-admin');
      expect(published.status).toBe(ListingStatus.PUBLISHED);
      expect(published.publishedAt).toBeDefined();

      const suspended = service.suspendListing(
        draft.id,
        'DMCA Copyright notice received',
        'actor-admin',
      );
      expect(suspended.status).toBe(ListingStatus.SUSPENDED);

      // Suspended listing must not appear in public catalog
      const searchResult = service.findPublicListings({ q: 'Agency Portfolio' });
      expect(searchResult.items.length).toBe(0);
    });
  });
});
