import { describe, it, expect, beforeEach } from 'vitest';
import { MoneyService } from './money.service.js';

describe('MoneyService (DEV_RULES.md §2 Compliance)', () => {
  let moneyService: MoneyService;

  beforeEach(() => {
    moneyService = new MoneyService();
  });

  describe('Creation and Float Prevention', () => {
    it('creates MoneyValue from valid integer minor units', () => {
      const vnd = moneyService.create(500000, 'VND');
      expect(vnd.amountMinor).toBe(500000n);
      expect(vnd.currency).toBe('VND');

      const usd = moneyService.create(1250n, 'USD');
      expect(usd.amountMinor).toBe(1250n);
      expect(usd.currency).toBe('USD');
    });

    it('rejects floating-point numbers immediately', () => {
      expect(() => moneyService.create(12.5, 'USD')).toThrow(
        /DEV_RULES Violation: Amount must be an integer minor unit/,
      );
      expect(() => moneyService.create(100.001, 'VND')).toThrow(
        /DEV_RULES Violation: Amount must be an integer minor unit/,
      );
    });

    it('rejects unsupported currency codes', () => {
      // @ts-expect-error testing invalid code
      expect(() => moneyService.create(100, 'XYZ')).toThrow(
        /Unsupported currency code/,
      );
    });
  });

  describe('Addition and Subtraction', () => {
    it('adds two MoneyValues of the same currency', () => {
      const a = moneyService.create(150000, 'VND');
      const b = moneyService.create(350000, 'VND');
      const result = moneyService.add(a, b);

      expect(result.amountMinor).toBe(500000n);
      expect(result.currency).toBe('VND');
    });

    it('subtracts two MoneyValues of the same currency', () => {
      const a = moneyService.create(500000, 'VND');
      const b = moneyService.create(150000, 'VND');
      const result = moneyService.subtract(a, b);

      expect(result.amountMinor).toBe(350000n);
    });

    it('blocks negative subtraction result by default', () => {
      const a = moneyService.create(100000, 'VND');
      const b = moneyService.create(200000, 'VND');
      expect(() => moneyService.subtract(a, b)).toThrow(
        /Resulting money amount cannot be negative/,
      );
    });

    it('allows negative subtraction when flag is set', () => {
      const a = moneyService.create(100000, 'VND');
      const b = moneyService.create(200000, 'VND');
      const result = moneyService.subtract(a, b, true);
      expect(result.amountMinor).toBe(-100000n);
    });

    it('throws error when operating on mismatched currencies', () => {
      const a = moneyService.create(100000, 'VND');
      const b = moneyService.create(1000, 'USD');
      expect(() => moneyService.add(a, b)).toThrow(/Currency mismatch/);
      expect(() => moneyService.subtract(a, b)).toThrow(/Currency mismatch/);
    });
  });

  describe('Basis Points & Rounding (HALF_EVEN and HALF_UP)', () => {
    it('calculates 10% discount (1000 bps) exactly', () => {
      const price = moneyService.create(5000000, 'VND');
      const discount = moneyService.multiplyBasisPoints(price, 1000); // 10%
      expect(discount.amountMinor).toBe(500000n);
    });

    it('rounds according to Banker Rounding (HALF_EVEN)', () => {
      // 25 * 50% (5000 bps) = 12.5 -> rounds to 12 (even)
      const base25 = moneyService.create(25, 'USD');
      const halfEven25 = moneyService.multiplyBasisPoints(
        base25,
        5000,
        'HALF_EVEN',
      );
      expect(halfEven25.amountMinor).toBe(12n);

      // 35 * 50% (5000 bps) = 17.5 -> rounds to 18 (even)
      const base35 = moneyService.create(35, 'USD');
      const halfEven35 = moneyService.multiplyBasisPoints(
        base35,
        5000,
        'HALF_EVEN',
      );
      expect(halfEven35.amountMinor).toBe(18n);
    });

    it('rounds according to HALF_UP', () => {
      // 25 * 50% (5000 bps) = 12.5 -> rounds to 13
      const base25 = moneyService.create(25, 'USD');
      const halfUp25 = moneyService.multiplyBasisPoints(
        base25,
        5000,
        'HALF_UP',
      );
      expect(halfUp25.amountMinor).toBe(13n);
    });
  });

  describe('Allocation without Loss of Minor Units', () => {
    it('allocates 100 VND equally across 3 parties without losing remainder', () => {
      const total = moneyService.create(100, 'VND');
      const shares = moneyService.allocate(total, [1, 1, 1]);

      expect(shares.length).toBe(3);
      expect(shares[0].amountMinor).toBe(34n); // 33 + 1 remainder
      expect(shares[1].amountMinor).toBe(33n);
      expect(shares[2].amountMinor).toBe(33n);

      const sum = shares.reduce((acc, s) => acc + s.amountMinor, 0n);
      expect(sum).toBe(100n);
    });

    it('allocates by custom ratio (e.g., 70% seller, 20% platform, 10% affiliate)', () => {
      const total = moneyService.create(10000000, 'VND'); // 10,000,000 VND
      const shares = moneyService.allocate(total, [70, 20, 10]);

      expect(shares[0].amountMinor).toBe(7000000n);
      expect(shares[1].amountMinor).toBe(2000000n);
      expect(shares[2].amountMinor).toBe(1000000n);
    });
  });

  describe('Currency Formatting', () => {
    it('formats VND properly (no decimals, thousand separator dot)', () => {
      const amount = moneyService.create(12500000, 'VND');
      expect(moneyService.format(amount)).toBe('12.500.000 ₫');
    });

    it('formats USD properly (2 decimals, thousand separator comma)', () => {
      const amount = moneyService.create(125050, 'USD');
      expect(moneyService.format(amount)).toBe('$1,250.50');
    });

    it('formats negative amounts with minus sign', () => {
      const negativeVnd = moneyService.create(-50000, 'VND');
      expect(moneyService.format(negativeVnd)).toBe('-50.000 ₫');

      const negativeUsd = moneyService.create(-1250, 'USD');
      expect(moneyService.format(negativeUsd)).toBe('-$12.50');
    });
  });
});
