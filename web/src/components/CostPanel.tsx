import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Destination, Lot } from '../types'
import { DEST_LABEL, estimateCost } from '../lib/cost'
import { manYen, yen } from '../lib/format'

export function CostPanel({ lot }: { lot: Lot }) {
  const [bid, setBid] = useState(lot.expectedPrice)
  const [dest, setDest] = useState<Destination>('kanto')
  const [plus, setPlus] = useState(false)
  const cost = useMemo(
    () => estimateCost(lot, bid, dest, plus),
    [lot, bid, dest, plus],
  )

  const min = Math.round(lot.startPrice * 0.9)
  const max = Math.round(lot.expectedPrice * 1.35)

  return (
    <aside className="cost-panel">
      <p className="kicker">着地試算</p>
      <h2>上限を置いて、総額を見る</h2>
      <label className="stack">
        入札上限 {manYen(bid)}
        <input
          type="range"
          min={min}
          max={max}
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
        現車確認つき代行（+22,000円）
      </label>
      <dl className="cost-list">
        <div>
          <dt>落札想定</dt>
          <dd>{yen(cost.bid)}</dd>
        </div>
        <div>
          <dt>AA手数料</dt>
          <dd>{yen(cost.auctionFee)}</dd>
        </div>
        <div>
          <dt>代行手数料</dt>
          <dd>{yen(cost.proxyFee)}</dd>
        </div>
        <div>
          <dt>陸送</dt>
          <dd>{yen(cost.transport)}</dd>
        </div>
        <div>
          <dt>登録代行</dt>
          <dd>{yen(cost.registration)}</dd>
        </div>
        <div>
          <dt>リサイクル</dt>
          <dd>{yen(cost.recycle)}</dd>
        </div>
        <div>
          <dt>自動車税未経過</dt>
          <dd>{yen(cost.taxRemainder)}</dd>
        </div>
        <div>
          <dt>消費税</dt>
          <dd>{yen(cost.consumptionTax)}</dd>
        </div>
        <div className="total">
          <dt>検討用の総額</dt>
          <dd>{yen(cost.total)}</dd>
        </div>
      </dl>
      <p className="tiny">
        実費は会場・年式・登録地で変わります。入札依頼前の目安です。
      </p>
      <Link
        className="btn primary block"
        to={`/inquiry?lot=${lot.id}&bid=${bid}&dest=${dest}&plus=${plus ? '1' : '0'}`}
      >
        この上限で入札を依頼する
      </Link>
    </aside>
  )
}
