import { describe, it, expect, beforeEach } from 'vitest';
import { CommunityService } from './community.service.js';

describe('CommunityService (R4B/R4C Forum & Request Board)', () => {
  let service: CommunityService;

  beforeEach(() => {
    service = new CommunityService();
  });

  it('retrieves forum categories', () => {
    const categories = service.getCategories();
    expect(categories.length).toBeGreaterThanOrEqual(4);
    expect(categories.some((c) => c.slug === 'wanted')).toBe(true);
    expect(categories.some((c) => c.slug === 'qa')).toBe(true);
  });

  it('filters threads by threadType (WANTED)', () => {
    const result = service.getThreads({ threadType: 'WANTED' });
    expect(result.items.length).toBeGreaterThanOrEqual(2);
    expect(result.items.every((t) => t.threadType === 'WANTED')).toBe(true);
    expect(result.items[0].wantedDetails?.budgetRange).toBeDefined();
  });

  it('searches threads by query keyword', () => {
    const result = service.getThreads({ q: 'Đồng hồ' });
    expect(result.items.length).toBe(1);
    expect(result.items[0].slug).toBe('can-thiet-ke-web-dong-ho-cao-cap');
  });

  it('retrieves thread detail by slug and increments viewCount', () => {
    const initialView = service.getThreadBySlug('can-thiet-ke-web-dong-ho-cao-cap').viewCount;
    const thread = service.getThreadBySlug('can-thiet-ke-web-dong-ho-cao-cap');
    expect(thread.title).toContain('Đồng hồ cơ khí');
    expect(thread.viewCount).toBe(initialView + 1);
  });

  it('throws 404 for non-existent thread slug', () => {
    expect(() => service.getThreadBySlug('non-existent-thread')).toThrow(
      /Thread not found/,
    );
  });
});
