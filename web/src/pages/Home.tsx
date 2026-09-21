import { Link } from 'react-router-dom'
import { CATALOG } from '../data/catalog'
import { LotCard } from '../components/LotCard'
import { auctionDateLabel } from '../lib/format'

const STEPS = [
  {
    n: '01',
    t: '出品票を読む',
    d: '写真だけでなく、評価点・内外装・修復歴の欄を先に見る。傷の記号は減点の地図。',
  },
  {
    n: '02',
    t: '着地を試算する',
    d: '落札額に代行・陸送・税を足す。店頭価格と比べるのは、この総額。',
  },
  {
    n: '03',
    t: '上限を決めて依頼',
    d: '入札上限と納車地を渡す。当日の場況で、上限を超えたら見送る。',
  },
  {
    n: '04',
    t: '落札後に輸送・登録',
    d: '陸送、名義、希望があれば整備。鍵と書類が揃って検討は完了する。',
  },
]

export function HomePage() {
  const featured = CATALOG.filter((l) => l.featured)
  const dates = [...new Set(CATALOG.map((l) => l.auctionDate))].sort()

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="kicker">オークション代行デスク</p>
          <h1>
            出品票を読んで、
            <br />
            中古車を検討する。
          </h1>
          <p className="lede">
            LOTNOTEは、会場に並ぶ中古車を写真と出品票で眺め、落札から納車までの総額を置いてから買うかどうかを決めるための代行サービスです。
          </p>
          <div className="hero-actions">
            <Link className="btn primary" to="/lots">
              今週の出品を見る
            </Link>
            <Link className="btn ghost" to="/guide">
              評価点の読み方
            </Link>
          </div>
        </div>
        <figure className="hero-photo">
          <img src="/cars/hero_auction_hall.png" alt="オークション会場に並ぶ中古車" />
          <figcaption>開催前の会場。入札は出品票を読んでから。</figcaption>
        </figure>
      </section>

      <section className="stats">
        <div>
          <strong>{CATALOG.length}</strong>
          <span>検討用ロット</span>
        </div>
        <div>
          <strong>6</strong>
          <span>対応会場</span>
        </div>
        <div>
          <strong>3.3万円</strong>
          <span>代行手数料から</span>
        </div>
        <div>
          <strong>Rも掲載</strong>
          <span>修復歴は隠さない</span>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>今週、先に読むロット</h2>
          <Link to="/lots">すべて見る</Link>
        </div>
        <div className="lot-grid">
          {featured.map((lot) => (
            <LotCard key={lot.id} lot={lot} />
          ))}
        </div>
      </section>

      <section className="section split">
        <div>
          <p className="kicker">代行の流れ</p>
          <h2>買う前に、総額と傷を同じ机に置く。</h2>
          <p>
            写真がきれいでも、出品票のRや内外装Cは価格の本体です。LOTNOTEでは入札上限を先に決め、当日は場況に合わせて降りることも含めて代行します。
          </p>
        </div>
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s.n}>
              <span>{s.n}</span>
              <div>
                <strong>{s.t}</strong>
                <p>{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>直近の開催</h2>
        </div>
        <ul className="calendar">
          {dates.map((d) => {
            const lots = CATALOG.filter((l) => l.auctionDate === d)
            const venues = [...new Set(lots.map((l) => l.venue))].join(' / ')
            return (
              <li key={d}>
                <time>{auctionDateLabel(d)}</time>
                <span>{venues}</span>
                <Link to={`/lots?date=${d}`}>{lots.length}台</Link>
              </li>
            )
          })}
        </ul>
      </section>
    </main>
  )
}
