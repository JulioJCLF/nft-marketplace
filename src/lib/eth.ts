import Decimal from 'decimal.js'
export { truncateAddress, formatDate } from './utils'


// Configure Decimal.js with 18 decimal places (standard for Ethereum wei/eth precision)
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

export function toDecimal(val: string | number): Decimal {
  try {
    return new Decimal(val || 0)
  } catch {
    return new Decimal(0)
  }
}

export function addEth(a: string, b: string): string {
  return toDecimal(a).plus(toDecimal(b)).toFixed(4)
}

export function subEth(a: string, b: string): string {
  const res = toDecimal(a).minus(toDecimal(b))
  return (res.isNegative() ? new Decimal(0) : res).toFixed(4)
}

export function mulEth(price: string, quantity: number): string {
  const qty = Math.max(0, Math.floor(quantity))
  return toDecimal(price).times(qty).toFixed(4)
}

export function calcDiscountPercent(amount: string, percent: number): string {
  const pct = Math.min(100, Math.max(0, percent))
  return toDecimal(amount).times(pct).dividedBy(100).toFixed(4)
}

export function calcOrderTotal(subtotal: string, discount: string, gasFee: string): string {
  const sub = toDecimal(subtotal)
  const disc = toDecimal(discount)
  const fee = toDecimal(gasFee)
  const afterDiscount = sub.minus(disc)
  const netSub = afterDiscount.isNegative() ? new Decimal(0) : afterDiscount
  return netSub.plus(fee).toFixed(4)
}

export function compareEth(a: string, b: string): number {
  return toDecimal(a).comparedTo(toDecimal(b))
}

export function formatEth(val: string | number): string {
  const dec = toDecimal(val)
  return `${dec.toFixed(4)} ETH`
}

export function formatEthRaw(val: string | number): string {
  return toDecimal(val).toFixed(4)
}

export function formatUsdEquivalent(ethVal: string | number, ethPriceUsd = 3450): string {
  const usd = toDecimal(ethVal).times(ethPriceUsd)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usd.toNumber())
}
