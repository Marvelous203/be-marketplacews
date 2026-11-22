export type CurrencyCode = 'VND' | 'USD' | 'EUR';

export interface CurrencyMeta {
  code: CurrencyCode;
  exponent: number; // 0 for VND, 2 for USD/EUR
  symbol: string;
  symbolPosition: 'before' | 'after';
  thousandSeparator: string;
  decimalSeparator: string;
}

export const CURRENCY_REGISTRY: Record<CurrencyCode, CurrencyMeta> = {
  VND: {
    code: 'VND',
    exponent: 0,
    symbol: '₫',
    symbolPosition: 'after',
    thousandSeparator: '.',
    decimalSeparator: ',',
  },
  USD: {
    code: 'USD',
    exponent: 2,
    symbol: '$',
    symbolPosition: 'before',
    thousandSeparator: ',',
    decimalSeparator: '.',
  },
  EUR: {
    code: 'EUR',
    exponent: 2,
    symbol: '€',
    symbolPosition: 'after',
    thousandSeparator: '.',
    decimalSeparator: ',',
  },
};

export type RoundingMode = 'HALF_EVEN' | 'HALF_UP';

export interface MoneyValue {
  amountMinor: bigint; // minor integer units (VND: 1 đồng = 1; USD: $1.00 = 100)
  currency: CurrencyCode;
}
