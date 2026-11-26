import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, beforeEach } from 'vitest';
import { MoneyService } from '../../common/money/money.service.js';
import { CommunityService } from './community.service.js';

describe('CommunityService (R4B/C)', () => {
  let service: CommunityService;

  beforeEach(() => {
    service = new CommunityService(new MoneyService());
  });

  it('trả về danh mục và các bài viết mặc định kèm reactions', () => {
    const categories = service.getCategories();
    expect(categories.length).toBeGreaterThanOrEqual(4);

    const { items } = service.getThreads();
    expect(items.length).toBeGreaterThanOrEqual(5);
    expect(items[0].reactions).toBeDefined();
  });

  it('tăng đúng số đếm reaction theo ngữ cảnh (HELPFUL / TRIED / NEED_DEMO)', () => {
    const before = service.getThreadBySlug('toi-uu-lcp-core-web-vitals-nextjs-16');
    const prevTried = before.reactions.tried;

    const updated = service.reactToThread('thr-2', 'TRIED');
    expect(updated.reactions.tried).toBe(prevTried + 1);
  });

  it('cho phép seller gửi Proposal hợp lệ cho phiếu Cần giải pháp (WANTED)', () => {
    const proposal = service.addProposal(
      'thr-4',
      {
        priceMinor: 16500000,
        estimatedDays: 10,
        pitchSummary: 'Cam kết hoàn thành đúng hạn trước Tết với bộ giao diện nha khoa chuẩn Y tế.',
        demoUrl: 'https://demo.phonghe.vn/nha-khoa-v2',
      },
      { id: 'usr-dev-2', name: 'Studio Gốm Số' },
    );

    expect(proposal.priceMinor).toBe(16500000);
    expect(proposal.currency).toBe('VND');

    const updatedThread = service.getThreadBySlug('can-website-nha-khoa-ai-smile');
    expect(updatedThread.proposals?.length).toBe(2);
    expect(updatedThread.wantedDetails?.status).toBe('IN_DISCUSSION');
  });

  it('bad path: chặn gửi Proposal vào bài viết không phải WANTED', () => {
    expect(() =>
      service.addProposal(
        'thr-2',
        {
          priceMinor: 10000000,
          estimatedDays: 7,
          pitchSummary: 'Test invalid thread type',
        },
        { id: 'usr-dev', name: 'Dev' },
      ),
    ).toThrow(BadRequestException);
  });

  it('bad path: chặn giá proposal nhỏ hơn mức tối thiểu hoặc không nguyên', () => {
    expect(() =>
      service.addProposal(
        'thr-4',
        {
          priceMinor: 50000,
          estimatedDays: 5,
          pitchSummary: 'Giá quá thấp',
        },
        { id: 'usr-dev', name: 'Dev' },
      ),
    ).toThrow(BadRequestException);
  });

  it('tạo bài viết mới và thêm bình luận thành công', () => {
    const thread = service.createThread(
      {
        threadType: 'WANTED',
        title: 'Cần web đặt lịch Tiệm Cắt Tóc Nam Cổ Điển',
        bodyMd: 'Cần đặt lịch thợ cắt tóc theo giờ, ngân sách 10 triệu.',
        budgetRange: '8.000.000 - 12.000.000 ₫',
      },
      { id: 'usr-tenant', name: 'Chủ Tiệm Barber', role: 'tenant' },
    );

    expect(thread.threadType).toBe('WANTED');
    expect(thread.wantedDetails?.status).toBe('OPEN');

    const reply = service.addReply(thread.id, 'Mình nhận làm giao diện barber nhé!', {
      name: 'Dev Nam',
      role: 'dev_freelance',
    });
    expect(reply.body).toContain('barber');
    expect(service.getThreadBySlug(thread.slug).replyCount).toBe(1);
  });

  it('bad path: ném NotFoundException khi react bài viết không tồn tại', () => {
    expect(() => service.reactToThread('non-existent', 'HELPFUL')).toThrow(NotFoundException);
  });
});
