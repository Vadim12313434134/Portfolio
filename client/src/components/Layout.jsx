import { Link, Outlet } from 'react-router-dom'
import { BRAND_NAME } from '../config'
import './Layout.css'

export default function Layout() {
  return (
    <div className="layout">
      <header className="layout__header">
        <Link to="/" className="layout__brand">
          {BRAND_NAME}
        </Link>
        <nav className="layout__nav">
          <Link to="/">Работы</Link>
          <Link to="/admin">Админ</Link>
        </nav>
      </header>
      <main className="layout__main">
        <Outlet />
      </main>
      <footer className="layout__footer">
        <span>{BRAND_NAME}</span>
        <span>Портфолио</span>
      </footer>
    </div>
  )
}
