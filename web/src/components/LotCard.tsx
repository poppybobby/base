import { Link } from 'react-router-dom'
import type { Lot } from '../types'
import { km, manYen, yearMonth } from '../lib/format'
import { useDesk } from '../state/useDesk'
import { Stamp } from './Stamp'

export function LotCard({ lot }: { lot: Lot }) {
  const { saved, compare, toggleSaved, toggleCompare } = useDesk()
  const isSaved = saved.includes(lot.id)
  const isCompare = compare.includes(lot.id)

  return (
    <article className="lot-card">
      <Link to={`/lots/${lot.id}`} className="lot-card-photo">
        <img src={lot.images[0]} alt={`${lot.maker} ${lot.model} ${lot.trim}`} />
        <Stamp score={lot.score} repaired={lot.repaired} />
      </Link>
      <div className="lot-card-body">
        <p className="lot-kicker">
          {lot.venue} · {lot.auctionDate.replaceAll('-', '.')} · {lot.lotNo}
        </p>
        <h3>
          <Link to={`/lots/${lot.id}`}>
            {lot.maker} {lot.model}
          </Link>
        </h3>
        <p className="lot-trim">{lot.trim}</p>
        <ul className="spec-chips">
          <li>{yearMonth(lot.year, lot.month)}</li>
          <li>{km(lot.mileage)}</li>
          <li>{lot.fuel}</li>
          <li>{lot.color}</li>
        </ul>
        <div className="lot-card-foot">
          <div>
            <span className="muted">スタート</span>
            <strong>{manYen(lot.startPrice)}</strong>
            <span className="muted"> 目安 {manYen(lot.expectedPrice)}</span>
          </div>
          <div className="icon-row">
            <button
              type="button"
              className={isSaved ? 'icon-btn on' : 'icon-btn'}
              onClick={() => toggleSaved(lot.id)}
              aria-label="検討リスト"
            >
              {isSaved ? '検討中' : '検討'}
            </button>
            <button
              type="button"
              className={isCompare ? 'icon-btn on' : 'icon-btn'}
              onClick={() => {
                const ok = toggleCompare(lot.id)
                if (!ok) window.alert('比較は3台までです。')
              }}
              aria-label="比較に追加"
            >
              {isCompare ? '比較中' : '比較'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
