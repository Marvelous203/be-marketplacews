import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto.js';

describe('RequestsService', () => {
  let service: RequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequestsService],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
  });

  describe('createRequest (WM-042)', () => {
    const validDto: CreateRequestDto = {
      title: 'Xây dựng website bán hàng đồ gốm',
      solutionType: 'BUSINESS_WEBSITE',
      industryCategoryId: 'crafts',
      goal: 'Giới thiệu sản phẩm gốm mộc, nhận đặt hàng trực tuyến',
      budget: {
        minMinor: 10000000,
        maxMinor: 25000000,
        currency: 'VND',
        flexibility: 'NEGOTIABLE',
      },
      requirements: {
        estimatedPages: '5_TO_10',
        features: ['CMS', 'CONTACT_FORM'],
        technicalConfidence: 'NEED_CONSULTATION',
      },
      contact: {
        name: 'Hoàng Văn Thao',
        email: 'thao.gom@example.com',
        phone: '0987654321',
        company: 'Gốm Phù Lãng Mộc',
      },
      consent: {
        privacyPolicyVersion: '2026-11-01',
      },
    };

    it('tạo yêu cầu thành công, sinh mã WMR-XXXX không tuần tự và trạng thái ban đầu là NEW', async () => {
      const res = await service.createRequest(validDto);

      expect(res).toBeDefined();
      expect(res.id).toMatch(/^req-/);
      expect(res.referenceCode).toMatch(/^WMR-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/);
      expect(res.status).toBe('NEW');
      expect(res.submittedAt).toBeDefined();
    });

    it('bad path: thiếu email hoặc họ tên liên hệ phải ném BadRequestException', async () => {
      const invalidContactDto = { ...validDto, contact: { ...validDto.contact, email: '' } };
      await expect(service.createRequest(invalidContactDto as any)).rejects.toThrow(BadRequestException);
    });

    it('bad path: thiếu tiêu đề hoặc mục tiêu kinh doanh phải ném BadRequestException', async () => {
      const invalidTitleDto = { ...validDto, title: '' };
      await expect(service.createRequest(invalidTitleDto as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findPublicByReference (Khách hàng tra cứu an toàn)', () => {
    it('trả về thông tin yêu cầu hợp lệ và bóc tách hoàn toàn internalNotes / staff assignment', async () => {
      const pub = await service.findPublicByReference('WMR-K78P');

      expect(pub).toBeDefined();
      expect(pub.referenceCode).toBe('WMR-K78P');
      expect(pub.title).toContain('Nhà hàng Cơm Niêu Phố Cổ');
      // Đảm bảo không lộ ghi chú nội bộ
      expect((pub as any).internalNotes).toBeUndefined();
      expect((pub as any).assignedToUserId).toBeUndefined();
      expect((pub as any).assignedToName).toBeUndefined();
    });

    it('bad path: mã tra cứu không tồn tại phải ném NotFoundException', async () => {
      await expect(service.findPublicByReference('WMR-NONEXIST')).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignStaff & State Machine Transitions (WM-044)', () => {
    it('phân công nhân sự: cập nhật assignedToName và tự động chuyển NEW -> TRIAGED', async () => {
      const updated = await service.assignStaff('req-002-tamduc', {
        staffUserId: 'staff-02',
        staffName: 'Lê Thùy Dương',
      });

      expect(updated.assignedToUserId).toBe('staff-02');
      expect(updated.assignedToName).toBe('Lê Thùy Dương');
      expect(updated.status).toBe('TRIAGED');
      expect(updated.activities.some((a) => a.activityType === 'ASSIGNED')).toBe(true);
    });

    it('chuyển trạng thái hợp lệ: TRIAGED -> IN_REVIEW thành công kèm lý do', async () => {
      const req = await service.transitionStatus('req-001-phoco', {
        toStatus: 'IN_REVIEW',
        reason: 'Bắt đầu họp thẩm định kỹ thuật kiến trúc giải pháp',
        actor: 'Nguyễn Văn Minh',
      });

      expect(req.status).toBe('IN_REVIEW');
      const lastAct = req.activities[req.activities.length - 1];
      expect(lastAct.activityType).toBe('STATUS_CHANGED');
      expect(lastAct.fromStatus).toBe('TRIAGED');
      expect(lastAct.toStatus).toBe('IN_REVIEW');
      expect(lastAct.reason).toBe('Bắt đầu họp thẩm định kỹ thuật kiến trúc giải pháp');
    });

    it('bad path: chuyển trạng thái bị cấm bởi State Machine (NEW -> CLOSED_WON) phải ném BadRequestException', async () => {
      await expect(
        service.transitionStatus('req-002-tamduc', {
          toStatus: 'CLOSED_WON',
          reason: 'Nhảy cóc',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('bad path: chuyển trạng thái không kèm lý do phải ném BadRequestException', async () => {
      await expect(
        service.transitionStatus('req-001-phoco', {
          toStatus: 'IN_REVIEW',
          reason: '   ',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addInternalNote (Ghi chú nội bộ)', () => {
    it('thêm ghi chú nội bộ thành công và ghi nhận activity', async () => {
      const note = await service.addInternalNote('req-001-phoco', {
        body: 'Khách hàng đồng ý tăng ngân sách lên 35 triệu nếu có bàn giao mã nguồn',
        authorName: 'Nguyễn Văn Minh',
      });

      expect(note.id).toMatch(/^note-/);
      expect(note.body).toContain('tăng ngân sách lên 35 triệu');

      const adminReq = await service.findAdminById('req-001-phoco');
      expect(adminReq.internalNotes.some((n) => n.id === note.id)).toBe(true);
    });

    it('bad path: nội dung ghi chú trống phải ném BadRequestException', async () => {
      await expect(
        service.addInternalNote('req-001-phoco', {
          body: '   ',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllAdmin (Bộ lọc & Tìm kiếm Inbox)', () => {
    it('tìm kiếm theo từ khóa referenceCode hoặc tên khách hàng', async () => {
      const res = await service.findAllAdmin({ search: 'Phố Cổ' });
      expect(res.total).toBeGreaterThanOrEqual(1);
      expect(res.items[0].referenceCode).toBe('WMR-K78P');
    });

    it('lọc theo trạng thái status', async () => {
      const res = await service.findAllAdmin({ status: 'NEW' });
      expect(res.items.every((r) => r.status === 'NEW')).toBe(true);
    });
  });
});
