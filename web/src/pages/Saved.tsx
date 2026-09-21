import { Link } from 'react-router-dom'
import { CATALOG } from '../data/catalog'
import { LotCard } from '../components/LotCard'
import { useDesk } from '../state/useDesk'

export function SavedPage() {
  const { saved } = useDesk()
  const lots = CATALOG.filter((l) => saved.includes(l.id))

  return (
    <main className="page">
      <header className="page-head">
        <p className="kicker">検討リスト</p>
        <h1>まだ買わない。先に残す。</h1>
        <p>気になったロットをここに集め、出品票と総額を読み比べます。</p>
      </header>
      {lots.length === 0 ? (
        <p className="empty">
          まだありません。<Link to="/lots">出品車両</Link>から「検討」を押してください。
        </p>
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
