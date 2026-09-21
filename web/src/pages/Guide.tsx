export function GuidePage() {
  return (
    <main className="page prose-page">
      <p className="kicker">代行の流れと評価点</p>
      <h1>写真は入口、出品票が本体。</h1>
      <p className="lede">
        オークション代行は、会場に代わりに座ることではありません。傷と金額を同じ机に置き、上限を超えたら降りることまで含めて代行します。
      </p>

      <section>
        <h2>依頼から納車まで</h2>
        <ol className="plain-ol">
          <li>気になるロットを検討リストへ入れる。</li>
          <li>着地試算で入札上限と納車エリアを決める。</li>
          <li>入札依頼を送る。必要なら現車確認を足す。</li>
          <li>開催当日、上限の範囲で入札。届かなければ見送り。</li>
          <li>落札後、陸送・名義・希望があれば点検整備。</li>
        </ol>
      </section>

      <section>
        <h2>評価点の目安</h2>
        <table className="score-table">
          <thead>
            <tr>
              <th>点</th>
              <th>読み方</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>5 / S</th>
              <td>減点がほとんどない。新車近い状態。</td>
            </tr>
            <tr>
              <th>4.5</th>
              <td>小さな傷はあるが、日常使いに読みやすい。</td>
            </tr>
            <tr>
              <th>4</th>
              <td>年式相応の傷。内容を金額に翻訳する。</td>
            </tr>
            <tr>
              <th>3.5</th>
              <td>傷・汚れが目立つ。商用や価格重視向き。</td>
            </tr>
            <tr>
              <th>R</th>
              <td>修復歴あり。どこを直したかが本体。点では切らない。</td>
            </tr>
          </tbody>
        </table>
        <p>
          内外装の A / B / C は見た目のきれいさです。機関の良否とは別です。R
          は骨格や交換歴の話で、見た目の評価点より先に読みます。
        </p>
      </section>

      <section>
        <h2>総額に足すもの</h2>
        <p>
          スタート価格は開始の合図にすぎません。検討に使うのは、落札想定＋AA手数料＋代行＋陸送＋登録＋税です。車検切れなら車検費用も横に置きます。
        </p>
      </section>
    </main>
  )
}
