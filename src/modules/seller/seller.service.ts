import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { MoneyService } from '../../common/money/money.service.js';
import { RequestsService } from '../requests/requests.service.js';
import { CreateSellerListingDto, ModerateSellerListingDto } from './dto/seller.dto.js';
import {
  ALLOWED_SELLER_LISTING_TRANSITIONS,
  SellerLeadItem,
  SellerListing,
  SellerListingStatus,
} from './seller.types.js';

const FIELD_LABELS: Record<string, string> = {
  title: 'Tên Giải Pháp',
  demoUrl: 'Liên Kết Demo Trực Tiếp',
  priceMinor: 'Bảng Giá Niêm Yết',
  summary: 'Mô Tả Phạm Vi',
  fulfillmentType: 'Hình Thức Bàn Giao',
};

@Injectable()
export class SellerService {
  private listings: SellerListing[] = [
    {
      id: 'sel-001',
      slug: 'he-thong-dat-ban-thuc-don-qr-pho-xua',
      title: 'Hệ thống Đặt bàn & Thực đơn QR Phố Xưa',
      categoryId: 'cat-food',
      categoryName: 'Nhà hàng & Ẩm thực',
      sellerId: 'usr-dev-freelance',
      sellerName: 'Nguyễn Văn Dev (Freelancer)',
      summary:
        'Website chuyên biệt cho nhà hàng truyền thống và quán ăn gia đình: đặt bàn chọn khu vực, thực đơn QR tại bàn và đồng bộ bếp.',
      demoUrl: 'https://demo.phonghe.vn/pho-xua',
      fulfillmentType: 'MANAGED_SERVICE',
      priceMinor: 18000000,
      currency: 'VND',
      status: 'PUBLISHED',
      reviewTimeline: [
        {
          id: 'tl-1',
          status: 'DRAFT',
          actorName: 'Nguyễn Văn Dev (Freelancer)',
          summary: 'Khởi tạo hồ sơ giải pháp',
          createdAt: '2026-11-15T08:00:00.000Z',
        },
        {
          id: 'tl-2',
          status: 'SUBMITTED',
          actorName: 'Nguyễn Văn Dev (Freelancer)',
          summary: 'Gửi kiểm duyệt chất lượng & demo',
          createdAt: '2026-11-15T09:30:00.000Z',
        },
        {
          id: 'tl-3',
          status: 'PUBLISHED',
          actorName: 'Hệ Thống Super Admin',
          summary: 'Đã kiểm demo thực tế và xuất bản lên Phố Nghề',
          createdAt: '2026-11-16T10:15:00.000Z',
        },
      ],
      reviewerFeedback: [],
      viewsCount: 1240,
      leadsCount: 14,
      createdAt: '2026-11-15T08:00:00.000Z',
      updatedAt: '2026-11-16T10:15:00.000Z',
    },
    {
      id: 'sel-002',
      slug: 'mau-web-spa-dat-lich-cham-soc-sac-dep',
      title: 'Mẫu Web Spa & Đặt lịch Chăm sóc Sắc đẹp Mộc An',
      categoryId: 'cat-health',
      categoryName: 'Y tế & Chăm sóc',
      sellerId: 'usr-dev-freelance',
      sellerName: 'Nguyễn Văn Dev (Freelancer)',
      summary:
        'Đặt lịch liệu trình theo kỹ thuật viên, nhắc lịch tự động và gói thẻ thành viên điện tử.',
      demoUrl: 'https://demo.phonghe.vn/spa-moc-an',
      fulfillmentType: 'SOURCE_CODE',
      priceMinor: 14500000,
      currency: 'VND',
      status: 'SUBMITTED',
      reviewTimeline: [
        {
          id: 'tl-4',
          status: 'DRAFT',
          actorName: 'Nguyễn Văn Dev (Freelancer)',
          summary: 'Tạo bản nháp giải pháp',
          createdAt: '2026-11-22T14:00:00.000Z',
        },
        {
          id: 'tl-5',
          status: 'SUBMITTED',
          actorName: 'Nguyễn Văn Dev (Freelancer)',
          summary: 'Đang chờ đội ngũ kiểm duyệt kỹ thuật Phố Nghề',
          createdAt: '2026-11-22T15:10:00.000Z',
        },
      ],
      reviewerFeedback: [],
      viewsCount: 0,
      leadsCount: 0,
      createdAt: '2026-11-22T14:00:00.000Z',
      updatedAt: '2026-11-22T15:10:00.000Z',
    },
    {
      id: 'sel-003',
      slug: 'cong-bat-dong-san-mini-ban-do-quy-hoach',
      title: 'Cổng Bất Động Sản Mini & Bản đồ Quy hoạch',
      categoryId: 'cat-hotel',
      categoryName: 'Bất động sản & Lưu trú',
      sellerId: 'usr-dev-freelance',
      sellerName: 'Nguyễn Văn Dev (Freelancer)',
      summary:
        'Hiển thị dự án, tìm kiếm theo phân khúc ngân sách và đặt lịch xem nhà mẫu trực tiếp.',
      demoUrl: 'https://demo.phonghe.vn/bds-mini',
      fulfillmentType: 'MANAGED_SERVICE',
      priceMinor: 25000000,
      currency: 'VND',
      status: 'REJECTED',
      reviewTimeline: [
        {
          id: 'tl-6',
          status: 'SUBMITTED',
          actorName: 'Nguyễn Văn Dev (Freelancer)',
          summary: 'Gửi kiểm duyệt lần 1',
          createdAt: '2026-11-18T11:00:00.000Z',
        },
        {
          id: 'tl-7',
          status: 'REJECTED',
          actorName: 'Hệ Thống Super Admin',
          summary: 'Cần bổ sung phản hồi trên 2 trường dữ liệu trước khi xuất bản',
          createdAt: '2026-11-19T09:00:00.000Z',
        },
      ],
      reviewerFeedback: [
        {
          id: 'fb-1',
          fieldKey: 'demoUrl',
          fieldLabel: FIELD_LABELS.demoUrl,
          comment: 'Trang bản đồ quy hoạch tải chậm trên màn hình mobile 375px, cần tối ưu ảnh SVG.',
          authorName: 'Reviewer Kỹ Thuật Phố Nghề',
          resolved: false,
          createdAt: '2026-11-19T09:00:00.000Z',
        },
        {
          id: 'fb-2',
          fieldKey: 'priceMinor',
          fieldLabel: FIELD_LABELS.priceMinor,
          comment: 'Cần ghi rõ trong mô tả xem giá 25.000.000 đ đã bao gồm phí hosting năm đầu chưa.',
          authorName: 'Reviewer Kỹ Thuật Phố Nghề',
          resolved: false,
          createdAt: '2026-11-19T09:00:00.000Z',
        },
      ],
      viewsCount: 85,
      leadsCount: 0,
      createdAt: '2026-11-18T10:30:00.000Z',
      updatedAt: '2026-11-19T09:00:00.000Z',
    },
  ];

  constructor(
    private readonly moneyService: MoneyService,
    private readonly requestsService: RequestsService,
  ) {}

  getDashboard(sellerId: string, role: string) {
    const scoped =
      role === 'super_admin'
        ? this.listings
        : this.listings.filter((l) => l.sellerId === sellerId);

    return {
      totalListings: scoped.length,
      publishedCount: scoped.filter((l) => l.status === 'PUBLISHED').length,
      submittedCount: scoped.filter((l) => l.status === 'SUBMITTED').length,
      rejectedCount: scoped.filter((l) => l.status === 'REJECTED').length,
      draftCount: scoped.filter((l) => l.status === 'DRAFT').length,
      totalViews: scoped.reduce((acc, l) => acc + l.viewsCount, 0),
      totalLeads: scoped.reduce((acc, l) => acc + l.leadsCount, 0),
    };
  }

  getListings(sellerId: string, role: string): SellerListing[] {
    if (role === 'super_admin') {
      return [...this.listings];
    }
    return this.listings.filter((l) => l.sellerId === sellerId);
  }

  createListing(
    dto: CreateSellerListingDto,
    actor: { id: string; name: string },
  ): SellerListing {
    if (!Number.isInteger(dto.priceMinor) || dto.priceMinor < 100000) {
      throw new BadRequestException('Giá giải pháp phải là số nguyên VND tối thiểu 100.000 đ');
    }

    const validatedMoney = this.moneyService.create(dto.priceMinor, 'VND');
    const now = new Date().toISOString();
    const slugBase = dto.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const listing: SellerListing = {
      id: `sel-${randomUUID().slice(0, 6)}`,
      slug: `${slugBase || 'giai-phap'}-${Date.now().toString().slice(-4)}`,
      title: dto.title.trim(),
      categoryId: dto.categoryId,
      categoryName: dto.categoryName || dto.categoryId,
      sellerId: actor.id,
      sellerName: actor.name,
      summary: dto.summary.trim(),
      demoUrl: dto.demoUrl.trim(),
      fulfillmentType: dto.fulfillmentType,
      priceMinor: Number(validatedMoney.amountMinor),
      currency: 'VND',
      status: 'DRAFT',
      reviewTimeline: [
        {
          id: `tl-${randomUUID().slice(0, 6)}`,
          status: 'DRAFT',
          actorName: actor.name,
          summary: 'Khởi tạo bản nháp giải pháp mới',
          createdAt: now,
        },
      ],
      reviewerFeedback: [],
      viewsCount: 0,
      leadsCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.listings.unshift(listing);
    return listing;
  }

  submitForReview(
    id: string,
    actor: { id: string; name: string; role: string },
  ): SellerListing {
    const listing = this.listings.find((l) => l.id === id);
    if (!listing) {
      throw new NotFoundException(`Không tìm thấy giải pháp ${id}`);
    }
    if (actor.role !== 'super_admin' && listing.sellerId !== actor.id) {
      throw new ForbiddenException('Bạn không có quyền gửi duyệt giải pháp của đối tác khác');
    }

    this.assertTransition(listing.status, 'SUBMITTED');
    const now = new Date().toISOString();
    listing.status = 'SUBMITTED';
    listing.updatedAt = now;
    listing.reviewTimeline.push({
      id: `tl-${randomUUID().slice(0, 6)}`,
      status: 'SUBMITTED',
      actorName: actor.name,
      summary: 'Gửi hồ sơ chờ kiểm duyệt kỹ thuật Phố Nghề',
      createdAt: now,
    });
    return listing;
  }

  moderateListing(
    id: string,
    dto: ModerateSellerListingDto,
    moderator: { name: string },
  ): SellerListing {
    const listing = this.listings.find((l) => l.id === id);
    if (!listing) {
      throw new NotFoundException(`Không tìm thấy giải pháp ${id}`);
    }

    this.assertTransition(listing.status, dto.decision);
    const now = new Date().toISOString();
    listing.status = dto.decision;
    listing.updatedAt = now;

    if (dto.decision === 'REJECTED' && dto.comment) {
      const fieldKey = dto.fieldKey || 'summary';
      listing.reviewerFeedback.push({
        id: `fb-${randomUUID().slice(0, 6)}`,
        fieldKey,
        fieldLabel: FIELD_LABELS[fieldKey] || fieldKey,
        comment: dto.comment.trim(),
        authorName: moderator.name,
        resolved: false,
        createdAt: now,
      });
    }

    listing.reviewTimeline.push({
      id: `tl-${randomUUID().slice(0, 6)}`,
      status: dto.decision,
      actorName: moderator.name,
      summary:
        dto.decision === 'PUBLISHED'
          ? 'Đã duyệt và xuất bản giải pháp lên Sàn Phố Nghề'
          : `Yêu cầu chỉnh sửa: ${dto.comment || 'Chưa đạt tiêu chuẩn demo'}`,
      createdAt: now,
    });

    return listing;
  }

  async getSellerLeads(): Promise<SellerLeadItem[]> {
    const { items } = await this.requestsService.findAllAdmin({ page: 1, limit: 20 });
    // Strip internalNotes & PII strictly per WM-033
    return items.map((req) => ({
      id: req.id,
      referenceCode: req.referenceCode,
      title: req.title,
      industryCategoryId: req.industryCategoryId,
      budgetSummary: req.budget?.maxMinor
        ? `Tối đa ${req.budget.maxMinor.toLocaleString('vi-VN')} đ`
        : 'Thỏa thuận theo phạm vi',
      status: req.status,
      submittedAt: req.submittedAt,
    }));
  }

  private assertTransition(from: SellerListingStatus, to: SellerListingStatus): void {
    const allowed = ALLOWED_SELLER_LISTING_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(`Không thể chuyển trạng thái giải pháp từ "${from}" sang "${to}"`);
    }
  }
}
