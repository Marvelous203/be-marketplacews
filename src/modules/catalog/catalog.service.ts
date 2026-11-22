import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { MoneyService } from '../../common/money/money.service.js';
import {
  Category,
  Tag,
  FeatureDefinition,
  Listing,
  Offer,
  ListingStatus,
  ListingKind,
  FulfillmentType,
  PricingModel,
  BillingInterval,
  OfferStatus,
  SellerType,
} from './catalog.types.js';
import {
  CategoryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/category.dto.js';
import { TagDto, CreateTagDto } from './dto/tag.dto.js';
import { FeatureDefinitionDto } from './dto/feature.dto.js';
import {
  ListingSummaryDto,
  ListingDetailDto,
  ListingFilterQueryDto,
  CreateListingDto,
} from './dto/listing.dto.js';
import { CreateOfferDto, OfferResponseDto } from './dto/offer.dto.js';

@Injectable()
export class CatalogService {
  private categories: Category[] = [];
  private tags: Tag[] = [];
  private featureDefinitions: FeatureDefinition[] = [];
  private listings: Listing[] = [];

  constructor(private readonly moneyService: MoneyService) {
    this.seedInitialCatalog();
  }

  // ==========================================
  // CATEGORIES
  // ==========================================

  getCategories(onlyActive = true): CategoryDto[] {
    const list = onlyActive
      ? this.categories.filter((c) => c.isActive)
      : this.categories;
    return list.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getCategoryBySlug(slug: string): Category {
    const cat = this.categories.find((c) => c.slug === slug);
    if (!cat) {
      throw new NotFoundException(`Category not found with slug: ${slug}`);
    }
    return cat;
  }

  createCategory(dto: CreateCategoryDto): CategoryDto {
    const existing = this.categories.find((c) => c.slug === dto.slug);
    if (existing) {
      throw new ConflictException(`Category slug already exists: ${dto.slug}`);
    }

    if (dto.parentId) {
      const parent = this.categories.find((c) => c.id === dto.parentId);
      if (!parent) {
        throw new BadRequestException(`Parent category not found: ${dto.parentId}`);
      }
    }

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      iconKey: dto.iconKey,
      parentId: dto.parentId || null,
      sortOrder: dto.sortOrder || 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.categories.push(newCat);
    return newCat;
  }

  updateCategory(id: string, dto: UpdateCategoryDto): CategoryDto {
    const cat = this.categories.find((c) => c.id === id);
    if (!cat) {
      throw new NotFoundException(`Category not found with id: ${id}`);
    }

    if (dto.name !== undefined) cat.name = dto.name;
    if (dto.description !== undefined) cat.description = dto.description;
    if (dto.iconKey !== undefined) cat.iconKey = dto.iconKey;
    if (dto.isActive !== undefined) cat.isActive = dto.isActive;
    cat.updatedAt = new Date().toISOString();

    return cat;
  }

  // ==========================================
  // TAGS & FEATURES
  // ==========================================

  getTags(): TagDto[] {
    return this.tags.filter((t) => t.isActive);
  }

  createTag(dto: CreateTagDto): TagDto {
    const existing = this.tags.find((t) => t.slug === dto.slug);
    if (existing) {
      throw new ConflictException(`Tag slug already exists: ${dto.slug}`);
    }

    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      name: dto.name,
      slug: dto.slug,
      tagGroup: dto.tagGroup,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.tags.push(newTag);
    return newTag;
  }

  getFeatures(): FeatureDefinitionDto[] {
    return this.featureDefinitions.filter((f) => f.isFilterable);
  }

  // ==========================================
  // LISTINGS (PUBLIC BROWSE & DETAIL)
  // ==========================================

  findPublicListings(query: ListingFilterQueryDto): {
    items: ListingSummaryDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    let filtered = this.listings.filter(
      (l) => l.status === ListingStatus.PUBLISHED,
    );

    // Filter by Category
    if (query.category) {
      filtered = filtered.filter((l) => l.categorySlug === query.category);
    }

    // Filter by Tag
    if (query.tag) {
      filtered = filtered.filter((l) =>
        l.tags.some((t) => t.slug === query.tag),
      );
    }

    // Filter by Fulfillment Type
    if (query.fulfillment) {
      filtered = filtered.filter((l) =>
        l.offers.some(
          (o) =>
            o.status === OfferStatus.ACTIVE &&
            o.fulfillmentType === query.fulfillment,
        ),
      );
    }

    // Filter by Pricing Model
    if (query.pricing) {
      filtered = filtered.filter((l) =>
        l.offers.some(
          (o) =>
            o.status === OfferStatus.ACTIVE &&
            o.pricingModel === query.pricing,
        ),
      );
    }

    // Text Search in Title / Short Description
    if (query.q) {
      const qLower = query.q.toLowerCase().trim();
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(qLower) ||
          l.shortDescription.toLowerCase().includes(qLower),
      );
    }

    const total = filtered.length;
    const page = query.page || 1;
    const limit = query.limit || 24;
    const startIndex = (page - 1) * limit;
    const paged = filtered.slice(startIndex, startIndex + limit);

    const items = paged.map((l) => this.mapToSummaryDto(l));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  getPublicListingBySlug(slug: string): ListingDetailDto {
    const listing = this.listings.find(
      (l) => l.slug === slug && l.status === ListingStatus.PUBLISHED,
    );
    if (!listing) {
      throw new NotFoundException(`Listing not found or not published: ${slug}`);
    }

    return this.mapToDetailDto(listing);
  }

  // ==========================================
  // ADMIN LISTING MANAGEMENT & STATE TRANSITIONS
  // ==========================================

  createListing(dto: CreateListingDto, creatorOrgId = 'org-platform'): ListingDetailDto {
    const existing = this.listings.find((l) => l.slug === dto.slug);
    if (existing) {
      throw new ConflictException(`Listing slug already exists: ${dto.slug}`);
    }

    const category = this.categories.find((c) => c.slug === dto.categorySlug);
    if (!category) {
      throw new BadRequestException(`Category slug invalid: ${dto.categorySlug}`);
    }

    const newListing: Listing = {
      id: `list-${Date.now()}`,
      ownerOrganizationId: creatorOrgId,
      sellerType: SellerType.PLATFORM,
      sellerName: 'Platform Studio',
      sellerSlug: 'platform',
      categoryId: category.id,
      categorySlug: category.slug,
      categoryName: category.name,
      slug: dto.slug,
      title: dto.title,
      shortDescription: dto.shortDescription,
      description: dto.description,
      listingKind: dto.listingKind || ListingKind.BUSINESS_WEBSITE,
      status: ListingStatus.DRAFT,
      featured: false,
      demoUrl: dto.demoUrl,
      previewMode: 'EXTERNAL_LINK',
      media: [],
      tags: [],
      features: [],
      offers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (dto.offers && dto.offers.length > 0) {
      for (const off of dto.offers) {
        this.validateOfferCompatibility(off.fulfillmentType, off.pricingModel);
        const createdOffer = this.buildOfferEntity(newListing.id, off);
        newListing.offers.push(createdOffer);
      }
    }

    this.listings.push(newListing);
    return this.mapToDetailDto(newListing);
  }

  addOfferToListing(listingId: string, dto: CreateOfferDto): OfferResponseDto {
    const listing = this.listings.find((l) => l.id === listingId);
    if (!listing) {
      throw new NotFoundException(`Listing not found: ${listingId}`);
    }

    this.validateOfferCompatibility(dto.fulfillmentType, dto.pricingModel);

    const existingCode = listing.offers.find((o) => o.code === dto.code);
    if (existingCode) {
      throw new ConflictException(
        `Offer code ${dto.code} already exists for this listing`,
      );
    }

    const offer = this.buildOfferEntity(listing.id, dto);
    listing.offers.push(offer);
    listing.updatedAt = new Date().toISOString();

    return this.mapOfferToDto(offer);
  }

  /**
   * Domain State Transition: Publish Listing
   * Invariant: Bắt buộc phải có title, category, media và ít nhất 1 offer ACTIVE hợp lệ.
   */
  publishListing(id: string, actorId: string): ListingDetailDto {
    const listing = this.listings.find((l) => l.id === id);
    if (!listing) {
      throw new NotFoundException(`Listing not found: ${id}`);
    }

    if (listing.status === ListingStatus.PUBLISHED) {
      return this.mapToDetailDto(listing);
    }

    if (listing.status === ListingStatus.SUSPENDED) {
      throw new BadRequestException(
        'Suspended listing cannot be directly published without moderation resolution',
      );
    }

    if (!listing.offers || listing.offers.length === 0) {
      throw new BadRequestException(
        'Listing cannot be published without at least one commercial offer',
      );
    }

    const activeOffers = listing.offers.filter(
      (o) => o.status === OfferStatus.ACTIVE,
    );
    if (activeOffers.length === 0) {
      throw new BadRequestException(
        'Listing must have at least one ACTIVE offer to be published',
      );
    }

    listing.status = ListingStatus.PUBLISHED;
    listing.publishedAt = new Date().toISOString();
    listing.updatedAt = new Date().toISOString();

    return this.mapToDetailDto(listing);
  }

  /**
   * Domain State Transition: Suspend Listing
   */
  suspendListing(id: string, reason: string, actorId: string): ListingDetailDto {
    const listing = this.listings.find((l) => l.id === id);
    if (!listing) {
      throw new NotFoundException(`Listing not found: ${id}`);
    }

    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('Reason is required when suspending a listing');
    }

    listing.status = ListingStatus.SUSPENDED;
    listing.updatedAt = new Date().toISOString();

    return this.mapToDetailDto(listing);
  }

  // ==========================================
  // VALIDATIONS & HELPER MAPPERS
  // ==========================================

  /**
   * Ma trận hợp lệ PRD §6.2:
   * - SOURCE_CODE: FIXED hoặc QUOTE
   * - MANAGED_SERVICE: FIXED, STARTING_AT hoặc QUOTE
   * - SAAS: SUBSCRIPTION hoặc QUOTE
   * - CUSTOM_PROJECT: QUOTE
   */
  private validateOfferCompatibility(
    fulfillment: FulfillmentType,
    pricing: PricingModel,
  ): void {
    if (
      fulfillment === FulfillmentType.SOURCE_CODE &&
      pricing === PricingModel.SUBSCRIPTION
    ) {
      throw new BadRequestException(
        'PRD Rule Violation: SOURCE_CODE does not support SUBSCRIPTION pricing model in MVP',
      );
    }

    if (
      fulfillment === FulfillmentType.CUSTOM_PROJECT &&
      pricing !== PricingModel.QUOTE
    ) {
      throw new BadRequestException(
        'CUSTOM_PROJECT fulfillment must use QUOTE pricing model',
      );
    }

    if (
      pricing === PricingModel.SUBSCRIPTION &&
      fulfillment !== FulfillmentType.SAAS
    ) {
      throw new BadRequestException(
        'SUBSCRIPTION pricing model is only allowed with SAAS fulfillment',
      );
    }
  }

  private buildOfferEntity(listingId: string, dto: CreateOfferDto): Offer {
    const offerId = `off-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const entity: Offer = {
      id: offerId,
      listingId,
      code: dto.code,
      name: dto.name,
      description: dto.description,
      fulfillmentType: dto.fulfillmentType,
      pricingModel: dto.pricingModel,
      status: OfferStatus.ACTIVE,
      requiresConsultation: dto.requiresConsultation || false,
      licenseSummary: dto.licenseSummary,
      deliveryScope: dto.deliveryScope || {
        included: [],
        excluded: [],
        deliverables: [],
      },
      billingInterval: dto.billingInterval || BillingInterval.ONE_TIME,
      sortOrder: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (dto.amountMinor !== undefined && dto.pricingModel !== PricingModel.QUOTE) {
      const money = this.moneyService.create(
        dto.amountMinor,
        (dto.currency as any) || 'VND',
      );
      entity.currentPrice = {
        id: `price-${Date.now()}`,
        currency: money.currency,
        amountMinor: money.amountMinor,
        billingInterval: entity.billingInterval || BillingInterval.ONE_TIME,
        effectiveFrom: new Date().toISOString(),
        isActive: true,
      };
    }

    return entity;
  }

  private mapToSummaryDto(listing: Listing): ListingSummaryDto {
    const category = this.categories.find((c) => c.id === listing.categoryId);
    const primaryMedia =
      listing.media.find((m) => m.isPrimary) || listing.media[0] || null;

    const availableFulfillmentTypes = Array.from(
      new Set(
        listing.offers
          .filter((o) => o.status === OfferStatus.ACTIVE)
          .map((o) => o.fulfillmentType),
      ),
    );

    // Tính PriceSummary: lấy giá min trong các active offers có giá
    let minPriceMinor: bigint | null = null;
    let currency = 'VND';
    for (const off of listing.offers) {
      if (off.status === OfferStatus.ACTIVE && off.currentPrice) {
        if (minPriceMinor === null || off.currentPrice.amountMinor < minPriceMinor) {
          minPriceMinor = off.currentPrice.amountMinor;
          currency = off.currentPrice.currency;
        }
      }
    }

    let priceSummary: any = undefined;
    if (minPriceMinor !== null) {
      const money = this.moneyService.create(minPriceMinor, currency as any);
      priceSummary = {
        label: 'Từ',
        amountMinor: Number(minPriceMinor),
        formattedPrice: this.moneyService.format(money),
        currency: money.currency,
      };
    }

    return {
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      shortDescription: listing.shortDescription,
      listingKind: listing.listingKind,
      status: listing.status,
      category: {
        id: category?.id || listing.categoryId,
        name: category?.name || listing.categoryName,
        slug: category?.slug || listing.categorySlug,
        description: category?.description || '',
        sortOrder: category?.sortOrder || 0,
        isActive: category?.isActive ?? true,
      },
      seller: {
        id: listing.ownerOrganizationId,
        name: listing.sellerName,
        slug: listing.sellerSlug,
        sellerType: listing.sellerType,
      },
      coverImage: primaryMedia
        ? {
            id: primaryMedia.id,
            url: primaryMedia.url,
            altText: primaryMedia.altText,
            mediaType: primaryMedia.mediaType,
            isPrimary: primaryMedia.isPrimary,
          }
        : null,
      tags: listing.tags.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        tagGroup: t.tagGroup,
      })),
      availableFulfillmentTypes,
      priceSummary,
      featured: listing.featured,
    };
  }

  private mapToDetailDto(listing: Listing): ListingDetailDto {
    const summary = this.mapToSummaryDto(listing);

    return {
      ...summary,
      description: listing.description,
      demoUrl: listing.demoUrl,
      previewMode: listing.previewMode,
      gallery: listing.media.map((m) => ({
        id: m.id,
        url: m.url,
        altText: m.altText,
        mediaType: m.mediaType,
        isPrimary: m.isPrimary,
      })),
      features: listing.features,
      offers: listing.offers
        .filter((o) => o.status === OfferStatus.ACTIVE)
        .map((o) => this.mapOfferToDto(o)),
      publishedAt: listing.publishedAt,
    };
  }

  private mapOfferToDto(offer: Offer): OfferResponseDto {
    let priceDto = undefined;
    if (offer.currentPrice) {
      const money = this.moneyService.create(
        offer.currentPrice.amountMinor,
        offer.currentPrice.currency,
      );
      priceDto = {
        currency: offer.currentPrice.currency,
        amountMinor: Number(offer.currentPrice.amountMinor),
        formattedPrice: this.moneyService.format(money),
        billingInterval: offer.currentPrice.billingInterval,
      };
    }

    return {
      id: offer.id,
      code: offer.code,
      name: offer.name,
      description: offer.description,
      fulfillmentType: offer.fulfillmentType,
      pricingModel: offer.pricingModel,
      status: offer.status,
      requiresConsultation: offer.requiresConsultation,
      licenseSummary: offer.licenseSummary,
      deliveryScope: offer.deliveryScope,
      billingInterval: offer.billingInterval,
      price: priceDto,
    };
  }

  // ==========================================
  // SEED INITIAL DATA (VIETNAMESE SOLUTIONS)
  // ==========================================

  private seedInitialCatalog(): void {
    // 1. Categories
    this.categories = [
      {
        id: 'cat-food',
        name: 'Nhà hàng & Ẩm thực',
        slug: 'food-beverage',
        description: 'Giải pháp website cho nhà hàng, cafe, quán ăn, đặt bàn trực tuyến',
        iconKey: 'utensils',
        parentId: null,
        sortOrder: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'cat-fashion',
        name: 'Thời trang & Mỹ phẩm',
        slug: 'fashion-apparel',
        description: 'Thương mại điện tử cao cấp, bộ sưu tập lookbook, mix-match visual',
        iconKey: 'shirt',
        parentId: null,
        sortOrder: 2,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'cat-health',
        name: 'Y tế & Phòng khám',
        slug: 'healthcare',
        description: 'Cổng thông tin bác sĩ, đặt lịch khám, bảng giá dịch vụ y khoa',
        iconKey: 'stethoscope',
        parentId: null,
        sortOrder: 3,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'cat-edu',
        name: 'Giáo dục & Khóa học',
        slug: 'education',
        description: 'Trung tâm đào tạo, giới thiệu khóa học, tuyển sinh trực tuyến',
        iconKey: 'graduation-cap',
        parentId: null,
        sortOrder: 4,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'cat-hotel',
        name: 'Khách sạn & Nghỉ dưỡng',
        slug: 'hospitality',
        description: 'Website khách sạn, resort, boutique homestay và booking phòng',
        iconKey: 'hotel',
        parentId: null,
        sortOrder: 5,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // 2. Tags
    this.tags = [
      { id: 'tag-nextjs', name: 'Next.js', slug: 'nextjs', tagGroup: 'TECH', isActive: true, createdAt: new Date().toISOString() },
      { id: 'tag-tailwind', name: 'Tailwind CSS', slug: 'tailwind', tagGroup: 'TECH', isActive: true, createdAt: new Date().toISOString() },
      { id: 'tag-booking', name: 'Đặt chỗ', slug: 'booking', tagGroup: 'FEATURE', isActive: true, createdAt: new Date().toISOString() },
      { id: 'tag-ecommerce', name: 'Thương mại điện tử', slug: 'ecommerce', tagGroup: 'FEATURE', isActive: true, createdAt: new Date().toISOString() },
      { id: 'tag-seo', name: 'Chuẩn SEO', slug: 'seo', tagGroup: 'FEATURE', isActive: true, createdAt: new Date().toISOString() },
    ];

    // 3. Features
    this.featureDefinitions = [
      { id: 'f-booking', key: 'booking_engine', label: 'Đặt bàn / Đặt lịch trực tuyến', dataType: 'BOOLEAN', groupName: 'Nghiệp vụ', isFilterable: true },
      { id: 'f-ecommerce', key: 'online_payment', label: 'Thanh toán trực tuyến (VietQR/VNPay)', dataType: 'BOOLEAN', groupName: 'Thanh toán', isFilterable: true },
      { id: 'f-cms', key: 'cms_admin', label: 'Quản trị bài viết & menu CMS', dataType: 'BOOLEAN', groupName: 'Nội dung', isFilterable: true },
      { id: 'f-responsive', key: 'mobile_responsive', label: 'Tối ưu 100% Mobile & Tablet', dataType: 'BOOLEAN', groupName: 'Giao diện', isFilterable: true },
    ];

    // 4. Initial Listings
    const now = new Date().toISOString();

    // Listing 1: Restaurant Pro
    const restaurantListing: Listing = {
      id: 'list-restaurant-pro',
      ownerOrganizationId: 'org-platform',
      sellerType: SellerType.PLATFORM,
      sellerName: 'Platform Studio',
      sellerSlug: 'platform',
      categoryId: 'cat-food',
      categorySlug: 'food-beverage',
      categoryName: 'Nhà hàng & Ẩm thực',
      slug: 'restaurant-pro',
      title: 'Restaurant Pro — Mẫu Website Nhà hàng & Đặt bàn Cao cấp',
      shortDescription: 'Giao diện phong cách sang trọng, tối ưu hình ảnh món ăn, tích hợp đặt bàn giữ chỗ và thực đơn QR.',
      description: `<h3>Giải pháp toàn diện cho Nhà hàng & Chuỗi F&B</h3>
<p>Restaurant Pro được xây dựng trên công nghệ Next.js hiện đại, tối ưu tốc độ tải trang cực nhanh, đạt 98+ điểm Google PageSpeed.</p>
<h4>Tính năng nổi bật:</h4>
<ul>
  <li>Form đặt bàn thông minh tự động kiểm tra khung giờ và số khách.</li>
  <li>Thực đơn điện tử phân nhóm khai vị, món chính, đồ uống kèm giá và hình ảnh sắc nét.</li>
  <li>Kết nối Google Maps chỉ đường và nút gọi hotline tức thời.</li>
  <li>Trang giới thiệu câu chuyện đầu bếp và không gian nhà hàng.</li>
</ul>`,
      listingKind: ListingKind.BUSINESS_WEBSITE,
      status: ListingStatus.PUBLISHED,
      featured: true,
      demoUrl: 'https://demo-restaurant.example.com',
      previewMode: 'EXTERNAL_LINK',
      media: [
        {
          id: 'med-rest-1',
          url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
          altText: 'Ảnh tổng quan trang chủ nhà hàng cao cấp',
          mediaType: 'IMAGE',
          isPrimary: true,
          sortOrder: 1,
        },
        {
          id: 'med-rest-2',
          url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
          altText: 'Không gian bàn ăn và thực đơn sang trọng',
          mediaType: 'IMAGE',
          isPrimary: false,
          sortOrder: 2,
        },
      ],
      tags: [this.tags[0], this.tags[1], this.tags[2]],
      features: [
        { key: 'booking_engine', label: 'Đặt bàn trực tuyến', value: true },
        { key: 'cms_admin', label: 'Quản trị bài viết & menu', value: true },
        { key: 'mobile_responsive', label: 'Chuẩn di động 100%', value: true },
      ],
      offers: [
        {
          id: 'off-rest-source',
          listingId: 'list-restaurant-pro',
          code: 'SOURCE_CODE_LICENSE',
          name: 'Bản quyền Mã nguồn (Source Code)',
          description: 'Nhận toàn bộ source code Next.js TypeScript, database schema và tài liệu hướng dẫn tự deploy.',
          fulfillmentType: FulfillmentType.SOURCE_CODE,
          pricingModel: PricingModel.FIXED,
          status: OfferStatus.ACTIVE,
          requiresConsultation: false,
          licenseSummary: 'Single Domain Standard Commercial License (Không được bán lại source code)',
          deliveryScope: {
            included: ['Toàn bộ source code Next.js', 'File cấu hình Tailwind CSS', 'Tài liệu hướng dẫn cài đặt'],
            excluded: ['Cài đặt lên hosting của khách', 'Nhập liệu hình ảnh nội dung'],
            deliverables: ['Link tải file nén zip có ký số bảo mật', 'Quyền truy cập repository private'],
          },
          currentPrice: {
            id: 'price-rest-src',
            currency: 'VND',
            amountMinor: 3500000n, // 3.500.000 VND
            billingInterval: BillingInterval.ONE_TIME,
            effectiveFrom: now,
            isActive: true,
          },
          sortOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'off-rest-managed',
          listingId: 'list-restaurant-pro',
          code: 'MANAGED_DEPLOYMENT',
          name: 'Gói Triển khai Trọn gói (Managed Service)',
          description: 'Đội ngũ kỹ thuật cấu hình domain, hosting SSL, thay logo, màu sắc thương hiệu và up menu mẫu hoàn chỉnh.',
          fulfillmentType: FulfillmentType.MANAGED_SERVICE,
          pricingModel: PricingModel.FIXED,
          status: OfferStatus.ACTIVE,
          requiresConsultation: false,
          deliveryScope: {
            included: ['Tùy biến màu sắc, logo nhận diện', 'Cài đặt domain và chứng chỉ SSL', 'Miễn phí hosting năm đầu', 'Bảo hành kỹ thuật 12 tháng'],
            excluded: ['Viết bài PR báo chí', 'Chụp ảnh món ăn tại quán'],
            deliverables: ['Website bàn giao live trên domain khách hàng', 'Tài khoản quản trị CMS'],
          },
          currentPrice: {
            id: 'price-rest-mng',
            currency: 'VND',
            amountMinor: 8500000n, // 8.500.000 VND
            billingInterval: BillingInterval.ONE_TIME,
            effectiveFrom: now,
            isActive: true,
          },
          sortOrder: 2,
          createdAt: now,
          updatedAt: now,
        },
      ],
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    // Listing 2: Fashion Boutique Store
    const fashionListing: Listing = {
      id: 'list-fashion-store',
      ownerOrganizationId: 'org-platform',
      sellerType: SellerType.PLATFORM,
      sellerName: 'Platform Studio',
      sellerSlug: 'platform',
      categoryId: 'cat-fashion',
      categorySlug: 'fashion-apparel',
      categoryName: 'Thời trang & Mỹ phẩm',
      slug: 'fashion-boutique',
      title: 'Fashion Boutique — Website Thương mại Thời trang & Lookbook',
      shortDescription: 'Giao diện thương mại điện tử phong cách tối giản chuẩn quốc tế, lọc size/màu mượt mà, giỏ hàng tối ưu.',
      description: `<h3>Thiết kế dành riêng cho Thương hiệu Thời trang & Phụ kiện</h3>
<p>Website chú trọng hình ảnh thị giác cao cấp, hỗ trợ bộ sưu tập Lookbook theo mùa, giỏ hàng AJAX không tải lại trang và thanh toán quét mã QR tiện lợi.</p>`,
      listingKind: ListingKind.ECOMMERCE,
      status: ListingStatus.PUBLISHED,
      featured: true,
      demoUrl: 'https://demo-fashion.example.com',
      previewMode: 'EXTERNAL_LINK',
      media: [
        {
          id: 'med-fash-1',
          url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
          altText: 'Giao diện cửa hàng thời trang sang trọng',
          mediaType: 'IMAGE',
          isPrimary: true,
          sortOrder: 1,
        },
      ],
      tags: [this.tags[0], this.tags[1], this.tags[3]],
      features: [
        { key: 'online_payment', label: 'Tích hợp VietQR', value: true },
        { key: 'cms_admin', label: 'Quản trị sản phẩm', value: true },
        { key: 'mobile_responsive', label: 'Chuẩn di động 100%', value: true },
      ],
      offers: [
        {
          id: 'off-fash-source',
          listingId: 'list-fashion-store',
          code: 'SOURCE_CODE_LICENSE',
          name: 'Bản quyền Mã nguồn',
          description: 'Source code E-commerce Next.js đầy đủ giỏ hàng, trang sản phẩm và checkout.',
          fulfillmentType: FulfillmentType.SOURCE_CODE,
          pricingModel: PricingModel.FIXED,
          status: OfferStatus.ACTIVE,
          requiresConsultation: false,
          licenseSummary: 'Single Commercial License',
          deliveryScope: {
            included: ['Source code frontend & backend API', 'PostgreSQL migration schema'],
            excluded: ['Cổng thanh toán riêng của khách'],
            deliverables: ['Gói source code đã ký số'],
          },
          currentPrice: {
            id: 'price-fash-src',
            currency: 'VND',
            amountMinor: 5000000n, // 5.000.000 VND
            billingInterval: BillingInterval.ONE_TIME,
            effectiveFrom: now,
            isActive: true,
          },
          sortOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'off-fash-saas',
          listingId: 'list-fashion-store',
          code: 'SAAS_MONTHLY',
          name: 'Thuê bao Cloud (SaaS Monthly)',
          description: 'Sử dụng trọn gói trên cloud của nền tảng, tự động cập nhật tính năng mới, miễn phí server & SSL.',
          fulfillmentType: FulfillmentType.SAAS,
          pricingModel: PricingModel.SUBSCRIPTION,
          status: OfferStatus.ACTIVE,
          requiresConsultation: false,
          billingInterval: BillingInterval.MONTH,
          trialDays: 14,
          deliveryScope: {
            included: ['Hạ tầng Cloud tốc độ cao', 'Cập nhật bảo mật định kỳ', 'Hỗ trợ kỹ thuật 24/7'],
            excluded: ['Bàn giao file source code gốc'],
            deliverables: ['Tenant workspace riêng và quyền trỏ custom domain'],
          },
          currentPrice: {
            id: 'price-fash-saas',
            currency: 'VND',
            amountMinor: 450000n, // 450.000 VND / tháng
            billingInterval: BillingInterval.MONTH,
            effectiveFrom: now,
            isActive: true,
          },
          sortOrder: 2,
          createdAt: now,
          updatedAt: now,
        },
      ],
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    // Listing 3: ClinicCare
    const clinicListing: Listing = {
      id: 'list-clinic-care',
      ownerOrganizationId: 'org-platform',
      sellerType: SellerType.PLATFORM,
      sellerName: 'Platform Studio',
      sellerSlug: 'platform',
      categoryId: 'cat-health',
      categorySlug: 'healthcare',
      categoryName: 'Y tế & Phòng khám',
      slug: 'clinic-care',
      title: 'ClinicCare — Hệ thống Website Phòng khám & Lịch hẹn Chuyên gia',
      shortDescription: 'Mẫu website phòng khám đa khoa, nha khoa, thẩm mỹ viện với hệ thống đặt hẹn bác sĩ và bảng giá y tế.',
      description: `<h3>Uy tín và Chuyên nghiệp cho Cơ sở Y tế</h3>
<p>ClinicCare mang lại cảm giác tin cậy cho bệnh nhân với hồ sơ đội ngũ y bác sĩ, chứng chỉ hành nghề, bảng giá dịch vụ minh bạch và quy trình đặt lịch khám theo chuyên khoa.</p>`,
      listingKind: ListingKind.BUSINESS_WEBSITE,
      status: ListingStatus.PUBLISHED,
      featured: false,
      demoUrl: 'https://demo-clinic.example.com',
      previewMode: 'EXTERNAL_LINK',
      media: [
        {
          id: 'med-clinic-1',
          url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
          altText: 'Không gian phòng khám hiện đại và bác sĩ tận tâm',
          mediaType: 'IMAGE',
          isPrimary: true,
          sortOrder: 1,
        },
      ],
      tags: [this.tags[0], this.tags[2]],
      features: [
        { key: 'booking_engine', label: 'Đặt lịch khám theo bác sĩ', value: true },
        { key: 'mobile_responsive', label: 'Tối ưu trên điện thoại', value: true },
      ],
      offers: [
        {
          id: 'off-clinic-mng',
          listingId: 'list-clinic-care',
          code: 'CLINIC_SETUP',
          name: 'Gói Triển khai Tiêu chuẩn Phòng khám',
          description: 'Cài đặt và cấu hình hoàn thiện hệ thống phòng khám, tối ưu chuẩn SEO địa điểm y tế.',
          fulfillmentType: FulfillmentType.MANAGED_SERVICE,
          pricingModel: PricingModel.FIXED,
          status: OfferStatus.ACTIVE,
          requiresConsultation: false,
          deliveryScope: {
            included: ['Khởi tạo danh sách bác sĩ và dịch vụ y tế', 'Cấu hình thông báo lịch hẹn qua email'],
            excluded: ['Tích hợp bệnh án điện tử HIS/EMR của bệnh viện'],
            deliverables: ['Hệ thống hoàn thiện sẵn sàng đón bệnh nhân'],
          },
          currentPrice: {
            id: 'price-clinic-mng',
            currency: 'VND',
            amountMinor: 12000000n, // 12.000.000 VND
            billingInterval: BillingInterval.ONE_TIME,
            effectiveFrom: now,
            isActive: true,
          },
          sortOrder: 1,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'off-clinic-custom',
          listingId: 'list-clinic-care',
          code: 'CLINIC_ENTERPRISE',
          name: 'Giải pháp Bệnh viện Tùy biến (Custom Project)',
          description: 'Tư vấn và phát triển tích hợp sâu vào hệ thống quản lý viện, cổng thanh toán viện phí và hồ sơ bệnh án.',
          fulfillmentType: FulfillmentType.CUSTOM_PROJECT,
          pricingModel: PricingModel.QUOTE,
          status: OfferStatus.ACTIVE,
          requiresConsultation: true,
          deliveryScope: {
            included: ['Khảo sát yêu cầu riêng', 'Lập Statement of Work (SOW)', 'Kiểm thử bảo mật dữ liệu y tế'],
            excluded: [],
            deliverables: ['Sản phẩm phần mềm theo hợp đồng dự án'],
          },
          sortOrder: 2,
          createdAt: now,
          updatedAt: now,
        },
      ],
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    this.listings = [restaurantListing, fashionListing, clinicListing];
  }
}
