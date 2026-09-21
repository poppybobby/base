import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getLot } from '../data/catalog'
import { DEST_LABEL, estimateCost } from '../lib/cost'
import { manYen, yen } from '../lib/format'
import type { Destination } from '../types'

export function InquiryPage() {
  const [params] = useSearchParams()
  const lot = getLot(params.get('lot') ?? '')
  const initialBid = Number(params.get('bid') || lot?.expectedPrice || 1_000_000)
  const initialDest = (params.get('dest') as Destination) || 'kanto'
  const initialPlus = params.get('plus') === '1'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [bid, setBid] = useState(initialBid)
  const [dest, setDest] = useState<Destination>(initialDest)
  const [plus, setPlus] = useState(initialPlus)
  const [message, setMessage] = useState(
    lot ? `${lot.maker} ${lot.model}（${lot.lotNo}）の入札を依頼します。` : '',
  )
  const [done, setDone] = useState(false)

  const cost = useMemo(() => {
    if (!lot) return null
    return estimateCost(lot, bid, dest, plus)
  }, [lot, bid, dest, plus])

  function submit(e: FormEvent) {
    e.preventDefault()
    setDone(true)
  }

  if (done) {
    return (
      <main className="page prose-page">
        <p className="kicker">入札依頼</p>
        <h1>依頼を受け付けました。</h1>
        <p className="lede">
          {name} さん、確認の連絡を {email} に送ります。開催日前に上限と現車確認の有無を再確認します。
        </p>
        {lot && cost ? (
          <p>
            対象は {lot.maker} {lot.model}（{lot.lotNo}）、上限 {manYen(bid)}、検討用総額{' '}
            {yen(cost.total)} です。
          </p>
        ) : null}
        <Link className="btn primary" to="/lots">
          出品一覧に戻る
        </Link>
      </main>
    )
  }

  return (
    <main className="page">
      <header className="page-head">
        <p className="kicker">入札依頼</p>
        <h1>上限を書いて、代行に渡す。</h1>
        <p>開催当日は、この上限を超えたら降りることが前提です。</p>
      </header>

      {lot ? (
        <aside className="inquiry-lot">
          <img src={lot.images[0]} alt="" />
          <div>
            <p>
              {lot.venue} {lot.lotNo}
            </p>
            <strong>
              {lot.maker} {lot.model} {lot.trim}
            </strong>
            <p>落札目安 {manYen(lot.expectedPrice)}</p>
            <Link to={`/lots/${lot.id}`}>ロット詳細</Link>
          </div>
        </aside>
      ) : (
        <p className="empty">
          ロット未指定です。先に <Link to="/lots">出品車両</Link> から選ぶと、上限が引き継がれます。
        </p>
      )}

      <form className="inquiry" onSubmit={submit}>
        <label className="stack">
          お名前
          <input required value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="stack">
          メール
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="stack">
          電話
          <input required value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label className="stack">
          入札上限（円）
          <input
            required
            type="number"
            min={100000}
            step={10000}
            value={bid}
            onChange={(e) => setBid(Number(e.target.value))}
          />
        </label>
        <label className="stack">
          納車エリア
          <select
            value={dest}
            onChange={(e) => setDest(e.target.value as Destination)}
          >
            {(Object.keys(DEST_LABEL) as Destination[]).map((key) => (
              <option key={key} value={key}>
                {DEST_LABEL[key]}
              </option>
            ))}
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={plus}
            onChange={(e) => setPlus(e.target.checked)}
          />
          現車確認つきで依頼する
        </label>
        <label className="stack">
          補足
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
        {cost ? <p className="total-line">検討用総額 {yen(cost.total)}</p> : null}
        <button className="btn primary" type="submit">
          依頼を送る
        </button>
      </form>
    </main>
  )
}
