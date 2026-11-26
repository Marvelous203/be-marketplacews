import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, beforeEach } from 'vitest';
import { MoneyService } from '../../common/money/money.service.js';
import { RequestsService } from '../requests/requests.service.js';
import { SellerService } from './seller.service.js';

describe('SellerService (R4A)', () => {
  let service: SellerService;
  let moneyService: MoneyService;
  let requestsService: RequestsService;

  beforeEach(() => {
    moneyService = new MoneyService();
    requestsService = new RequestsService();
    service = new SellerService(moneyService, requestsService);
  });

  it('trả về KPI dashboard chính xác cho seller sở hữu', () => {
    const kpi = service.getDashboard('usr-dev-freelance', 'dev_freelance');
    expect(kpi.totalListings).toBe(3);
    expect(kpi.publishedCount).toBe(1);
    expect(kpi.submittedCount).toBe(1);
    expect(kpi.rejectedCount).toBe(1);
  });

  it('tạo giải pháp mới dạng DRAFT với giá integer VND hợp lệ qua MoneyService', () => {
    const created = service.createListing(
      {
        title: 'Web Tiệm Bánh Ngọt Mộc',
        categoryId: 'cat-food',
        summary: 'Đặt bánh sinh nhật theo mẫu và giao hàng nội thành.',
        demoUrl: 'https://demo.phonghe.vn/tiem-banh',
        fulfillmentType: 'MANAGED_SERVICE',
        priceMinor: 12000000,
      },
      { id: 'usr-dev-freelance', name: 'Nguyễn Văn Dev' },
    );

    expect(created.status).toBe('DRAFT');
    expect(created.priceMinor).toBe(12000000);
    expect(created.reviewTimeline).toHaveLength(1);
  });

  it('bad path: chặn tạo giải pháp với giá không nguyên hoặc dưới mức tối thiểu', () => {
    expect(() =>
      service.createListing(
        {
          title: 'Web Giá Sai',
          categoryId: 'cat-food',
          summary: 'Test invalid price',
          demoUrl: 'https://demo.phonghe.vn/err',
          fulfillmentType: 'SOURCE_CODE',
          priceMinor: 50000,
        },
        { id: 'usr-dev-freelance', name: 'Dev' },
      ),
    ).toThrow(BadRequestException);
  });

  it('cho phép seller gửi duyệt DRAFT -> SUBMITTED và Super Admin duyệt -> PUBLISHED', () => {
    const draft = service.createListing(
      {
        title: 'Web Phòng Khám Nha Khoa',
        categoryId: 'cat-health',
        summary: 'Đặt lịch khám răng và quản lý hồ sơ bệnh nhân.',
        demoUrl: 'https://demo.phonghe.vn/nha-khoa',
        fulfillmentType: 'MANAGED_SERVICE',
        priceMinor: 20000000,
      },
      { id: 'usr-dev-freelance', name: 'Dev' },
    );

    const submitted = service.submitForReview(draft.id, {
      id: 'usr-dev-freelance',
      name: 'Dev',
      role: 'dev_freelance',
    });
    expect(submitted.status).toBe('SUBMITTED');

    const published = service.moderateListing(
      draft.id,
      { decision: 'PUBLISHED' },
      { name: 'Super Admin' },
    );
    expect(published.status).toBe('PUBLISHED');
    expect(published.reviewTimeline.length).toBeGreaterThanOrEqual(3);
  });

  it('Super Admin từ chối giải pháp kèm phản hồi neo trực tiếp vào trường dữ liệu', () => {
    const rejected = service.moderateListing(
      'sel-002',
      {
        decision: 'REJECTED',
        fieldKey: 'demoUrl',
        comment: 'Link demo báo lỗi 404 trên trang đặt lịch',
      },
      { name: 'Super Admin' },
    );

    expect(rejected.status).toBe('REJECTED');
    expect(rejected.reviewerFeedback).toHaveLength(1);
    expect(rejected.reviewerFeedback[0].fieldKey).toBe('demoUrl');
  });

  it('bad path: chặn seller khác gửi duyệt giải pháp không thuộc quyền sở hữu (403 Forbidden)', () => {
    expect(() =>
      service.submitForReview('sel-002', {
        id: 'usr-other-dev',
        name: 'Other Dev',
        role: 'dev_freelance',
      }),
    ).toThrow(ForbiddenException);
  });

  it('bad path: ném NotFoundException khi duyệt ID không tồn tại', () => {
    expect(() =>
      service.moderateListing('sel-999', { decision: 'PUBLISHED' }, { name: 'Super Admin' }),
    ).toThrow(NotFoundException);
  });

  it('seller leads inbox không rò rỉ internalNotes của admin', async () => {
    const leads = await service.getSellerLeads();
    expect(leads.length).toBeGreaterThan(0);
    for (const lead of leads) {
      expect((lead as unknown as Record<string, unknown>).internalNotes).toBeUndefined();
    }
  });
});
