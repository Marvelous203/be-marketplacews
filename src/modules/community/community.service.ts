import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { MoneyService } from '../../common/money/money.service.js';
import {
  ForumCategory,
  ForumThread,
  ReactionType,
  ThreadProposal,
  ThreadReply,
  ThreadType,
} from './community.types.js';
import { CreateProposalDto, CreateThreadDto } from './dto/community.dto.js';

@Injectable()
export class CommunityService {
  private categories: ForumCategory[] = [];
  private threads: ForumThread[] = [];

  constructor(@Optional() private readonly moneyService?: MoneyService) {
    this.seedCommunityData();
  }

  getCategories(): ForumCategory[] {
    return this.categories.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getThreads(query: {
    category?: string;
    threadType?: ThreadType;
    q?: string;
    limit?: number;
  } = {}): { items: ForumThread[]; total: number } {
    let filtered = this.threads.filter((t) => t.status === 'PUBLISHED');

    if (query.category) {
      filtered = filtered.filter((t) => t.categorySlug === query.category);
    }

    if (query.threadType) {
      filtered = filtered.filter((t) => t.threadType === query.threadType);
    }

    if (query.q) {
      const qLower = query.q.toLowerCase().trim();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(qLower) ||
          t.summary.toLowerCase().includes(qLower),
      );
    }

    filtered.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (
        new Date(b.lastActivityAt).getTime() -
        new Date(a.lastActivityAt).getTime()
      );
    });

    const limit = query.limit || 20;
    const items = filtered.slice(0, limit);

    return {
      items,
      total: filtered.length,
    };
  }

  getThreadBySlug(slug: string): ForumThread {
    const thread = this.threads.find(
      (t) => (t.slug === slug || t.id === slug) && t.status === 'PUBLISHED',
    );
    if (!thread) {
      throw new NotFoundException(`Thread not found with slug: ${slug}`);
    }
    thread.viewCount += 1;
    return thread;
  }

  reactToThread(idOrSlug: string, reactionType: ReactionType): ForumThread {
    const thread = this.threads.find(
      (t) => (t.id === idOrSlug || t.slug === idOrSlug) && t.status === 'PUBLISHED',
    );
    if (!thread) {
      throw new NotFoundException(`Không tìm thấy bài viết: ${idOrSlug}`);
    }
    if (reactionType === 'HELPFUL') {
      thread.reactions.helpful += 1;
      thread.likeCount += 1;
    } else if (reactionType === 'TRIED') {
      thread.reactions.tried += 1;
    } else if (reactionType === 'NEED_DEMO') {
      thread.reactions.needDemo += 1;
    }
    return thread;
  }

  createThread(
    dto: CreateThreadDto,
    author: { id: string; name: string; role: string },
  ): ForumThread {
    const now = new Date().toISOString();
    const slugBase = dto.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const catMap: Record<string, { slug: string; name: string }> = {
      WANTED: { slug: 'wanted', name: 'Cần giải pháp (Request Board)' },
      QUESTION: { slug: 'qa', name: 'Hỏi đáp Kỹ thuật (Q&A)' },
      SHOWCASE: { slug: 'showcase', name: 'Khoe sản phẩm (Showcase)' },
      DISCUSSION: { slug: 'general', name: 'Thảo luận Chung' },
    };
    const cat = catMap[dto.threadType] || catMap.DISCUSSION;

    const newThread: ForumThread = {
      id: `thr-${randomUUID().slice(0, 6)}`,
      categorySlug: cat.slug,
      categoryName: cat.name,
      author: {
        id: author.id,
        name: author.name,
        username: author.name.toLowerCase().replace(/\s+/g, '.'),
        badge:
          author.role === 'dev_freelance'
            ? 'SELLER_VERIFIED'
            : author.role === 'super_admin'
              ? 'STAFF'
              : 'TRUSTED_MEMBER',
      },
      threadType: dto.threadType,
      title: dto.title.trim(),
      slug: `${slugBase || 'bai-viet'}-${Date.now().toString().slice(-4)}`,
      summary: dto.bodyMd.trim().slice(0, 160),
      bodyMd: dto.bodyMd.trim(),
      status: 'PUBLISHED',
      pinned: false,
      replyCount: 0,
      viewCount: 1,
      likeCount: 0,
      reactions: { helpful: 0, tried: 0, needDemo: 0 },
      proposals: dto.threadType === 'WANTED' ? [] : undefined,
      replies: [],
      createdAt: now,
      lastActivityAt: now,
      ...(dto.threadType === 'WANTED'
        ? {
            wantedDetails: {
              goalSummary: dto.title.trim(),
              budgetRange: dto.budgetRange || 'Thỏa thuận theo phạm vi',
              budgetCurrency: 'VND',
              status: 'OPEN',
              proposalCount: 0,
            },
          }
        : {}),
      ...(dto.threadType === 'SHOWCASE' && dto.relatedListingSlug
        ? {
            showcaseDetails: {
              relatedListingSlug: dto.relatedListingSlug,
              relatedListingTitle: dto.title.trim(),
            },
          }
        : {}),
    };

    this.threads.unshift(newThread);
    return newThread;
  }

  addProposal(
    threadIdOrSlug: string,
    dto: CreateProposalDto,
    seller: { id: string; name: string },
  ): ThreadProposal {
    const thread = this.threads.find(
      (t) => t.id === threadIdOrSlug || t.slug === threadIdOrSlug,
    );
    if (!thread) {
      throw new NotFoundException(`Không tìm thấy phiếu yêu cầu: ${threadIdOrSlug}`);
    }
    if (thread.threadType !== 'WANTED') {
      throw new BadRequestException('Chỉ có thể gửi Proposal cho bài viết loại "Cần giải pháp (WANTED)"');
    }
    if (!Number.isInteger(dto.priceMinor) || dto.priceMinor < 100000) {
      throw new BadRequestException('Chi phí đề xuất phải là số nguyên VND tối thiểu 100.000 đ');
    }

    const validated = this.moneyService
      ? this.moneyService.create(dto.priceMinor, 'VND')
      : { amountMinor: BigInt(dto.priceMinor) };

    const proposal: ThreadProposal = {
      id: `prop-${randomUUID().slice(0, 6)}`,
      threadId: thread.id,
      sellerId: seller.id,
      sellerName: seller.name,
      sellerBadge: 'Seller Xác Minh',
      priceMinor: Number(validated.amountMinor),
      currency: 'VND',
      estimatedDays: dto.estimatedDays,
      pitchSummary: dto.pitchSummary.trim(),
      demoUrl: dto.demoUrl?.trim(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    if (!thread.proposals) thread.proposals = [];
    thread.proposals.push(proposal);
    if (thread.wantedDetails) {
      thread.wantedDetails.proposalCount = thread.proposals.length;
      if (thread.wantedDetails.status === 'OPEN') {
        thread.wantedDetails.status = 'IN_DISCUSSION';
      }
    }
    thread.lastActivityAt = proposal.createdAt;
    return proposal;
  }

  addReply(
    threadIdOrSlug: string,
    body: string,
    author: { name: string; role: string },
  ): ThreadReply {
    const thread = this.threads.find(
      (t) => t.id === threadIdOrSlug || t.slug === threadIdOrSlug,
    );
    if (!thread) {
      throw new NotFoundException(`Không tìm thấy bài viết: ${threadIdOrSlug}`);
    }
    const reply: ThreadReply = {
      id: `rep-${randomUUID().slice(0, 6)}`,
      threadId: thread.id,
      authorName: author.name,
      authorRole: author.role,
      body: body.trim(),
      createdAt: new Date().toISOString(),
    };
    if (!thread.replies) thread.replies = [];
    thread.replies.push(reply);
    thread.replyCount = thread.replies.length;
    thread.lastActivityAt = reply.createdAt;
    return reply;
  }

  private seedCommunityData(): void {
    this.categories = [
      {
        id: 'fcat-announcements',
        name: 'Thông báo & Tin tức Sàn',
        slug: 'announcements',
        description: 'Chính sách kiểm duyệt, cập nhật tính năng và quy chuẩn bảo đảm',
        sortOrder: 1,
        allowedThreadTypes: ['ANNOUNCEMENT'],
        threadCount: 3,
      },
      {
        id: 'fcat-wanted',
        name: 'Cần giải pháp (Request Board)',
        slug: 'wanted',
        description: 'Nơi người cần làm website đăng yêu cầu để Seller xác minh gửi proposal',
        sortOrder: 2,
        allowedThreadTypes: ['WANTED'],
        threadCount: 8,
      },
      {
        id: 'fcat-qa',
        name: 'Hỏi đáp Kỹ thuật (Q&A)',
        slug: 'qa',
        description: 'Giải đáp thắc mắc về Next.js, NestJS, Tailwind, SEO, tối ưu tốc độ',
        sortOrder: 3,
        allowedThreadTypes: ['QUESTION', 'DISCUSSION'],
        threadCount: 15,
      },
      {
        id: 'fcat-showcase',
        name: 'Khoe sản phẩm (Showcase)',
        slug: 'showcase',
        description: 'Giới thiệu các dự án website hoàn thành, chia sẻ link demo thực tế',
        sortOrder: 4,
        allowedThreadTypes: ['SHOWCASE'],
        threadCount: 12,
      },
      {
        id: 'fcat-general',
        name: 'Thảo luận Chung',
        slug: 'general',
        description: 'Trao đổi kinh nghiệm freelancer, báo giá, hợp đồng và quản trị dự án web',
        sortOrder: 5,
        allowedThreadTypes: ['DISCUSSION'],
        threadCount: 20,
      },
    ];

    const now = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();

    this.threads = [
      {
        id: 'thr-1',
        categorySlug: 'wanted',
        categoryName: 'Cần giải pháp (Request Board)',
        author: {
          id: 'u-1',
          name: 'Trần Minh Quân',
          username: 'quan.tran',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          badge: 'TRUSTED_MEMBER',
        },
        threadType: 'WANTED',
        title: 'Cần tìm Studio thiết kế website bán lẻ Đồng hồ cơ khí cao cấp (Next.js + VietQR)',
        slug: 'can-thiet-ke-web-dong-ho-cao-cap',
        summary: 'Cần website có giao diện Dark theme sang trọng, xem ảnh 360 độ mặt đồng hồ, giỏ hàng thanh toán VietQR tự động, bàn giao cả source code.',
        bodyMd: `Chúng tôi đang phát triển thương hiệu đồng hồ cơ khí tại TP.HCM. Cần tìm đối tác có kinh nghiệm:
- Yêu cầu: Giao diện chuẩn mực cao cấp, tối ưu Core Web Vitals.
- Tính năng: Xem ảnh chi tiết, bộ lọc theo thương hiệu/bộ máy, thanh toán quét mã QR.
- Ngân sách: 15.000.000 - 25.000.000 VND.
- Thời hạn: Hoàn thành trong 3 tuần.
Các seller xác minh xin vui lòng gửi Proposal qua hệ thống!`,
        status: 'PUBLISHED',
        pinned: true,
        replyCount: 2,
        viewCount: 342,
        likeCount: 18,
        reactions: { helpful: 18, tried: 2, needDemo: 5 },
        createdAt: yesterday,
        lastActivityAt: now,
        wantedDetails: {
          goalSummary: 'Website đồng hồ cơ khí Dark Theme, thanh toán VietQR',
          budgetRange: '15.000.000 - 25.000.000 ₫',
          budgetCurrency: 'VND',
          targetDate: '2026-12-15',
          status: 'IN_DISCUSSION',
          proposalCount: 2,
        },
        proposals: [
          {
            id: 'prop-101',
            threadId: 'thr-1',
            sellerId: 'usr-dev-freelance',
            sellerName: 'Nguyễn Văn Dev (Freelancer)',
            sellerBadge: 'Seller Xác Minh',
            priceMinor: 18500000,
            currency: 'VND',
            estimatedDays: 18,
            pitchSummary: 'Đã có sẵn nền tảng Next.js 16 + NestJS tối ưu 98 điểm PageSpeed, tích hợp sẵn VietQR MB Bank và bàn giao toàn bộ source sạch.',
            demoUrl: 'https://demo.phonghe.vn/watch-classic',
            status: 'SHORTLISTED',
            createdAt: yesterday,
          },
          {
            id: 'prop-102',
            threadId: 'thr-1',
            sellerId: 'usr-studio-02',
            sellerName: 'Mộc Studio Web',
            sellerBadge: 'Đối Tác Vàng',
            priceMinor: 23000000,
            currency: 'VND',
            estimatedDays: 14,
            pitchSummary: 'Thiết kế riêng bộ icon và trải nghiệm xoay ảnh sản phẩm 360 độ mượt mà trên mobile, kèm bảo hành 12 tháng.',
            demoUrl: 'https://demo.phonghe.vn/watch-360',
            status: 'PENDING',
            createdAt: now,
          },
        ],
        replies: [
          {
            id: 'rep-1',
            threadId: 'thr-1',
            authorName: 'Nguyễn Văn Dev (Freelancer)',
            authorRole: 'dev_freelance',
            body: 'Mình đã gửi Proposal kèm link demo thực tế cho dòng đồng hồ cơ, anh Quân xem qua nhé!',
            createdAt: yesterday,
          },
        ],
      },
      {
        id: 'thr-2',
        categorySlug: 'qa',
        categoryName: 'Hỏi đáp Kỹ thuật (Q&A)',
        author: {
          id: 'u-2',
          name: 'Lê Hoàng Nam',
          username: 'nam.dev',
          avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
          badge: 'SELLER_VERIFIED',
        },
        threadType: 'QUESTION',
        title: 'Cách tối ưu LCP và Core Web Vitals cho Next.js 16 trên Cloudflare Pages đạt 99 điểm?',
        slug: 'toi-uu-lcp-core-web-vitals-nextjs-16',
        summary: 'Chia sẻ kinh nghiệm nạp font cục bộ, tối ưu thẻ ảnh responsive và thiết lập cache-control header để tránh layout shift.',
        bodyMd: `Mọi người cho mình hỏi giải pháp tốt nhất để giảm TTFB và LCP khi deploy Next.js 16 App Router lên Cloudflare Pages? Sau đây là kinh nghiệm thực chiến mình đã áp dụng thành công đạt 99 điểm PageSpeed...`,
        status: 'PUBLISHED',
        pinned: false,
        replyCount: 14,
        viewCount: 890,
        likeCount: 45,
        reactions: { helpful: 45, tried: 19, needDemo: 3 },
        createdAt: twoDaysAgo,
        lastActivityAt: yesterday,
        questionDetails: {
          hasAcceptedAnswer: true,
        },
      },
      {
        id: 'thr-3',
        categorySlug: 'showcase',
        categoryName: 'Khoe sản phẩm (Showcase)',
        author: {
          id: 'u-platform',
          name: 'Platform Official',
          username: 'platform.team',
          avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
          badge: 'STAFF',
        },
        threadType: 'SHOWCASE',
        title: 'Ra mắt giải pháp Restaurant Pro v1.1: Đặt bàn thông minh & Thực đơn QR cho chuỗi F&B',
        slug: 'showcase-restaurant-pro-v1',
        summary: 'Demo thực tế giải pháp website nhà hàng hoàn chỉnh đã xuất bản trên sàn WebMarket với 2 gói: Bán source code và Triển khai trọn gói.',
        bodyMd: `Chào cộng đồng WebMarket! Đội ngũ vừa phát hành phiên bản mới của giải pháp Restaurant Pro. Bạn có thể xem demo trực tiếp hoặc đặt mua bản quyền mã nguồn sạch 100% tại Marketplace.`,
        status: 'PUBLISHED',
        pinned: false,
        replyCount: 8,
        viewCount: 620,
        likeCount: 32,
        reactions: { helpful: 32, tried: 11, needDemo: 7 },
        createdAt: twoDaysAgo,
        lastActivityAt: now,
        showcaseDetails: {
          relatedListingSlug: 'restaurant-pro',
          relatedListingTitle: 'Restaurant Pro — Mẫu Website Nhà hàng & Đặt bàn Cao cấp',
          coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
        },
      },
      {
        id: 'thr-4',
        categorySlug: 'wanted',
        categoryName: 'Cần giải pháp (Request Board)',
        author: {
          id: 'u-3',
          name: 'Nguyễn Thu Trang',
          username: 'trang.clinic',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
          badge: 'NEW_MEMBER',
        },
        threadType: 'WANTED',
        title: 'Cần website Phòng khám Nha khoa tích hợp xem trước nụ cười AI và đặt hẹn bác sĩ',
        slug: 'can-website-nha-khoa-ai-smile',
        summary: 'Tìm đối tác agency triển khai website nha khoa thẩm mỹ, yêu cầu có bảng giá dịch vụ rõ ràng, form tư vấn và kết nối Zalo OA.',
        bodyMd: `Nha khoa cần xây dựng trang web mới hướng đến khách hàng phân khúc trung & cao cấp. Ngân sách từ 10.000.000 - 18.000.000 VND. Cần hoàn thành trước Tết.`,
        status: 'PUBLISHED',
        pinned: false,
        replyCount: 3,
        viewCount: 210,
        likeCount: 7,
        reactions: { helpful: 7, tried: 0, needDemo: 2 },
        createdAt: yesterday,
        lastActivityAt: now,
        wantedDetails: {
          goalSummary: 'Website nha khoa thẩm mỹ đặt hẹn online',
          budgetRange: '10.000.000 - 18.000.000 ₫',
          budgetCurrency: 'VND',
          targetDate: '2026-12-25',
          status: 'OPEN',
          proposalCount: 1,
        },
        proposals: [
          {
            id: 'prop-201',
            threadId: 'thr-4',
            sellerId: 'usr-dev-freelance',
            sellerName: 'Nguyễn Văn Dev (Freelancer)',
            sellerBadge: 'Seller Xác Minh',
            priceMinor: 15000000,
            currency: 'VND',
            estimatedDays: 12,
            pitchSummary: 'Triển khai trọn gói mẫu Web Nha Khoa Mộc An kèm bảng giá minh bạch và kết nối Zalo OA tự động.',
            demoUrl: 'https://demo.phonghe.vn/nha-khoa',
            status: 'PENDING',
            createdAt: now,
          },
        ],
      },
      {
        id: 'thr-5',
        categorySlug: 'general',
        categoryName: 'Thảo luận Chung',
        author: {
          id: 'u-4',
          name: 'Đặng Tuấn Anh',
          username: 'tuananh.dev',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
          badge: 'SELLER_VERIFIED',
        },
        threadType: 'DISCUSSION',
        title: 'Kinh nghiệm lập hợp đồng và Snapshot phạm vi công việc tránh phát sinh vô tận với khách hàng',
        slug: 'kinh-nghiem-lap-hop-dong-va-snapshot-pham-vi-web',
        summary: 'Chia sẻ các điều khoản "Bao gồm" và "Không bao gồm" chuẩn mực trong Statement of Work (SOW) giúp Freelancer và Agency tự bảo vệ quyền lợi.',
        bodyMd: `Làm web sợ nhất là scope creep (khách yêu cầu thêm liên tục). Dưới đây là mẫu Checklist Scope Snapshot mình áp dụng theo chuẩn WebMarket DEV_RULES...`,
        status: 'PUBLISHED',
        pinned: false,
        replyCount: 22,
        viewCount: 1150,
        likeCount: 68,
        reactions: { helpful: 68, tried: 34, needDemo: 1 },
        createdAt: twoDaysAgo,
        lastActivityAt: yesterday,
      },
    ];
  }
}
