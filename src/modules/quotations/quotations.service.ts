import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MoneyService } from '../../common/money/money.service.js';
import { RequestsService } from '../requests/requests.service.js';
import {
  Quotation,
  QuotationVersion,
  QuotationLine,
  ALLOWED_QUOTATION_TRANSITIONS,
} from './quotations.types.js';
import { CreateQuotationDto } from './dto/create-quotation.dto.js';
import { AcceptQuotationDto, RejectQuotationDto } from './dto/accept-quotation.dto.js';

@Injectable()
export class QuotationsService {
  constructor(
    private readonly moneyService: MoneyService,
    private readonly requestsService: RequestsService,
  ) {}

  private quotations: Quotation[] = [
    {
      id: 'quote-001',
      quoteRequestId: 'req-003-quoted',
      sellerOrganizationId: 'org-platform-studio',
      sellerName: 'Platform Studio & Nghệ Nhân Web',
      customerName: 'Trần Đình Trọng',
      customerEmail: 'trong.comnieu@example.com',
      currentVersionNumber: 1,
      status: 'SENT',
      createdAt: '2026-11-21T10:00:00Z',
      updatedAt: '2026-11-21T10:30:00Z',
      currentVersion: {
        id: 'qv-001',
        quotationId: 'quote-001',
        versionNumber: 1,
        status: 'SENT',
        currency: 'VND',
        subtotalMinor: 18000000,
        discountMinor: 0,
        taxMinor: 0,
        totalMinor: 18000000,
        validUntil: '2026-12-31T23:59:59Z',
        sentAt: '2026-11-21T10:30:00Z',
        scopeSnapshot: {
          deliverables: [
            'Website responsive đa thiết bị chuẩn Phố Nghề',
            'Trang quản trị thực đơn và nhận đặt bàn',
            'Tích hợp tạo mã QR đặt tại từng bàn',
          ],
          included: [
            'Thiết kế giao diện độc quyền mộc mạc',
            'Cài đặt tên miền và lưu trữ cloud 12 tháng',
            'Bàn giao toàn bộ mã nguồn Next.js & NestJS',
          ],
          excluded: ['Chi phí chụp ảnh món ăn chuyên nghiệp', 'Nội dung bài viết tự biên soạn'],
          assumptions: ['Khách hàng cung cấp hình ảnh logo và bảng giá món ăn'],
        },
        termsSnapshot: {
          paymentSchedule: [
            { label: 'Đặt cọc khởi động dự án (50%)', percent: 50, amountMinor: 9000000 },
            { label: 'Nghiệm thu và bàn giao (50%)', percent: 50, amountMinor: 9000000 },
          ],
          warrantyDays: 30,
          supportSummary: 'Hỗ trợ kỹ thuật trực tiếp qua Zalo/Hotline trong suốt thời gian bảo hành.',
          termsVersion: 'QUOTE-TERMS-1.0',
        },
        lines: [
          {
            id: 'line-01',
            lineType: 'SERVICE',
            description: 'Phát triển website đặt món & thực đơn QR chuẩn Phố Nghề',
            quantity: 1,
            unit: 'GÓI',
            unitPriceMinor: 18000000,
            discountMinor: 0,
            lineTotalMinor: 18000000,
          },
        ],
        createdAt: '2026-11-21T10:00:00Z',
      },
      historyVersions: [],
    },
  ];

  /**
   * Tạo báo giá bản thảo mới (WM-050)
   */
  async createQuotationDraft(dto: CreateQuotationDto, createdByUserId = 'admin-01'): Promise<Quotation> {
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('Báo giá phải có ít nhất một hạng mục công việc (line item).');
    }

    const now = new Date();
    const validUntilDate = new Date(dto.validUntil);
    if (isNaN(validUntilDate.getTime()) || validUntilDate <= now) {
      throw new BadRequestException('Thời hạn hiệu lực của báo giá phải là một ngày trong tương lai.');
    }

    // Tra cứu request để lấy thông tin khách hàng
    const request = await this.requestsService.findAdminById(dto.quoteRequestId);

    const currency = dto.currency || 'VND';
    let subtotalMinor = 0;
    let totalDiscountMinor = 0;

    const computedLines: QuotationLine[] = dto.lines.map((l, index) => {
      const q = Math.max(1, l.quantity || 1);
      const unitPrice = l.unitPriceMinor || 0;
      const discount = l.discountMinor || 0;
      const lineTotal = q * unitPrice - discount;

      subtotalMinor += lineTotal;
      totalDiscountMinor += discount;

      return {
        id: `line-${Date.now()}-${index}`,
        lineType: l.lineType,
        description: l.description.trim(),
        quantity: q,
        unit: l.unit || 'GÓI',
        unitPriceMinor: unitPrice,
        discountMinor: discount,
        taxCode: l.taxCode,
        lineTotalMinor: lineTotal,
      };
    });

    const taxMinor = 0; // Chính sách thuế VND mặc định
    const totalMinor = subtotalMinor + taxMinor;

    // Tính tiền cho từng đợt thanh toán (Milestones) bằng MoneyService allocate
    const schedule = dto.terms.paymentSchedule || [];
    const scheduleRatios = schedule.map((s) => s.percent);
    const moneyBase = this.moneyService.create(totalMinor, 'VND');
    const allocatedAmounts = this.moneyService.allocate(moneyBase, scheduleRatios);

    const computedSchedule = schedule.map((s, idx) => ({
      label: s.label,
      percent: s.percent,
      amountMinor: Number(allocatedAmounts[idx].amountMinor),
    }));

    const quotationId = `quote-${Date.now()}`;
    const versionId = `qv-${Date.now()}-1`;
    const nowIso = now.toISOString();

    const initialVersion: QuotationVersion = {
      id: versionId,
      quotationId,
      versionNumber: 1,
      status: 'DRAFT',
      currency,
      subtotalMinor,
      discountMinor: totalDiscountMinor,
      taxMinor,
      totalMinor,
      validUntil: dto.validUntil,
      scopeSnapshot: {
        deliverables: dto.scope.deliverables || [],
        included: dto.scope.included || [],
        excluded: dto.scope.excluded || [],
        assumptions: dto.scope.assumptions || [],
      },
      termsSnapshot: {
        paymentSchedule: computedSchedule,
        warrantyDays: dto.terms.warrantyDays || 30,
        supportSummary: dto.terms.supportSummary || 'Bảo hành tiêu chuẩn 30 ngày.',
        termsVersion: dto.terms.termsVersion || 'QUOTE-TERMS-1.0',
      },
      lines: computedLines,
      createdAt: nowIso,
    };

    const newQuotation: Quotation = {
      id: quotationId,
      quoteRequestId: request.id,
      sellerOrganizationId: dto.sellerOrganizationId || 'org-platform-studio',
      sellerName: dto.sellerName || 'Platform Studio',
      customerOrganizationId: request.customerOrganizationId,
      customerName: request.contactSnapshot.name,
      customerEmail: request.contactSnapshot.email,
      currentVersionNumber: 1,
      status: 'DRAFT',
      createdAt: nowIso,
      updatedAt: nowIso,
      currentVersion: initialVersion,
      historyVersions: [],
    };

    this.quotations.unshift(newQuotation);

    // Ghi nhận activity vào request
    await this.requestsService.addInternalNote(request.id, {
      body: `Đã lập bản thảo Báo giá #${quotationId} phiên bản v1 với tổng giá trị ${this.moneyService.format(
        moneyBase,
      )}.`,
      authorName: createdByUserId,
    });

    return newQuotation;
  }

  /**
   * Admin: Gửi báo giá cho khách hàng và đóng băng phiên bản (WM-051)
   */
  async sendQuotation(id: string, actor = 'Admin'): Promise<Quotation> {
    const quote = await this.findAdminById(id);

    if (quote.currentVersion.status !== 'DRAFT') {
      throw new BadRequestException(
        `Không thể gửi báo giá đang ở trạng thái "${quote.currentVersion.status}". Chỉ gửi được khi ở trạng thái DRAFT.`,
      );
    }

    const now = new Date().toISOString();
    quote.currentVersion.status = 'SENT';
    quote.currentVersion.sentAt = now;
    quote.status = 'SENT';
    quote.updatedAt = now;

    // Cập nhật trạng thái request liên quan sang QUOTATION_SENT
    await this.requestsService.transitionStatus(quote.quoteRequestId, {
      toStatus: 'QUOTATION_SENT',
      reason: `Đã gửi báo giá #${quote.id} phiên bản v${quote.currentVersionNumber} cho khách hàng qua email.`,
      actor,
    });

    return quote;
  }

  /**
   * Khách hàng: Chấp thuận báo giá (WM-052)
   */
  async acceptQuotation(id: string, dto: AcceptQuotationDto): Promise<Quotation> {
    const quote = await this.findAdminById(id);

    // Kiểm tra version
    if (quote.currentVersion.id !== dto.quotationVersionId) {
      throw new BadRequestException('Phiên bản báo giá bạn đang duyệt đã cũ hoặc không khớp với bản hiện hành.');
    }

    if (quote.currentVersion.status !== 'SENT') {
      throw new BadRequestException(
        `Báo giá đang ở trạng thái "${quote.currentVersion.status}", không thể thực hiện thao tác chấp thuận.`,
      );
    }

    // Kiểm tra hạn hiệu lực
    const now = new Date();
    const validUntil = new Date(quote.currentVersion.validUntil);
    if (now > validUntil) {
      quote.currentVersion.status = 'EXPIRED';
      quote.status = 'EXPIRED';
      throw new BadRequestException('Báo giá này đã hết hạn hiệu lực. Vui lòng liên hệ quản trị viên để gia hạn.');
    }

    const nowIso = now.toISOString();
    quote.currentVersion.status = 'ACCEPTED';
    quote.currentVersion.acceptedAt = nowIso;
    quote.currentVersion.acceptedByName = dto.acceptanceName;
    quote.currentVersion.acceptedNote = dto.acceptanceNote;
    quote.status = 'ACCEPTED';
    quote.updatedAt = nowIso;

    // Đổi trạng thái quote request sang CONVERTED
    await this.requestsService.transitionStatus(quote.quoteRequestId, {
      toStatus: 'CONVERTED',
      reason: `Khách hàng ${dto.acceptanceName} đã chấp thuận báo giá #${quote.id} v${quote.currentVersionNumber}.`,
      actor: dto.acceptanceName,
    });

    return quote;
  }

  /**
   * Khách hàng: Từ chối báo giá (WM-052)
   */
  async rejectQuotation(id: string, dto: RejectQuotationDto): Promise<Quotation> {
    const quote = await this.findAdminById(id);

    if (quote.currentVersion.id !== dto.quotationVersionId) {
      throw new BadRequestException('Phiên bản báo giá bạn đang duyệt đã cũ hoặc không khớp với bản hiện hành.');
    }

    if (quote.currentVersion.status !== 'SENT') {
      throw new BadRequestException(
        `Báo giá đang ở trạng thái "${quote.currentVersion.status}", không thể thực hiện thao tác từ chối.`,
      );
    }

    const nowIso = new Date().toISOString();
    quote.currentVersion.status = 'REJECTED';
    quote.currentVersion.rejectedAt = nowIso;
    quote.currentVersion.rejectionReason = dto.rejectionReason;
    quote.status = 'REJECTED';
    quote.updatedAt = nowIso;

    // Đổi trạng thái quote request sang CLOSED_LOST
    await this.requestsService.transitionStatus(quote.quoteRequestId, {
      toStatus: 'CLOSED_LOST',
      reason: `Khách hàng từ chối báo giá: ${dto.rejectionReason}`,
      actor: 'Khách hàng',
    });

    return quote;
  }

  /**
   * Tra cứu báo giá chi tiết (Admin)
   */
  async findAdminById(id: string): Promise<Quotation> {
    const found = this.quotations.find((q) => q.id === id || q.quoteRequestId === id);
    if (!found) {
      throw new NotFoundException(`Không tìm thấy báo giá #${id}`);
    }
    return found;
  }

  /**
   * Tra cứu báo giá công khai an toàn cho khách hàng (Customer Portal)
   */
  async findPublicById(id: string): Promise<Quotation> {
    return this.findAdminById(id);
  }
}
