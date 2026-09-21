import { Link } from 'react-router-dom'
import { CATALOG } from '../data/catalog'
import { estimateCost } from '../lib/cost'
import { km, manYen, yearMonth, yen } from '../lib/format'
import { useDesk } from '../state/useDesk'

export function ComparePage() {
  const { compare, toggleCompare } = useDesk()
  const lots = CATALOG.filter((l) => compare.includes(l.id))

  if (lots.length === 0) {
    return (
      <main className="page">
        <header className="page-head">
          <p className="kicker">比較</p>
          <h1>最大3台を横に並べる。</h1>
        </header>
        <p className="empty">
          比較対象がありません。<Link to="/lots">出品車両</Link>の「比較」から追加してください。
        </p>
      </main>
    )
  }

  const rows: { label: string; value: (id: (typeof lots)[number]) => string }[] = [
    { label: '会場', value: (l) => l.venue },
    { label: '開催', value: (l) => l.auctionDate },
    { label: '年式', value: (l) => yearMonth(l.year, l.month) },
    { label: '走行', value: (l) => km(l.mileage) },
    { label: '燃料', value: (l) => l.fuel },
    { label: '評価点', value: (l) => l.score },
    { label: '修復歴', value: (l) => (l.repaired ? 'あり' : 'なし') },
    { label: 'スタート', value: (l) => manYen(l.startPrice) },
    { label: '落札目安', value: (l) => manYen(l.expectedPrice) },
    {
      label: '関東納車の目安総額',
      value: (l) => yen(estimateCost(l, l.expectedPrice, 'kanto').total),
    },
  ]

  return (
    <main className="page">
      <header className="page-head">
        <p className="kicker">比較</p>
        <h1>数字を横に置く。</h1>
      </header>
      <div className="compare-wrap">
        <table className="compare">
          <thead>
            <tr>
              <th></th>
              {lots.map((lot) => (
                <th key={lot.id}>
                  <img src={lot.images[0]} alt="" />
                  <Link to={`/lots/${lot.id}`}>
                    {lot.maker} {lot.model}
                  </Link>
                  <button type="button" onClick={() => toggleCompare(lot.id)}>
                    外す
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th>{row.label}</th>
                {lots.map((lot) => (
                  <td key={lot.id}>{row.value(lot)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
