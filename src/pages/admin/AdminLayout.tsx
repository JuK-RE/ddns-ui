import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, CircleHelp, ExternalLink, LogOut, Menu, PanelLeft, Search, UserRound, X } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { getAvatarUrl } from '../../lib/avatar'
import { BrandLockup, ORG_URL, SUPPORT_URL } from '../../ui'
import { StatusBadge } from '../../components/StatusBadge'
import { filterNav } from './nav'
import '../../App.css'
import './Admin.css'

const COLLAPSED_KEY = 'ddns_sidebar_collapsed'

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

// Layout do painel, inspirado no dashboard da Cloudflare: topbar fina,
// sidebar com busca (Ctrl/⌘ K) + navegação, conteúdo e rodapé.
// No mobile a sidebar vira uma gaveta; no desktop dá pra recolher (só ícones).
export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const items = filterNav(query, Boolean(user?.is_admin))

  // Fecha gaveta/menu ao trocar de página. Ajuste de estado durante o
  // render (padrão recomendado pelo React) em vez de setState num effect.
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setMobileOpen(false)
    setMenuOpen(false)
  }

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0')
    } catch {
      // sem storage — só não lembra a preferência
    }
  }, [collapsed])

  // Atalho Ctrl/⌘ K pra focar a busca
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCollapsed(false)
        setMobileOpen(true)
        searchRef.current?.focus()
        // Se a sidebar estava recolhida o input está escondido — tenta de
        // novo depois do próximo render.
        requestAnimationFrame(() => searchRef.current?.focus())
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Fecha o menu do usuário clicando fora
  useEffect(() => {
    if (!menuOpen) return
    function onClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  function onSearchKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setQuery('')
      searchRef.current?.blur()
    }
    if (e.key === 'Enter') {
      const first = items.find((item) => !item.disabled)
      if (first) {
        navigate(first.to)
        setQuery('')
        searchRef.current?.blur()
      }
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/', { replace: true })
  }

  if (!user) return null

  const displayName = user.name ?? user.username ?? 'Usuário'

  return (
    <div className={`admin-shell${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-mobile-open' : ''}`}>
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <button type="button" className="admin-icon-btn admin-mobile-toggle" aria-label="Abrir menu" onClick={() => setMobileOpen(true)}>
            <Menu size={18} />
          </button>
          <Link to="/" className="admin-logo" aria-label="JUK.re DDNS — Visão geral">
            <BrandLockup height={14} />
          </Link>
        </div>

        <div className="admin-topbar-right">
          <Link className="admin-top-link" to="/docs">
            <BookOpen size={15} />
            <span>Docs</span>
          </Link>
          <a className="admin-top-link" href={SUPPORT_URL} target="_blank" rel="noreferrer">
            <CircleHelp size={15} />
            <span>Suporte</span>
          </a>

          <div className="admin-user" ref={menuRef}>
            <button
              type="button"
              className="admin-user-btn"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <img src={getAvatarUrl(user)} alt="" className="admin-avatar" />
            </button>

            {menuOpen && (
              <div className="admin-user-menu" role="menu">
                <div className="admin-user-menu-head">
                  <strong>{displayName}</strong>
                  {user.email && <span>{user.email}</span>}
                </div>
                <Link to="/profile" role="menuitem">
                  <UserRound size={15} /> Meu perfil
                </Link>
                <Link to="/home" role="menuitem">
                  <ExternalLink size={15} /> Ver site
                </Link>
                <button type="button" role="menuitem" className="danger" onClick={() => void handleLogout()}>
                  <LogOut size={15} /> Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="admin-backdrop" onClick={() => setMobileOpen(false)} aria-hidden="true" />

      <aside className="admin-sidebar" aria-label="Navegação do painel">
        <div className="admin-sidebar-mobile-head">
          <span>Menu</span>
          <button type="button" className="admin-icon-btn" aria-label="Fechar menu" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <label className="admin-search">
          <Search size={15} />
          <input
            ref={searchRef}
            type="search"
            placeholder="Busca rápida…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearchKey}
            aria-label="Buscar no painel"
          />
          {!query && <kbd>{isMac ? '⌘' : 'Ctrl'} K</kbd>}
        </label>

        <nav className="admin-nav">
          {items.length === 0 && <p className="admin-nav-empty">Nada encontrado.</p>}
          {items.map((item) => {
            const Icon = item.icon
            const content = (
              <>
                <Icon size={16} className="admin-nav-icon" />
                <span className="admin-nav-label">{item.label}</span>
                {item.badge && <span className="admin-nav-badge">{item.badge}</span>}
              </>
            )

            if (item.disabled) {
              return (
                <span key={item.to} className="admin-nav-item is-disabled" title={`${item.label} — ${item.badge ?? 'indisponível'}`}>
                  {content}
                </span>
              )
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `admin-nav-item${isActive ? ' is-active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                {content}
              </NavLink>
            )
          })}
        </nav>

        <div className="admin-sidebar-foot">
          <button
            type="button"
            className="admin-icon-btn"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            title={collapsed ? 'Expandir' : 'Recolher'}
          >
            <PanelLeft size={17} />
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <main className="admin-content">
          <Outlet />
        </main>

        <footer className="admin-footer">
          <nav>
            <Link to="/docs">Docs</Link>
            <a href={SUPPORT_URL} target="_blank" rel="noreferrer">Suporte</a>
            <a href={ORG_URL} target="_blank" rel="noreferrer">GitHub</a>
            <Link to="/home">Site</Link>
          </nav>
          <StatusBadge />
          <span>© 2026 JUK.re DDNS</span>
        </footer>
      </div>
    </div>
  )
}
