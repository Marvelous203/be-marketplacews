import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  QuoteRequest,
  PublicQuoteRequest,
  RequestStatus,
  ALLOWED_REQUEST_TRANSITIONS,
  RequestActivity,
  InternalNote,
} from './requests.types.js';
import { CreateRequestDto } from './dto/create-request.dto.js';
import { QueryRequestsDto } from './dto/query-requests.dto.js';
import { TransitionRequestDto, AddInternalNoteDto, AssignStaffDto } from './dto/transition-request.dto.js';

@Injectable()
export class RequestsService {
  private requests: QuoteRequest[] = [
    {
      id: 'req-001-phoco',
      referenceCode: 'WMR-K78P',
      title: 'Website cho Nhà hàng Cơm Niêu Phố Cổ',
      solutionType: 'BUSINESS_WEBSITE',
      industryCategoryId: 'food-beverage',
      relatedListingId: 'listing-001-restaurant',
      relatedOfferId: 'offer-001-turnkey',
      goal: 'Nhận đặt bàn trước giờ cao điểm, xem thực đơn món ăn qua mã QR và tự động gửi xác nhận qua Zalo/Email.',
      budget: {
        minMinor: 15000000,
        maxMinor: 30000000,
        currency: 'VND',
        flexibility: 'NEGOTIABLE',
      },
      targetDate: '2026-12-25',
      status: 'TRIAGED',
      priority: 'HIGH',
      assignedToUserId: 'staff-01',
      assignedToName: 'Nguyễn Văn Minh (Trưởng nhóm Tư vấn)',
      contactSnapshot: {
        name: 'Trần Đình Trọng',
        email: 'trong.comnieu@example.com',
        phone: '0903123456',
        company: 'Nhà Hàng Cơm Niêu Phố Cổ',
      },
      requirementsSnapshot: {
        estimatedPages: '5_TO_10',
        features: ['CMS', 'CONTACT_FORM', 'BOOKING', 'QR_MENU'],
        integrations: ['ZALO', 'EMAIL'],
        technicalConfidence: 'NEED_CONSULTATION',
      },
      consentVersion: '2026-11-01',
      submittedAt: '2026-11-20T08:30:00Z',
      createdAt: '2026-11-20T08:30:00Z',
      updatedAt: '2026-11-20T09:15:00Z',
      internalNotes: [
        {
          id: 'note-01',
          authorId: 'staff-01',
          authorName: 'Nguyễn Văn Minh',
          body: 'Khách hàng có 2 chi nhánh tại Quận 1 và Quận 3, cần quản lý bàn riêng cho từng cơ sở.',
          createdAt: '2026-11-20T09:15:00Z',
        },
      ],
      activities: [
        {
          id: 'act-01',
          actor: 'Khách hàng (Web Form)',
          activityType: 'CREATED',
          summary: 'Tạo mới yêu cầu tư vấn dự án',
          createdAt: '2026-11-20T08:30:00Z',
        },
        {
          id: 'act-02',
          actor: 'Hệ thống Phân bổ',
          activityType: 'ASSIGNED',
          summary: 'Phân công cho Nguyễn Văn Minh phụ trách',
          createdAt: '2026-11-20T09:00:00Z',
        },
        {
          id: 'act-03',
          actor: 'Nguyễn Văn Minh',
          activityType: 'STATUS_CHANGED',
          fromStatus: 'NEW',
          toStatus: 'TRIAGED',
          reason: 'Đã gọi điện sơ bộ xác nhận thông tin cơ sở kinh doanh',
          summary: 'Chuyển trạng thái từ NEW sang TRIAGED',
          createdAt: '2026-11-20T09:15:00Z',
        },
      ],
    },
    {
      id: 'req-002-tamduc',
      referenceCode: 'WMR-M49X',
      title: 'Hệ thống Đặt lịch Nha Khoa Tâm Đức',
      solutionType: 'HEALTHCARE_PORTAL',
      industryCategoryId: 'healthcare',
      relatedListingId: 'listing-002-clinic',
      relatedOfferId: 'offer-003-turnkey',
      goal: 'Bệnh nhân tra cứu lịch khám của bác sĩ chuyên khoa và đặt lịch khám online tiện lợi.',
      budget: {
        minMinor: 12000000,
        maxMinor: 25000000,
        currency: 'VND',
        flexibility: 'STRICT',
      },
      targetDate: '2027-01-10',
      status: 'NEW',
      priority: 'NORMAL',
      contactSnapshot: {
        name: 'Bác sĩ Lê Thị Mai',
        email: 'mai.nhakhoa@example.com',
        phone: '0918765432',
        company: 'Phòng Khám Nha Khoa Tâm Đức',
      },
      requirementsSnapshot: {
        estimatedPages: '5_TO_10',
        features: ['CMS', 'DOCTOR_SCHEDULE', 'APPOINTMENT_BOOKING'],
        technicalConfidence: 'KNOW_EXACTLY',
      },
      consentVersion: '2026-11-01',
      submittedAt: '2026-11-22T14:10:00Z',
      createdAt: '2026-11-22T14:10:00Z',
      updatedAt: '2026-11-22T14:10:00Z',
      internalNotes: [],
      activities: [
        {
          id: 'act-04',
          actor: 'Khách hàng (Web Form)',
          activityType: 'CREATED',
          summary: 'Tạo mới yêu cầu tư vấn dự án',
          createdAt: '2026-11-22T14:10:00Z',
        },
      ],
    },
    {
      id: 'req-003-quoted',
      referenceCode: 'WMR-Q82L',
      title: 'Website cho Cửa hàng Thời trang Linen An Nhiên',
      solutionType: 'BUSINESS_WEBSITE',
      industryCategoryId: 'fashion-apparel',
      goal: 'Bán hàng thời trang thủ công và giới thiệu bộ sưu tập.',
      budget: {
        minMinor: 15000000,
        maxMinor: 30000000,
        currency: 'VND',
        flexibility: 'NEGOTIABLE',
      },
      status: 'QUOTATION_SENT',
      priority: 'HIGH',
      assignedToUserId: 'staff-01',
      assignedToName: 'Nguyễn Văn Minh',
      contactSnapshot: {
        name: 'Trần Đình Trọng',
        email: 'trong.comnieu@example.com',
        phone: '0903123456',
        company: 'Thời Trang An Nhiên',
      },
      requirementsSnapshot: {
        features: ['CMS', 'LOOKBOOK', 'CART'],
      },
      consentVersion: '2026-11-01',
      submittedAt: '2026-11-19T08:00:00Z',
      createdAt: '2026-11-19T08:00:00Z',
      updatedAt: '2026-11-20T10:00:00Z',
      internalNotes: [],
      activities: [
        {
          id: 'act-05',
          actor: 'Hệ thống',
          activityType: 'STATUS_CHANGED',
          fromStatus: 'IN_REVIEW',
          toStatus: 'QUOTATION_SENT',
          summary: 'Đã gửi báo giá chính thức',
          createdAt: '2026-11-20T10:00:00Z',
        },
      ],
    },
  ];

  /**
   * Tạo mã tra cứu ngẫu nhiên không tuần tự, dễ đọc (tránh 0, O, 1, I)
   */
  private generateReferenceCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = 'WMR-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Đảm bảo không trùng lặp
    if (this.requests.some((r) => r.referenceCode === code)) {
      return this.generateReferenceCode();
    }
    return code;
  }

  /**
   * Khách hàng / Khách vãng lai gửi form yêu cầu (WM-042)
   */
  async createRequest(dto: CreateRequestDto, requesterUserId?: string): Promise<{ id: string; referenceCode: string; status: RequestStatus; submittedAt: string }> {
    if (!dto.contact || !dto.contact.email || !dto.contact.name) {
      throw new BadRequestException('Thông tin liên hệ (họ tên và email) là bắt buộc.');
    }
    if (!dto.title || !dto.goal) {
      throw new BadRequestException('Tiêu đề dự án và mục tiêu kinh doanh là bắt buộc.');
    }

    const now = new Date().toISOString();
    const id = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const referenceCode = this.generateReferenceCode();

    const newRequest: QuoteRequest = {
      id,
      referenceCode,
      requesterUserId,
      relatedListingId: dto.relatedListingId,
      relatedOfferId: dto.relatedOfferId,
      title: dto.title.trim(),
      industryCategoryId: dto.industryCategoryId,
      solutionType: dto.solutionType || 'BUSINESS_WEBSITE',
      goal: dto.goal.trim(),
      budget: {
        minMinor: dto.budget?.minMinor,
        maxMinor: dto.budget?.maxMinor,
        currency: dto.budget?.currency || 'VND',
        flexibility: dto.budget?.flexibility || 'NEGOTIABLE',
      },
      targetDate: dto.targetDate,
      status: 'NEW',
      priority: 'NORMAL',
      contactSnapshot: {
        name: dto.contact.name.trim(),
        email: dto.contact.email.trim(),
        phone: dto.contact.phone?.trim(),
        company: dto.contact.company?.trim(),
      },
      requirementsSnapshot: {
        estimatedPages: dto.requirements?.estimatedPages,
        features: dto.requirements?.features || [],
        integrations: dto.requirements?.integrations || [],
        designReferenceUrls: dto.requirements?.designReferenceUrls || [],
        technicalConfidence: dto.requirements?.technicalConfidence || 'NEED_CONSULTATION',
        rawAnswers: dto.requirements?.rawAnswers,
      },
      consentVersion: dto.consent?.privacyPolicyVersion || '2026-11-01',
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
      internalNotes: [],
      activities: [
        {
          id: `act-${Date.now()}`,
          actor: requesterUserId ? `User (${requesterUserId})` : 'Khách vãng lai (Guest)',
          activityType: 'CREATED',
          summary: `Khởi tạo yêu cầu dự án "${dto.title}"`,
          createdAt: now,
        },
      ],
    };

    this.requests.unshift(newRequest);

    return {
      id: newRequest.id,
      referenceCode: newRequest.referenceCode,
      status: newRequest.status,
      submittedAt: newRequest.submittedAt,
    };
  }

  /**
   * Tra cứu công khai cho khách hàng theo mã referenceCode hoặc ID (Tách biệt DTO nội bộ)
   */
  async findPublicByReference(refOrId: string): Promise<PublicQuoteRequest> {
    const found = this.requests.find(
      (r) => r.referenceCode.toUpperCase() === refOrId.toUpperCase() || r.id === refOrId,
    );
    if (!found) {
      throw new NotFoundException(`Không tìm thấy hồ sơ yêu cầu với mã "${refOrId}".`);
    }

    // Loại bỏ hoàn toàn ghi chú nội bộ và thông tin staff nhạy cảm
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { internalNotes, assignedToUserId, assignedToName, ...publicData } = found;
    return publicData;
  }

  /**
   * Admin: Danh sách yêu cầu kèm bộ lọc, tìm kiếm và phân trang (WM-043)
   */
  async findAllAdmin(query: QueryRequestsDto): Promise<{ items: QuoteRequest[]; total: number; page: number; limit: number }> {
    let result = [...this.requests];

    if (query.search) {
      const kw = query.search.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.referenceCode.toLowerCase().includes(kw) ||
          r.title.toLowerCase().includes(kw) ||
          r.contactSnapshot.name.toLowerCase().includes(kw) ||
          r.contactSnapshot.email.toLowerCase().includes(kw) ||
          (r.contactSnapshot.company && r.contactSnapshot.company.toLowerCase().includes(kw)),
      );
    }

    if (query.status) {
      result = result.filter((r) => r.status === query.status);
    }

    if (query.priority) {
      result = result.filter((r) => r.priority === query.priority);
    }

    if (query.assignedToUserId) {
      result = result.filter((r) => r.assignedToUserId === query.assignedToUserId);
    }

    const total = result.length;
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const items = result.slice(skip, skip + limit);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  /**
   * Admin: Xem chi tiết yêu cầu
   */
  async findAdminById(id: string): Promise<QuoteRequest> {
    const found = this.requests.find((r) => r.id === id || r.referenceCode.toUpperCase() === id.toUpperCase());
    if (!found) {
      throw new NotFoundException(`Không tìm thấy hồ sơ yêu cầu ID/Code: ${id}`);
    }
    return found;
  }

  /**
   * Admin: Phân công nhân sự phụ trách (WM-044)
   */
  async assignStaff(id: string, dto: AssignStaffDto): Promise<QuoteRequest> {
    const req = await this.findAdminById(id);
    const now = new Date().toISOString();

    req.assignedToUserId = dto.staffUserId;
    req.assignedToName = dto.staffName;
    req.updatedAt = now;

    // Tự động chuyển NEW -> TRIAGED nếu chưa phân loại
    if (req.status === 'NEW') {
      req.status = 'TRIAGED';
    }

    req.activities.push({
      id: `act-${Date.now()}`,
      actor: dto.actor || 'Admin',
      activityType: 'ASSIGNED',
      summary: `Phân công phụ trách cho ${dto.staffName}`,
      createdAt: now,
    });

    return req;
  }

  /**
   * Admin: Chuyển đổi trạng thái có kiểm soát bằng State Machine (WM-044, BR-18)
   */
  async transitionStatus(id: string, dto: TransitionRequestDto): Promise<QuoteRequest> {
    const req = await this.findAdminById(id);
    const currentStatus = req.status;
    const nextStatus = dto.toStatus;

    if (currentStatus === nextStatus) {
      return req;
    }

    const allowed = ALLOWED_REQUEST_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái từ "${currentStatus}" sang "${nextStatus}". Các trạng thái hợp lệ: [${allowed.join(
          ', ',
        )}]`,
      );
    }

    if (!dto.reason || !dto.reason.trim()) {
      throw new BadRequestException('Bắt buộc phải cung cấp lý do chuyển trạng thái.');
    }

    const now = new Date().toISOString();
    req.status = nextStatus;
    req.updatedAt = now;

    const activity: RequestActivity = {
      id: `act-${Date.now()}`,
      actor: dto.actor || 'Staff',
      activityType: 'STATUS_CHANGED',
      fromStatus: currentStatus,
      toStatus: nextStatus,
      reason: dto.reason.trim(),
      summary: `Chuyển trạng thái từ ${currentStatus} sang ${nextStatus}`,
      createdAt: now,
    };

    req.activities.push(activity);
    return req;
  }

  /**
   * Admin: Thêm ghi chú nội bộ (không lộ ra khách hàng) (WM-044)
   */
  async addInternalNote(id: string, dto: AddInternalNoteDto): Promise<InternalNote> {
    const req = await this.findAdminById(id);
    if (!dto.body || !dto.body.trim()) {
      throw new BadRequestException('Nội dung ghi chú không được để trống.');
    }

    const now = new Date().toISOString();
    const note: InternalNote = {
      id: `note-${Date.now()}`,
      authorId: dto.authorId || 'staff-admin',
      authorName: dto.authorName || 'Quản trị viên',
      body: dto.body.trim(),
      createdAt: now,
    };

    req.internalNotes.push(note);
    req.updatedAt = now;

    req.activities.push({
      id: `act-${Date.now()}`,
      actor: note.authorName,
      activityType: 'NOTE_ADDED',
      summary: `Thêm ghi chú nội bộ: "${dto.body.slice(0, 40)}..."`,
      createdAt: now,
    });

    return note;
  }
}
