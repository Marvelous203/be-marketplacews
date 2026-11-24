import { Test, TestingModule } from '@nestjs/testing';
import { QuotationsService } from './quotations.service.js';
import { MoneyService } from '../../common/money/money.service.js';
import { RequestsService } from '../requests/requests.service.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateQuotationDto } from './dto/create-quotation.dto.js';

describe('QuotationsService', () => {
  let service: QuotationsService;
  let requestsService: RequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuotationsService, MoneyService, RequestsService],
    }).compile();

    service = module.get<QuotationsService>(QuotationsService);
    requestsService = module.get<RequestsService>(RequestsService);
  });

  const validQuotationDto: CreateQuotationDto = {
    quoteRequestId: 'req-001-phoco',
    sellerOrganizationId: 'org-platform-studio',
    currency: 'VND',
    validUntil: '2027-01-31T23:59:59Z',
    scope: {
      deliverables: ['Website Phố Nghề', 'Trang Admin CMS'],
      included: ['Thiết kế UI', 'Cài đặt domain'],
      excluded: ['Chi phí chụp ảnh'],
      assumptions: ['Khách cung cấp logo'],
    },
    terms: {
      paymentSchedule: [
        { label: 'Đợt 1: Cọc khởi động', percent: 50 },
        { label: 'Đợt 2: Nghiệm thu bàn giao', percent: 50 },
      ],
      warrantyDays: 60,
      supportSummary: 'Hỗ trợ kỹ thuật 60 ngày',
    },
    lines: [
      {
        lineType: 'SERVICE',
        description: 'Gói xây dựng website trọn gói Phố Nghề',
        quantity: 1,
        unit: 'GÓI',
        unitPriceMinor: 20000000,
        discountMinor: 2000000,
      },
      {
        lineType: 'HOSTING',
        description: 'Lưu trữ Cloud và Sao lưu định kỳ 1 năm',
        quantity: 1,
        unit: 'NĂM',
        unitPriceMinor: 3000000,
        discountMinor: 0,
      },
    ],
  };

  describe('createQuotationDraft (WM-050)', () => {
    it('tính toán tiền tệ integer chính xác qua MoneyService: subtotal, discount, total và chia milestones', async () => {
      const quote = await service.createQuotationDraft(validQuotationDto);

      expect(quote).toBeDefined();
      expect(quote.status).toBe('DRAFT');
      expect(quote.currentVersionNumber).toBe(1);

      // Line 1: 1 * 20.000.000 - 2.000.000 = 18.000.000
      // Line 2: 1 * 3.000.000 - 0 = 3.000.000
      // Subtotal = 21.000.000 VND
      expect(quote.currentVersion.subtotalMinor).toBe(21000000);
      expect(quote.currentVersion.totalMinor).toBe(21000000);
      expect(quote.currentVersion.discountMinor).toBe(2000000);

      // Milestones 50% - 50%
      expect(quote.currentVersion.termsSnapshot.paymentSchedule[0].amountMinor).toBe(10500000);
      expect(quote.currentVersion.termsSnapshot.paymentSchedule[1].amountMinor).toBe(10500000);
    });

    it('bad path: lines rỗng phải ném BadRequestException', async () => {
      const invalid = { ...validQuotationDto, lines: [] };
      await expect(service.createQuotationDraft(invalid)).rejects.toThrow(BadRequestException);
    });

    it('bad path: ngày hết hạn ở quá khứ phải ném BadRequestException', async () => {
      const invalid = { ...validQuotationDto, validUntil: '2020-01-01T00:00:00Z' };
      await expect(service.createQuotationDraft(invalid)).rejects.toThrow(BadRequestException);
    });
  });

  describe('sendQuotation (WM-051)', () => {
    it('gửi báo giá: chuyển DRAFT sang SENT, đóng băng sentAt và đổi trạng thái request sang QUOTATION_SENT', async () => {
      // Đưa request từ TRIAGED sang IN_REVIEW trước khi gửi báo giá (tuân thủ State Machine)
      await requestsService.transitionStatus('req-001-phoco', {
        toStatus: 'IN_REVIEW',
        reason: 'Đã hoàn tất họp kỹ thuật và lập báo giá',
      });

      const created = await service.createQuotationDraft(validQuotationDto);
      const sent = await service.sendQuotation(created.id, 'Admin Trưởng');

      expect(sent.status).toBe('SENT');
      expect(sent.currentVersion.status).toBe('SENT');
      expect(sent.currentVersion.sentAt).toBeDefined();

      const req = await requestsService.findAdminById(created.quoteRequestId);
      expect(req.status).toBe('QUOTATION_SENT');
    });

    it('bad path: không thể gửi báo giá khi không ở trạng thái DRAFT', async () => {
      // quote-001 đang ở trạng thái SENT
      await expect(service.sendQuotation('quote-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('acceptQuotation & rejectQuotation (WM-052)', () => {
    it('khách hàng chấp thuận báo giá SENT: chuyển sang ACCEPTED và đổi request sang CONVERTED', async () => {
      const accepted = await service.acceptQuotation('quote-001', {
        quotationVersionId: 'qv-001',
        acceptanceName: 'Trần Đình Trọng',
        acceptanceNote: 'Đồng ý với các điều khoản đã cam kết.',
      });

      expect(accepted.status).toBe('ACCEPTED');
      expect(accepted.currentVersion.status).toBe('ACCEPTED');
      expect(accepted.currentVersion.acceptedByName).toBe('Trần Đình Trọng');
      expect(accepted.currentVersion.acceptedAt).toBeDefined();

      const req = await requestsService.findAdminById(accepted.quoteRequestId);
      expect(req.status).toBe('CONVERTED');
    });

    it('bad path: chấp thuận sai version id phải ném BadRequestException', async () => {
      await expect(
        service.acceptQuotation('quote-001', {
          quotationVersionId: 'qv-wrong-version',
          acceptanceName: 'Trần Đình Trọng',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('từ chối báo giá SENT: chuyển sang REJECTED và đổi request sang CLOSED_LOST', async () => {
      // Chuyển req-002-tamduc qua các bước NEW -> TRIAGED -> IN_REVIEW
      await requestsService.transitionStatus('req-002-tamduc', {
        toStatus: 'TRIAGED',
        reason: 'Đã xác nhận yêu cầu',
      });
      await requestsService.transitionStatus('req-002-tamduc', {
        toStatus: 'IN_REVIEW',
        reason: 'Bắt đầu lập báo giá may đo',
      });

      const newQuote = await service.createQuotationDraft({
        ...validQuotationDto,
        quoteRequestId: 'req-002-tamduc',
      });
      await service.sendQuotation(newQuote.id);

      const rejected = await service.rejectQuotation(newQuote.id, {
        quotationVersionId: newQuote.currentVersion.id,
        rejectionReason: 'Khách hàng thay đổi kế hoạch kinh doanh',
      });

      expect(rejected.status).toBe('REJECTED');
      expect(rejected.currentVersion.status).toBe('REJECTED');
      expect(rejected.currentVersion.rejectionReason).toBe('Khách hàng thay đổi kế hoạch kinh doanh');

      const req = await requestsService.findAdminById('req-002-tamduc');
      expect(req.status).toBe('CLOSED_LOST');
    });
  });
});
