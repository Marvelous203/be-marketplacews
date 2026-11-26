import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { MoneyService } from '../../common/money/money.service.js';
import { CurrencyCode } from '../../common/money/money.types.js';
import { QuotationsService } from '../quotations/quotations.service.js';
import {
  ALLOWED_ORDER_TRANSITIONS,
  MarketplaceOrder,
  MarketplaceOrderItem,
  OfflinePaymentRecord,
  OrderStatus,
  PaymentInstructions,
  PaymentStatus,
} from './marketplace-orders.types.js';
import { Quotation, QuotationLine } from '../quotations/quotations.types.js';
import { RecordPaymentDto } from './dto/record-payment.dto.js';
import { TransitionOrderStatusDto } from './dto/transition-order-status.dto.js';
import { QueryOrdersDto } from './dto/query-orders.dto.js';
import { CreateOrderFromQuotationDto } from './dto/create-order-from-quotation.dto.js';

const DEFAULT_BANK_INFO = {
  bankName: 'MB Bank (Ngân hàng Quân Đội)',
  bankBranch: 'Sở Giao Dịch TP. Hồ Chí Minh',
  accountNumber: '9876543210',
  accountHolder: 'CONG TY VELL VIET NAM',
};

export const SEED_MARKETPLACE_ORDERS: MarketplaceOrder[] = [
  {
    id: 'ord-seed-001',
    orderNumber: 'ORD-2026-0001',
    quotationId: 'quote-001',
    quotationVersionNumber: 1,
    quoteRequestId: 'req-001',
    customerName: 'Công Ty Cổ Phần Mỹ Phẩm Hana',
    customerEmail: 'lienhe@hanacosmetics.vn',
    customerPhone: '0908123456',
    customerOrganizationId: 'org-hana-001',
    sellerOrganizationId: 'org-platform-studio',
    sellerName: 'Platform Studio',
    currency: 'VND',
    subtotalMinor: 48000000,
    discountMinor: 4000000,
    taxMinor: 0,
    totalMinor: 44000000,
    paidAmountMinor: 22000000,
    balanceDueMinor: 22000000,
    status: 'CONFIRMED',
    paymentStatus: 'PARTIALLY_PAID',
    items: [
      {
        id: 'item-001',
        lineType: 'SERVICE',
        description: 'Thiết kế giao diện thời trang cao cấp & trải nghiệm studio cá nhân hóa',
        quantity: 1,
        unit: 'Gói',
        unitPriceMinor: 35000000,
        discountMinor: 0,
        lineTotalMinor: 35000000,
      },
      {
        id: 'item-002',
        lineType: 'HOSTING',
        description: 'Triển khai hạ tầng Cloud CDN, High-availability Postgres & Redis (1 năm)',
        quantity: 1,
        unit: 'Năm',
        unitPriceMinor: 13000000,
        discountMinor: 4000000,
        lineTotalMinor: 9000000,
      },
    ],
    deliverables: [
      'Giao diện Next.js 16 Responsive chuẩn SEO',
      'Hệ thống quản trị Catalog & RBAC 5 Roles',
      'Tích hợp thanh toán trực tuyến & VietQR tự động',
      'Bàn giao Source code & Hướng dẫn vận hành',
    ],
    termsSnapshot: {
      paymentSchedule: [
        { label: 'Đợt 1: Đặt cọc khởi động dự án', percent: 50, amountMinor: 22000000 },
        { label: 'Đợt 2: Nghiệm thu và bàn giao hạ tầng', percent: 50, amountMinor: 22000000 },
      ],
      warrantyDays: 60,
      supportSummary: 'Hỗ trợ kỹ thuật 24/7 và bảo hành hệ thống trong 60 ngày kể từ ngày bàn giao.',
    },
    paymentInstructions: {
      ...DEFAULT_BANK_INFO,
      qrUrl: 'https://img.vietqr.io/image/MB-9876543210-compact2.png?amount=22000000&addInfo=ORD-2026-0001&accountName=CONG%20TY%20VELL%20VIET%20NAM',
      transferSyntax: 'ORD-2026-0001',
    },
    payments: [
      {
        id: 'pay-seed-001',
        orderId: 'ord-seed-001',
        paymentMethod: 'BANK_TRANSFER',
        amountMinor: 22000000,
        currency: 'VND',
        referenceCode: 'MBB2026112001',
        note: 'Thanh toán đợt 1 (50% giá trị hợp đồng khởi động dự án)',
        recordedBy: 'Kế toán trưởng Nguyễn Thị B',
        paidAt: '2026-11-20T10:00:00.000Z',
        createdAt: '2026-11-20T10:05:00.000Z',
      },
    ],
    createdAt: '2026-11-19T09:00:00.000Z',
    updatedAt: '2026-11-20T10:05:00.000Z',
    confirmedAt: '2026-11-20T10:05:00.000Z',
  },
];

@Injectable()
export class MarketplaceOrdersService {
  private orders: MarketplaceOrder[] = JSON.parse(JSON.stringify(SEED_MARKETPLACE_ORDERS));
  private sequenceCounter = 1;

  constructor(
    private readonly moneyService: MoneyService,
    @Inject(forwardRef(() => QuotationsService))
    private readonly quotationsService: any,
  ) {}

  private generateOrderNumber(): string {
    const year = new Date().getFullYear();
    this.sequenceCounter += 1;
    const seqStr = String(this.sequenceCounter).padStart(4, '0');
    return `ORD-${year}-${seqStr}`;
  }

  private buildPaymentInstructions(orderNumber: string, balanceDueMinor: number): PaymentInstructions {
    const encodedHolder = encodeURIComponent(DEFAULT_BANK_INFO.accountHolder);
    const qrUrl = `https://img.vietqr.io/image/MB-9876543210-compact2.png?amount=${balanceDueMinor}&addInfo=${orderNumber}&accountName=${encodedHolder}`;
    return {
      ...DEFAULT_BANK_INFO,
      qrUrl,
      transferSyntax: orderNumber,
    };
  }

  /**
   * Tạo Đơn hàng mới từ Báo giá đã được chấp thuận (WM-053 Idempotent)
   */
  async createFromQuotation(
    quotationId: string,
    dto?: CreateOrderFromQuotationDto,
  ): Promise<MarketplaceOrder> {
    // 1. Kiểm tra tính Idempotent: Nếu đã tồn tại order cho quotation này, trả về order cũ
    const existing = this.orders.find((o) => o.quotationId === quotationId);
    if (existing) {
      return existing;
    }

    // 2. Lấy dữ liệu báo giá
    const quote = await this.quotationsService.findAdminById(quotationId);
    if (quote.status !== 'ACCEPTED' && quote.currentVersion.status !== 'ACCEPTED') {
      throw new BadRequestException(
        `Báo giá #${quotationId} đang ở trạng thái "${quote.status}". Chỉ báo giá đã được ACCEPTED mới có thể chuyển đổi thành đơn hàng.`,
      );
    }

    const version = quote.currentVersion;
    const orderNumber = this.generateOrderNumber();
    const orderId = `ord-${randomUUID().substring(0, 8)}`;
    const nowIso = new Date().toISOString();

    // Snapshot các dòng sản phẩm/dịch vụ
    const items: MarketplaceOrderItem[] = version.lines.map((l: QuotationLine) => ({
      id: `item-${randomUUID().substring(0, 8)}`,
      lineType: l.lineType,
      description: l.description,
      quantity: l.quantity,
      unit: l.unit,
      unitPriceMinor: l.unitPriceMinor,
      discountMinor: l.discountMinor,
      lineTotalMinor: l.lineTotalMinor,
    }));

    const totalMinor = version.totalMinor;
    const paidAmountMinor = 0;
    const balanceDueMinor = totalMinor;

    const newOrder: MarketplaceOrder = {
      id: orderId,
      orderNumber,
      quotationId: quote.id,
      quotationVersionNumber: version.versionNumber,
      quoteRequestId: quote.quoteRequestId,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      customerPhone: dto?.customerPhone,
      customerOrganizationId: quote.customerOrganizationId,
      sellerOrganizationId: quote.sellerOrganizationId,
      sellerName: quote.sellerName,
      currency: version.currency,
      subtotalMinor: version.subtotalMinor,
      discountMinor: version.discountMinor,
      taxMinor: version.taxMinor,
      totalMinor,
      paidAmountMinor,
      balanceDueMinor,
      status: 'PENDING_PAYMENT',
      paymentStatus: 'UNPAID',
      items,
      deliverables: version.scopeSnapshot?.deliverables || [],
      termsSnapshot: {
        paymentSchedule: version.termsSnapshot?.paymentSchedule || [],
        warrantyDays: version.termsSnapshot?.warrantyDays || 30,
        supportSummary: version.termsSnapshot?.supportSummary || 'Bảo hành tiêu chuẩn.',
      },
      paymentInstructions: this.buildPaymentInstructions(orderNumber, balanceDueMinor),
      payments: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.orders.unshift(newOrder);
    return newOrder;
  }

  /**
   * Ghi nhận thanh toán ngoại tuyến (WM-061 Manual Offline Payment Recording)
   */
  async recordPayment(orderId: string, dto: RecordPaymentDto): Promise<MarketplaceOrder> {
    const order = await this.findOrderById(orderId);

    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Không thể ghi nhận thanh toán cho đơn hàng đã bị hủy.');
    }

    if (dto.amountMinor <= 0 || !Number.isInteger(dto.amountMinor)) {
      throw new BadRequestException('Số tiền thanh toán phải là số nguyên dương (integer minor units).');
    }

    const currCode = (order.currency as CurrencyCode) || 'VND';

    if (dto.amountMinor > order.balanceDueMinor) {
      const formattedAmount = this.moneyService.format(this.moneyService.create(dto.amountMinor, currCode));
      const formattedDue = this.moneyService.format(this.moneyService.create(order.balanceDueMinor, currCode));
      throw new BadRequestException(
        `Số tiền thanh toán (${formattedAmount}) vượt quá số dư còn lại cần thanh toán (${formattedDue}).`,
      );
    }

    const nowIso = new Date().toISOString();
    const paymentRecord: OfflinePaymentRecord = {
      id: `pay-${randomUUID().substring(0, 8)}`,
      orderId: order.id,
      paymentMethod: dto.paymentMethod,
      amountMinor: dto.amountMinor,
      currency: order.currency,
      referenceCode: dto.referenceCode,
      receiptUrl: dto.receiptUrl,
      note: dto.note,
      recordedBy: dto.recordedBy || 'Admin / Thu Ngân',
      paidAt: dto.paidAt || nowIso,
      createdAt: nowIso,
    };

    order.payments.push(paymentRecord);

    // Tính toán lại tài chính qua MoneyService
    const currentPaid = this.moneyService.create(order.paidAmountMinor, currCode);
    const newAddition = this.moneyService.create(dto.amountMinor, currCode);
    const updatedPaid = this.moneyService.add(currentPaid, newAddition);

    order.paidAmountMinor = Number(updatedPaid.amountMinor);
    order.balanceDueMinor = order.totalMinor - order.paidAmountMinor;

    // Cập nhật PaymentStatus
    if (order.paidAmountMinor >= order.totalMinor) {
      order.paymentStatus = 'PAID';
    } else if (order.paidAmountMinor > 0) {
      order.paymentStatus = 'PARTIALLY_PAID';
    }

    // Tự động chuyển PENDING_PAYMENT sang CONFIRMED khi có thanh toán hợp lệ
    if (order.status === 'PENDING_PAYMENT') {
      order.status = 'CONFIRMED';
      order.confirmedAt = nowIso;
    }

    // Cập nhật lại QR payment instructions với số dư mới
    order.paymentInstructions = this.buildPaymentInstructions(order.orderNumber, order.balanceDueMinor);
    order.updatedAt = nowIso;

    return order;
  }

  /**
   * Chuyển đổi trạng thái đơn hàng theo State Machine (WM-060)
   */
  async transitionStatus(orderId: string, dto: TransitionOrderStatusDto): Promise<MarketplaceOrder> {
    const order = await this.findOrderById(orderId);

    const allowed = ALLOWED_ORDER_TRANSITIONS[order.status] || [];
    if (!allowed.includes(dto.toStatus)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái từ "${order.status}" sang "${dto.toStatus}". Các bước hợp lệ tiếp theo: [${allowed.join(', ')}].`,
      );
    }

    const nowIso = new Date().toISOString();
    order.status = dto.toStatus;
    order.updatedAt = nowIso;

    if (dto.toStatus === 'CONFIRMED' && !order.confirmedAt) {
      order.confirmedAt = nowIso;
    } else if (dto.toStatus === 'DELIVERED') {
      order.deliveredAt = nowIso;
    } else if (dto.toStatus === 'COMPLETED') {
      order.completedAt = nowIso;
    } else if (dto.toStatus === 'CANCELLED') {
      order.cancelledAt = nowIso;
      order.cancellationReason = dto.reason || 'Hủy đơn theo yêu cầu';
    }

    return order;
  }

  /**
   * Tra cứu đơn hàng theo ID hoặc Quotation ID
   */
  async findOrderById(id: string): Promise<MarketplaceOrder> {
    const found = this.orders.find(
      (o) => o.id === id || o.orderNumber === id || o.quotationId === id,
    );
    if (!found) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${id}`);
    }
    return found;
  }

  /**
   * Tra cứu đơn hàng theo Mã Đơn (ORD-YYYY-XXXX)
   */
  async findOrderByNumber(orderNumber: string): Promise<MarketplaceOrder> {
    const found = this.orders.find((o) => o.orderNumber.toUpperCase() === orderNumber.toUpperCase());
    if (!found) {
      throw new NotFoundException(`Không tìm thấy đơn hàng mang mã ${orderNumber}`);
    }
    return found;
  }

  /**
   * Lấy danh sách đơn hàng cho Admin với bộ lọc và phân trang
   */
  async findAllAdmin(query: QueryOrdersDto): Promise<{ data: MarketplaceOrder[]; total: number; page: number; limit: number }> {
    let list = [...this.orders];

    if (query.status) {
      list = list.filter((o) => o.status === query.status);
    }

    if (query.paymentStatus) {
      list = list.filter((o) => o.paymentStatus === query.paymentStatus);
    }

    if (query.search) {
      const q = query.search.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q),
      );
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const total = list.length;
    const start = (page - 1) * limit;
    const data = list.slice(start, start + limit);

    return { data, total, page, limit };
  }

  resetSeedOrders(): void {
    this.orders = JSON.parse(JSON.stringify(SEED_MARKETPLACE_ORDERS));
    this.sequenceCounter = 1;
  }
}
