import { describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MarketplaceOrdersService } from './marketplace-orders.service.js';
import { MoneyService } from '../../common/money/money.service.js';
import { QuotationsService } from '../quotations/quotations.service.js';
import { RequestsService } from '../requests/requests.service.js';

describe('MarketplaceOrdersService (WM-053, WM-060, WM-061)', () => {
  let ordersService: MarketplaceOrdersService;
  let moneyService: MoneyService;
  let quotationsService: QuotationsService;
  let requestsService: RequestsService;

  beforeEach(() => {
    moneyService = new MoneyService();
    requestsService = new RequestsService();
    quotationsService = new QuotationsService(moneyService, requestsService);
    ordersService = new MarketplaceOrdersService(moneyService, quotationsService);
    ordersService.resetSeedOrders();
  });

  describe('Tra cứu đơn hàng', () => {
    it('tra cứu thành công đơn hàng seed mẫu theo ID (ORD-2026-0001)', async () => {
      const order = await ordersService.findOrderById('ord-seed-001');

      expect(order).toBeDefined();
      expect(order.orderNumber).toBe('ORD-2026-0001');
      expect(order.status).toBe('CONFIRMED');
      expect(order.paymentStatus).toBe('PARTIALLY_PAID');
      expect(order.totalMinor).toBe(44000000);
      expect(order.paidAmountMinor).toBe(22000000);
      expect(order.balanceDueMinor).toBe(22000000);
      expect(order.paymentInstructions?.qrUrl).toContain('ORD-2026-0001');
    });

    it('tra cứu đơn hàng theo Order Number không phân biệt hoa thường', async () => {
      const order = await ordersService.findOrderByNumber('ord-2026-0001');
      expect(order.id).toBe('ord-seed-001');
    });

    it('ném NotFoundException khi tra cứu ID không tồn tại', async () => {
      await expect(ordersService.findOrderById('ord-non-existent')).rejects.toThrow(NotFoundException);
    });

    it('ném NotFoundException khi tra cứu orderNumber không tồn tại', async () => {
      await expect(ordersService.findOrderByNumber('ORD-9999-9999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('Tạo đơn hàng từ Báo giá (WM-053 Idempotent)', () => {
    it('tạo đơn hàng thành công từ báo giá ACCEPTED và sinh mã ORD-YYYY-XXXX', async () => {
      // 1. Tạo request
      const req = await requestsService.createRequest({
        title: 'Website Trang Sức Cao Cấp',
        goal: 'Bán lẻ trang sức trực tuyến & phân quyền đa cửa hàng',
        sourceType: 'CUSTOM_PROJECT',
        projectScope: {
          description: 'Hệ thống website bán lẻ trang sức thời trang cao cấp',
          features: ['Catalog', 'Auth', 'VietQR'],
        },
        contact: {
          name: 'Phạm Thị D',
          email: 'd@jewelry.vn',
          phone: '0933112233',
        },
      });

      // 2. Chuyển sang TRIAGED rồi IN_REVIEW
      await requestsService.transitionStatus(req.id, { toStatus: 'TRIAGED', reason: 'Đã tiếp nhận và thẩm định hồ sơ' });
      await requestsService.transitionStatus(req.id, { toStatus: 'IN_REVIEW', reason: 'Hồ sơ đang được xem xét lập báo giá' });

      // 3. Tạo quotation
      const quote = await quotationsService.createQuotationDraft({
        quoteRequestId: req.id,
        validUntil: '2028-12-31T23:59:59.000Z',
        scope: {
          deliverables: ['Custom Web App', 'Design System'],
          included: ['Cloud Hosting', 'Domain Setup'],
          excluded: ['Marketing campaign'],
        },
        terms: {
          warrantyDays: 60,
          supportSummary: 'Hỗ trợ 24/7',
          termsVersion: 'QUOTE-1.0',
        },
        lines: [
          {
            lineType: 'SERVICE',
            description: 'Phát triển Frontend & Backend',
            quantity: 1,
            unit: 'Gói',
            unitPriceMinor: 50000000,
            discountMinor: 5000000,
          },
        ],
      });

      // 4. Send quotation
      await quotationsService.sendQuotation(quote.id);

      // 5. Accept quotation
      await quotationsService.acceptQuotation(quote.id, {
        quotationVersionId: quote.currentVersion.id,
        acceptanceName: 'Phạm Thị D',
      });

      // 6. Tạo Order từ Quotation
      const order = await ordersService.createFromQuotation(quote.id, {
        customerPhone: '0933112233',
      });

      expect(order).toBeDefined();
      expect(order.orderNumber).toMatch(/^ORD-\d{4}-\d{4}$/);
      expect(order.quotationId).toBe(quote.id);
      expect(order.status).toBe('PENDING_PAYMENT');
      expect(order.paymentStatus).toBe('UNPAID');
      expect(order.totalMinor).toBe(45000000); // 50m - 5m discount
      expect(order.paidAmountMinor).toBe(0);
      expect(order.balanceDueMinor).toBe(45000000);
      expect(order.items).toHaveLength(1);
      expect(order.deliverables).toContain('Custom Web App');

      // 7. Kiểm tra tính Idempotent: gọi lại không tạo duplicate order
      const orderAgain = await ordersService.createFromQuotation(quote.id);
      expect(orderAgain.id).toBe(order.id);
      expect(orderAgain.orderNumber).toBe(order.orderNumber);
    });

    it('ném BadRequestException khi tạo đơn từ báo giá chưa ACCEPTED', async () => {
      // Tạo một request và quotation mới ở trạng thái DRAFT
      const req = await requestsService.createRequest({
        title: 'Dự án Chưa Duyệt',
        goal: 'Thử nghiệm tạo đơn lỗi',
        sourceType: 'CUSTOM_PROJECT',
        projectScope: { description: 'Test draft quote' },
        contact: { name: 'Test', email: 'test@draft.vn' },
      });
      const draftQuote = await quotationsService.createQuotationDraft({
        quoteRequestId: req.id,
        validUntil: '2028-12-31T23:59:59.000Z',
        scope: { deliverables: ['App'] },
        terms: { warrantyDays: 30, supportSummary: 'None' },
        lines: [{ lineType: 'SERVICE', description: 'Item', quantity: 1, unit: 'Cái', unitPriceMinor: 10000000, discountMinor: 0 }],
      });

      await expect(ordersService.createFromQuotation(draftQuote.id)).rejects.toThrow(BadRequestException);
    });
  });

  describe('Ghi nhận thanh toán ngoại tuyến (WM-061)', () => {
    it('ghi nhận thanh toán đợt 2 thành công và chuyển paymentStatus sang PAID', async () => {
      const orderBefore = await ordersService.findOrderById('ord-seed-001');
      expect(orderBefore.balanceDueMinor).toBe(22000000);
      expect(orderBefore.paymentStatus).toBe('PARTIALLY_PAID');

      // Thanh toán nốt 22 triệu còn lại
      const updatedOrder = await ordersService.recordPayment('ord-seed-001', {
        amountMinor: 22000000,
        paymentMethod: 'VIETQR',
        referenceCode: 'VQR88889999',
        note: 'Thanh toán đợt 2 tất toán đơn hàng',
        recordedBy: 'Thu ngân Lê Văn E',
      });

      expect(updatedOrder.paidAmountMinor).toBe(44000000);
      expect(updatedOrder.balanceDueMinor).toBe(0);
      expect(updatedOrder.paymentStatus).toBe('PAID');
      expect(updatedOrder.payments).toHaveLength(2);
      expect(updatedOrder.payments[1].referenceCode).toBe('VQR88889999');
    });

    it('ném BadRequestException khi số tiền thanh toán vượt quá số dư còn lại', async () => {
      await expect(
        ordersService.recordPayment('ord-seed-001', {
          amountMinor: 30000000, // Số dư chỉ còn 22 triệu
          paymentMethod: 'BANK_TRANSFER',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('ném BadRequestException khi số tiền thanh toán không phải số nguyên dương', async () => {
      await expect(
        ordersService.recordPayment('ord-seed-001', {
          amountMinor: -5000000,
          paymentMethod: 'CASH',
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        ordersService.recordPayment('ord-seed-001', {
          amountMinor: 0,
          paymentMethod: 'CASH',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('ném BadRequestException khi cố thanh toán cho đơn hàng đã bị hủy', async () => {
      // Hủy đơn seed
      await ordersService.transitionStatus('ord-seed-001', {
        toStatus: 'CANCELLED',
        reason: 'Khách hàng hủy dự án',
      });

      await expect(
        ordersService.recordPayment('ord-seed-001', {
          amountMinor: 10000000,
          paymentMethod: 'BANK_TRANSFER',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Chuyển đổi trạng thái đơn hàng (State Machine WM-060)', () => {
    it('chuyển đổi trạng thái tuần tự hợp lệ: CONFIRMED -> PROCESSING -> DELIVERED -> COMPLETED', async () => {
      // 1. CONFIRMED -> PROCESSING
      const s1 = await ordersService.transitionStatus('ord-seed-001', {
        toStatus: 'PROCESSING',
        reason: 'Kỹ thuật tiếp nhận triển khai hạ tầng',
      });
      expect(s1.status).toBe('PROCESSING');

      // 2. PROCESSING -> DELIVERED
      const s2 = await ordersService.transitionStatus('ord-seed-001', {
        toStatus: 'DELIVERED',
        reason: 'Đã hoàn thiện nghiệm thu và bàn giao domain/hosting',
      });
      expect(s2.status).toBe('DELIVERED');
      expect(s2.deliveredAt).toBeDefined();

      // 3. DELIVERED -> COMPLETED
      const s3 = await ordersService.transitionStatus('ord-seed-001', {
        toStatus: 'COMPLETED',
        reason: 'Hoàn tất thanh lý hợp đồng',
      });
      expect(s3.status).toBe('COMPLETED');
      expect(s3.completedAt).toBeDefined();
    });

    it('ném BadRequestException khi chuyển trạng thái nhảy cóc bất hợp lệ', async () => {
      // Đơn seed đang ở CONFIRMED, không được nhảy thẳng lên COMPLETED
      await expect(
        ordersService.transitionStatus('ord-seed-001', {
          toStatus: 'COMPLETED',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('ném BadRequestException khi cố chuyển trạng thái từ COMPLETED sang trạng thái khác', async () => {
      await ordersService.transitionStatus('ord-seed-001', { toStatus: 'PROCESSING' });
      await ordersService.transitionStatus('ord-seed-001', { toStatus: 'DELIVERED' });
      await ordersService.transitionStatus('ord-seed-001', { toStatus: 'COMPLETED' });

      // COMPLETED là end state
      await expect(
        ordersService.transitionStatus('ord-seed-001', {
          toStatus: 'PROCESSING',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Lọc và tìm kiếm danh sách đơn hàng Admin', () => {
    it('lọc danh sách đơn hàng theo trạng thái và từ khóa tìm kiếm', async () => {
      const res = await ordersService.findAllAdmin({
        status: 'CONFIRMED',
        search: 'Hana',
      });

      expect(res.total).toBe(1);
      expect(res.data[0].customerName).toContain('Hana');
    });

    it('trả về rỗng khi từ khóa không khớp', async () => {
      const res = await ordersService.findAllAdmin({
        search: 'NonExistentKeywordXYZ',
      });

      expect(res.total).toBe(0);
      expect(res.data).toHaveLength(0);
    });
  });
});
