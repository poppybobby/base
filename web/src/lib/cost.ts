import type { Destination, Lot } from '../types'

const VENUE_REGION: Record<Lot['venue'], Destination | 'kyushu' | 'hokkaido'> = {
  首都圏AA: 'kanto',
  横浜AA: 'kanto',
  中部AA: 'chubu',
  関西AA: 'kansai',
  九州AA: 'other',
  北海道AA: 'other',
}

const DEST_INDEX: Record<string, number> = {
  kanto: 0,
  chubu: 1,
  kansai: 2,
  other: 3,
}

export type CostBreakdown = {
  bid: number
  auctionFee: number
  proxyFee: number
  transport: number
  registration: number
  recycle: number
  taxRemainder: number
  consumptionTax: number
  subtotal: number
  total: number
}

export function transportFee(lot: Lot, dest: Destination): number {
  const from = VENUE_REGION[lot.venue]
  const fromIdx = DEST_INDEX[from === 'kyushu' || from === 'hokkaido' ? 'other' : from]
  const toIdx = DEST_INDEX[dest]
  const hops = Math.abs(fromIdx - toIdx)
  return 16_000 + hops * 13_000 + (lot.venue === '北海道AA' ? 18_000 : 0)
}

export function estimateCost(
  lot: Lot,
  bid: number,
  dest: Destination,
  inspectPlus = false,
): CostBreakdown {
  const auctionFee = 11_000 + Math.floor(bid * 0.02)
  const proxyFee = inspectPlus ? 55_000 : 33_000
  const transport = transportFee(lot, dest)
  const registration = 22_000
  const recycle = lot.recycleFee
  const taxRemainder = lot.taxRemainder
  const taxable = bid + auctionFee + proxyFee + transport + registration
  const consumptionTax = Math.floor(taxable * 0.1)
  const subtotal = taxable + recycle + taxRemainder
  const total = subtotal + consumptionTax
  return {
    bid,
    auctionFee,
    proxyFee,
    transport,
    registration,
    recycle,
    taxRemainder,
    consumptionTax,
    subtotal,
    total,
  }
}

export const DEST_LABEL: Record<Destination, string> = {
  kanto: '関東（納車）',
  chubu: '中部（納車）',
  kansai: '関西（納車）',
  other: 'その他地域',
}
