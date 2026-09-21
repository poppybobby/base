import { NavLink, Link } from 'react-router-dom'
import { useDesk } from '../state/useDesk'

export function Header() {
  const { saved, compare } = useDesk()

  return (
    <header className="site-header">
      <Link to="/" className="brand">
        <span className="brand-mark" aria-hidden>
          票
        </span>
        <span>
          <strong>LOTNOTE</strong>
          <small>ロットノート</small>
        </span>
      </Link>
      <nav className="nav">
        <NavLink to="/lots">出品車両</NavLink>
        <NavLink to="/guide">代行の流れ</NavLink>
        <NavLink to="/saved">
          検討リスト{saved.length > 0 ? <i>{saved.length}</i> : null}
        </NavLink>
        <NavLink to="/compare">
          比較{compare.length > 0 ? <i>{compare.length}</i> : null}
        </NavLink>
        <NavLink to="/inquiry" className="nav-cta">
          入札依頼
        </NavLink>
      </nav>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <p className="brand-plain">LOTNOTE / ロットノート</p>
        <p>オークション出品票を読んで、中古車の購入を検討する代行デスク。</p>
      </div>
      <div className="footer-links">
        <Link to="/lots">出品車両</Link>
        <Link to="/guide">評価点の読み方</Link>
        <Link to="/inquiry">入札依頼</Link>
      </div>
      <p className="tiny">
        掲載車両は検討用のサンプルです。実在のオークション会場名・出品票とは無関係です。
      </p>
    </footer>
  )
}
