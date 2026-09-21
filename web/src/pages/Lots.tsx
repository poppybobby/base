import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BODY_TYPES,
  CATALOG,
  MAKERS,
  SCORES,
  VENUES,
} from '../data/catalog'
import { LotCard } from '../components/LotCard'
import type { Lot } from '../types'

type SortKey = 'date' | 'price' | 'score' | 'mileage'

const SCORE_RANK: Record<string, number> = {
  '5': 50,
  '4.5': 45,
  '4': 40,
  '3.5': 35,
  '3': 30,
  R: 10,
}

function applyFilters(lots: Lot[], params: URLSearchParams): Lot[] {
  const q = params.get('q')?.trim().toLowerCase() ?? ''
  const maker = params.get('maker') ?? ''
  const venue = params.get('venue') ?? ''
  const body = params.get('body') ?? ''
  const score = params.get('score') ?? ''
  const date = params.get('date') ?? ''
  const repaired = params.get('repaired') ?? ''

  return lots.filter((lot) => {
    if (maker && lot.maker !== maker) return false
    if (venue && lot.venue !== venue) return false
    if (body && lot.bodyType !== body) return false
    if (score && lot.score !== score) return false
    if (date && lot.auctionDate !== date) return false
    if (repaired === 'no' && lot.repaired) return false
    if (repaired === 'yes' && !lot.repaired) return false
    if (!q) return true
    const hay = `${lot.maker} ${lot.model} ${lot.trim} ${lot.lotNo} ${lot.color} ${lot.fuel}`.toLowerCase()
    return hay.includes(q)
  })
}

function sortLots(lots: Lot[], key: SortKey): Lot[] {
  const copy = [...lots]
  copy.sort((a, b) => {
    if (key === 'price') return a.expectedPrice - b.expectedPrice
    if (key === 'mileage') return a.mileage - b.mileage
    if (key === 'score')
      return (SCORE_RANK[b.score] ?? 0) - (SCORE_RANK[a.score] ?? 0)
    return a.auctionDate.localeCompare(b.auctionDate) || a.startTime.localeCompare(b.startTime)
  })
  return copy
}

export function LotsPage() {
  const [params, setParams] = useSearchParams()
  const sort = (params.get('sort') as SortKey) || 'date'

  const lots = useMemo(
    () => sortLots(applyFilters(CATALOG, params), sort),
    [params, sort],
  )

  function set(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  return (
    <main className="page">
      <header className="page-head">
        <p className="kicker">出品車両</p>
        <h1>写真と出品票で、買う前に読む。</h1>
        <p>会場・評価点・修復歴で絞り、検討リストに残してから上限を置きます。</p>
      </header>

      <form className="filters" onSubmit={(e) => e.preventDefault()}>
        <input
          type="search"
          placeholder="メーカー・車名・ロット番号"
          value={params.get('q') ?? ''}
          onChange={(e) => set('q', e.target.value)}
        />
        <select
          value={params.get('maker') ?? ''}
          onChange={(e) => set('maker', e.target.value)}
        >
          <option value="">メーカー</option>
          {MAKERS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select
          value={params.get('body') ?? ''}
          onChange={(e) => set('body', e.target.value)}
        >
          <option value="">ボディ</option>
          {BODY_TYPES.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select
          value={params.get('venue') ?? ''}
          onChange={(e) => set('venue', e.target.value)}
        >
          <option value="">会場</option>
          {VENUES.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select
          value={params.get('score') ?? ''}
          onChange={(e) => set('score', e.target.value)}
        >
          <option value="">評価点</option>
          {SCORES.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select
          value={params.get('repaired') ?? ''}
          onChange={(e) => set('repaired', e.target.value)}
        >
          <option value="">修復歴</option>
          <option value="no">なし</option>
          <option value="yes">あり（R）</option>
        </select>
        <select
          value={sort}
          onChange={(e) => set('sort', e.target.value)}
        >
          <option value="date">開催日</option>
          <option value="price">価格が低い</option>
          <option value="score">評価点</option>
          <option value="mileage">走行が少ない</option>
        </select>
      </form>

      <p className="result-count">{lots.length}台が条件に合います</p>
      {lots.length === 0 ? (
        <p className="empty">条件に合うロットがありません。フィルタを緩めてください。</p>
      ) : (
        <div className="lot-grid">
          {lots.map((lot) => (
            <LotCard key={lot.id} lot={lot} />
          ))}
        </div>
      )}
    </main>
  )
}
