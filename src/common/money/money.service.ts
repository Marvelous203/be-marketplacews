import { Injectable, BadRequestException } from '@nestjs/common';
import {
  CurrencyCode,
  CURRENCY_REGISTRY,
  MoneyValue,
  RoundingMode,
} from './money.types.js';

@Injectable()
export class MoneyService {
  /**
   * Tạo đối tượng MoneyValue từ số nguyên minor units an toàn.
   * Cấm float: nếu truyền số không phải integer, hàm sẽ throw.
   */
  create(amountMinor: bigint | number, currency: CurrencyCode = 'VND'): MoneyValue {
    if (!CURRENCY_REGISTRY[currency]) {
      throw new BadRequestException(`Unsupported currency code: ${currency}`);
    }

    let minor: bigint;
    if (typeof amountMinor === 'number') {
      if (!Number.isInteger(amountMinor)) {
        throw new BadRequestException(
          `DEV_RULES Violation: Amount must be an integer minor unit, received float: ${amountMinor}`,
        );
      }
      minor = BigInt(amountMinor);
    } else {
      minor = amountMinor;
    }

    return { amountMinor: minor, currency };
  }

  /**
   * Cộng 2 số tiền cùng loại tiền tệ
   */
  add(a: MoneyValue, b: MoneyValue): MoneyValue {
    this.assertSameCurrency(a, b);
    return {
      amountMinor: a.amountMinor + b.amountMinor,
      currency: a.currency,
    };
  }

  /**
   * Trừ 2 số tiền cùng loại tiền tệ (có cờ allowNegative)
   */
  subtract(a: MoneyValue, b: MoneyValue, allowNegative = false): MoneyValue {
    this.assertSameCurrency(a, b);
    const result = a.amountMinor - b.amountMinor;
    if (!allowNegative && result < 0n) {
      throw new BadRequestException(
        `Resulting money amount cannot be negative: ${result.toString()}`,
      );
    }
    return {
      amountMinor: result,
      currency: a.currency,
    };
  }

  /**
   * Nhân số tiền với tỷ lệ basis points (1 bps = 0.01% = 0.0001).
   * Ví dụ: 10% = 1000 bps; 8.25% = 825 bps; 100% = 10000 bps.
   * Áp dụng thuật toán làm tròn chuẩn HALF_EVEN (Banker's rounding) hoặc HALF_UP.
   */
  multiplyBasisPoints(
    base: MoneyValue,
    basisPoints: number,
    roundingMode: RoundingMode = 'HALF_EVEN',
  ): MoneyValue {
    if (!Number.isInteger(basisPoints)) {
      throw new BadRequestException('basisPoints must be an integer');
    }

    const bps = BigInt(basisPoints);
    const BPS_DIVISOR = 10000n;

    // numerator = base.amountMinor * bps
    const numerator = base.amountMinor * bps;
    const quotient = numerator / BPS_DIVISOR;
    const remainder = numerator % BPS_DIVISOR;

    if (remainder === 0n) {
      return { amountMinor: quotient, currency: base.currency };
    }

    let roundedQuotient = quotient;
    const absRemainder = remainder < 0n ? -remainder : remainder;
    const doubleRemainder = absRemainder * 2n;

    if (roundingMode === 'HALF_UP') {
      if (doubleRemainder >= BPS_DIVISOR) {
        roundedQuotient += numerator >= 0n ? 1n : -1n;
      }
    } else {
      // HALF_EVEN (Banker's Rounding)
      if (doubleRemainder > BPS_DIVISOR) {
        roundedQuotient += numerator >= 0n ? 1n : -1n;
      } else if (doubleRemainder === BPS_DIVISOR) {
        // Đúng nửa: làm tròn về số chẵn
        const isOdd = (quotient < 0n ? -quotient : quotient) % 2n === 1n;
        if (isOdd) {
          roundedQuotient += numerator >= 0n ? 1n : -1n;
        }
      }
    }

    return { amountMinor: roundedQuotient, currency: base.currency };
  }

  /**
   * Phân bổ số tiền theo tỷ lệ nguyên (ratios), đảm bảo không mất đồng/cent lẻ.
   * Ví dụ: 100 đồng chia 3 phần tỷ lệ [1, 1, 1] -> [34, 33, 33] tổng = 100.
   */
  allocate(base: MoneyValue, ratios: number[]): MoneyValue[] {
    if (ratios.length === 0) {
      return [];
    }
    for (const r of ratios) {
      if (!Number.isInteger(r) || r < 0) {
        throw new BadRequestException('Ratios must be non-negative integers');
      }
    }

    const totalWeight = ratios.reduce((sum, r) => sum + BigInt(r), 0n);
    if (totalWeight === 0n) {
      throw new BadRequestException('Total ratio weight cannot be 0');
    }

    let remainder = base.amountMinor;
    const results: MoneyValue[] = [];

    for (let i = 0; i < ratios.length; i++) {
      const weight = BigInt(ratios[i]);
      const share = (base.amountMinor * weight) / totalWeight;
      results.push({ amountMinor: share, currency: base.currency });
      remainder -= share;
    }

    // Phân bổ phần dư (remainder) từng 1 đơn vị cho các phần tử theo thứ tự
    let idx = 0;
    while (remainder > 0n) {
      results[idx % results.length].amountMinor += 1n;
      remainder -= 1n;
      idx++;
    }

    return results;
  }

  /**
   * Định dạng tiền tệ theo chuẩn hiển thị người dùng (VND: 500.000 ₫, USD: $50.00)
   */
  format(value: MoneyValue): string {
    const meta = CURRENCY_REGISTRY[value.currency];
    const isNegative = value.amountMinor < 0n;
    const absMinor = isNegative ? -value.amountMinor : value.amountMinor;

    if (meta.exponent === 0) {
      // Ví dụ: VND
      const formattedNumber = this.addThousandSeparators(
        absMinor.toString(),
        meta.thousandSeparator,
      );
      const sign = isNegative ? '-' : '';
      return meta.symbolPosition === 'after'
        ? `${sign}${formattedNumber} ${meta.symbol}`
        : `${sign}${meta.symbol}${formattedNumber}`;
    }

    // Ví dụ: USD với exponent = 2
    const divisor = 10n ** BigInt(meta.exponent);
    const whole = absMinor / divisor;
    const fraction = (absMinor % divisor).toString().padStart(meta.exponent, '0');
    const formattedWhole = this.addThousandSeparators(
      whole.toString(),
      meta.thousandSeparator,
    );
    const formattedNumber = `${formattedWhole}${meta.decimalSeparator}${fraction}`;
    const sign = isNegative ? '-' : '';

    return meta.symbolPosition === 'after'
      ? `${sign}${formattedNumber} ${meta.symbol}`
      : `${sign}${meta.symbol}${formattedNumber}`;
  }

  private addThousandSeparators(str: string, sep: string): string {
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  }

  private assertSameCurrency(a: MoneyValue, b: MoneyValue): void {
    if (a.currency !== b.currency) {
      throw new BadRequestException(
        `Currency mismatch: cannot operate between ${a.currency} and ${b.currency}`,
      );
    }
  }
}
