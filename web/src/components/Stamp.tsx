import type { Lot } from '../types'

export function Stamp({ score, repaired }: { score: string; repaired?: boolean }) {
  const tone = repaired || score === 'R' ? 'stamp stamp--r' : 'stamp'
  return (
    <span className={tone} title={repaired ? '修復歴あり' : `評価点 ${score}`}>
      <em>{score}</em>
      <small>{repaired ? '修復' : '評価'}</small>
    </span>
  )
}

export function LotMeta({ lot }: { lot: Lot }) {
  return (
    <p className="lot-meta">
      <span>{lot.venue}</span>
      <span>{lot.auctionDate.replaceAll('-', '.')}</span>
      <span>ロット {lot.lotNo}</span>
    </p>
  )
}
