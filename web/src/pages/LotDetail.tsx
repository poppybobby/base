import { Link, useParams } from 'react-router-dom'
import { getLot, similarLots } from '../data/catalog'
import { Gallery } from '../components/Gallery'
import { CostPanel } from '../components/CostPanel'
import { LotCard } from '../components/LotCard'
import { Stamp } from '../components/Stamp'
import { auctionDateLabel, km, manYen, yearMonth } from '../lib/format'
import { useDesk } from '../state/useDesk'

export function LotDetailPage() {
  const { id } = useParams()
  const lot = id ? getLot(id) : undefined
  const { saved, compare, notes, toggleSaved, toggleCompare, setNote } = useDesk()

  if (!lot) {
    return (
      <main className="page">
        <h1>ロットが見つかりません</h1>
        <Link to="/lots">出品一覧へ</Link>
      </main>
    )
  }

  const gallery = [...lot.images, lot.sheetImage]
  const isSaved = saved.includes(lot.id)

  return (
    <main className="page detail">
      <p className="crumb">
        <Link to="/lots">出品車両</Link> / {lot.lotNo}
      </p>
      <header className="detail-head">
        <div>
          <p className="lot-kicker">
            {lot.venue}　{auctionDateLabel(lot.auctionDate)} {lot.startTime}　ロット {lot.lotNo}
          </p>
          <h1>
            {lot.maker} {lot.model}{' '}
            <span className="trim">{lot.trim}</span>
          </h1>
          <p className="lede">{lot.headline}</p>
        </div>
        <Stamp score={lot.score} repaired={lot.repaired} />
      </header>

      <Gallery images={gallery} alt={`${lot.maker} ${lot.model}`} />

      <div className="detail-grid">
        <div>
          <section className="prose">
            <h2>このロットの読み方</h2>
            <p>{lot.story}</p>
            <h3>出品票メモ</h3>
            <ul className="notes">
              {lot.inspectorNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <figure className="sheet">
              <img src={lot.sheetImage} alt={`${lot.model}の出品票`} />
              <figcaption>出品票。傷の位置は写真と突き合わせて読む。</figcaption>
            </figure>
          </section>
        </div>
        <div className="detail-side">
          <table className="spec">
            <tbody>
              <tr>
                <th>年式</th>
                <td>{yearMonth(lot.year, lot.month)}</td>
              </tr>
              <tr>
                <th>走行</th>
                <td>{km(lot.mileage)}</td>
              </tr>
              <tr>
                <th>排気量</th>
                <td>{lot.displacement.toLocaleString('ja-JP')}cc</td>
              </tr>
              <tr>
                <th>燃料 / ミッション</th>
                <td>
                  {lot.fuel} / {lot.transmission}
                </td>
              </tr>
              <tr>
                <th>駆動</th>
                <td>{lot.drive}</td>
              </tr>
              <tr>
                <th>色</th>
                <td>{lot.color}</td>
              </tr>
              <tr>
                <th>車検</th>
                <td>{lot.inspection}</td>
              </tr>
              <tr>
                <th>内外装</th>
                <td>
                  外 {lot.exterior} / 内 {lot.interior}
                </td>
              </tr>
              <tr>
                <th>修復歴</th>
                <td>{lot.repaired ? 'あり' : 'なし'}</td>
              </tr>
              <tr>
                <th>スタート</th>
                <td>{manYen(lot.startPrice)}</td>
              </tr>
              <tr>
                <th>落札目安</th>
                <td>{manYen(lot.expectedPrice)}</td>
              </tr>
            </tbody>
          </table>
          <p className="equip">{lot.equipment.join(' · ')}</p>
          <div className="icon-row">
            <button
              type="button"
              className={isSaved ? 'btn ghost on' : 'btn ghost'}
              onClick={() => toggleSaved(lot.id)}
            >
              {isSaved ? '検討リストに入っています' : '検討リストに入れる'}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                const ok = toggleCompare(lot.id)
                if (!ok) window.alert('比較は3台までです。')
              }}
            >
              {compare.includes(lot.id) ? '比較から外す' : '比較する'}
            </button>
          </div>
          <label className="stack memo">
            検討メモ（このブラウザに保存）
            <textarea
              rows={4}
              value={notes[lot.id] ?? ''}
              onChange={(e) => setNote(lot.id, e.target.value)}
              placeholder="通勤距離、色の好み、上限の根拠など"
            />
          </label>
          <CostPanel lot={lot} />
        </div>
      </div>

      <section className="section">
        <h2>近い検討候補</h2>
        <div className="lot-grid">
          {similarLots(lot).map((item) => (
            <LotCard key={item.id} lot={item} />
          ))}
        </div>
      </section>
    </main>
  )
}
