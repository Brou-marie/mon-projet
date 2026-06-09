import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import clsx from 'clsx'
import {
  Activity,
  Building2,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Eye,
  EyeOff,
  Home,
  Hotel,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Menu,
  Power,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Users,
  X,
} from 'lucide-react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
const ACCESS_KEY = 'noamhome_admin_access'
const REFRESH_KEY = 'noamhome_admin_refresh'
const ADMIN_ROLES = new Set(['moderator', 'superadmin'])

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const isAuthCall =
      originalRequest?.url?.includes('/auth/login/') ||
      originalRequest?.url?.includes('/auth/refresh/')

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthCall) {
      originalRequest._retry = true
      const refresh = localStorage.getItem(REFRESH_KEY)

      if (!refresh) {
        clearAdminSession()
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh })
        localStorage.setItem(ACCESS_KEY, data.access)
        if (data.refresh) {
          localStorage.setItem(REFRESH_KEY, data.refresh)
        }
        originalRequest.headers.Authorization = `Bearer ${data.access}`
        return api(originalRequest)
      } catch (refreshError) {
        clearAdminSession()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

function clearAdminSession() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

function canUseAdmin(user) {
  return Boolean(user?.is_staff || ADMIN_ROLES.has(user?.role))
}

function extractRows(payload) {
  if (Array.isArray(payload)) return payload
  return payload?.results || []
}

function formatMoney(value) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(value) {
  if (!value) return 'Non défini'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function statusLabel(value) {
  const labels = {
    active: 'Actif',
    pending: 'En attente',
    suspended: 'Suspendu',
    rejected: 'Rejeté',
    verified: 'Vérifié',
    under_review: 'En revue',
    confirmed: 'Confirmée',
    completed: 'Terminée',
    in_progress: 'En cours',
    cart: 'Panier',
    cancelled_by_guest: 'Annulée',
    cancelled_by_host: 'Annulée',
    succeeded: 'Réussi',
    processing: 'En cours',
    failed: 'Échoué',
    refunded: 'Remboursé',
  }
  return labels[value] || value || 'Non défini'
}

const tabs = [
  { id: 'overview', label: 'Vue générale', icon: Activity },
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'hosts', label: 'Hôtes', icon: ShieldCheck },
  { id: 'establishments', label: 'Hébergements', icon: Hotel },
  { id: 'bookings', label: 'Réservations', icon: CalendarCheck },
  { id: 'payments', label: 'Paiements', icon: CircleDollarSign },
]

const resourceEndpoints = {
  users: '/admin-panel/users/',
  hosts: '/admin-panel/hosts/',
  establishments: '/admin-panel/establishments/',
  bookings: '/admin-panel/bookings/',
  payments: '/admin-panel/payments/',
}

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const verifySession = useCallback(async () => {
    const token = localStorage.getItem(ACCESS_KEY)
    if (!token) {
      setAuthLoading(false)
      return
    }

    try {
      const { data } = await api.get('/accounts/me/')
      if (!canUseAdmin(data)) {
        clearAdminSession()
        setAuthError("Votre compte n'a pas accès à l'administration.")
        setUser(null)
      } else {
        setUser(data)
      }
    } catch {
      clearAdminSession()
      setUser(null)
    } finally {
      setAuthLoading(false)
    }
  }, [])

  useEffect(() => {
    verifySession()
  }, [verifySession])

  const handleLogin = async ({ email, password }) => {
    setAuthError('')
    const { data } = await api.post('/auth/login/', { email, password })

    if (!canUseAdmin(data.user)) {
      clearAdminSession()
      throw new Error("Ce compte n'a pas accès à l'administration.")
    }

    localStorage.setItem(ACCESS_KEY, data.access)
    localStorage.setItem(REFRESH_KEY, data.refresh)
    setUser(data.user)
  }

  const handleLogout = () => {
    clearAdminSession()
    setUser(null)
    setActiveTab('overview')
  }

  if (authLoading) {
    return <CenteredLoader label="Chargement de NoamHome Admin" />
  }

  if (!user) {
    return <LoginView error={authError} onLogin={handleLogin} />
  }

  return (
    <AdminShell
      activeTab={activeTab}
      onChangeTab={(tab) => {
        setActiveTab(tab)
        setSidebarOpen(false)
      }}
      onLogout={handleLogout}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      user={user}
    >
      {activeTab === 'overview' ? (
        <Overview />
      ) : (
        <ResourceView resource={activeTab} />
      )}
    </AdminShell>
  )
}

function LoginView({ error, onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [localError, setLocalError] = useState(error)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    setLocalError(error)
  }, [error])

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setLocalError('')

    try {
      await onLogin({ email: form.email.trim(), password: form.password })
    } catch (err) {
      setLocalError(
        err.response?.data?.detail ||
          err.message ||
          'Email ou mot de passe incorrect.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-screen">
      <section className="login-panel">
        <div className="brand-lockup">
          <span className="brand-mark">
            <Home size={22} />
          </span>
          <div>
            <p className="eyebrow">Back-office</p>
            <h1>NoamHome Admin</h1>
          </div>
        </div>

        <form onSubmit={submit} className="login-form">
          <div>
            <h2>Connexion administrateur</h2>
            <p>Accès réservé aux équipes autorisées.</p>
          </div>

          {localError ? (
            <div className="alert" role="alert">
              <ShieldCheck size={18} />
              <span>{localError}</span>
            </div>
          ) : null}

          <label className="field">
            <span>Email</span>
            <span className="input-wrap">
              <Mail size={18} />
              <input
                autoComplete="email"
                name="email"
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                required
                type="email"
                value={form.email}
              />
            </span>
          </label>

          <label className="field">
            <span>Mot de passe</span>
            <span className="input-wrap">
              <Lock size={18} />
              <input
                autoComplete="current-password"
                name="password"
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                required
                type={showPassword ? 'text' : 'password'}
                value={form.password}
              />
              <button
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="icon-button ghost"
                onClick={() => setShowPassword((value) => !value)}
                type="button"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          <button className="primary-action" disabled={loading} type="submit">
            {loading ? <Loader2 className="spin" size={18} /> : <ShieldCheck size={18} />}
            Se connecter
          </button>
        </form>
      </section>
    </main>
  )
}

function AdminShell({
  activeTab,
  children,
  onChangeTab,
  onLogout,
  sidebarOpen,
  setSidebarOpen,
  user,
}) {
  const initials = useMemo(() => {
    const base = user?.full_name || user?.first_name || user?.email || 'A'
    return base
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [user])

  return (
    <div className="admin-layout">
      <aside className={clsx('sidebar', sidebarOpen && 'open')}>
        <div className="sidebar-head">
          <div className="brand-lockup compact">
            <span className="brand-mark">
              <Home size={20} />
            </span>
            <div>
              <p className="eyebrow">NoamHome</p>
              <strong>Administration</strong>
            </div>
          </div>
          <button className="icon-button mobile-only" onClick={() => setSidebarOpen(false)} type="button">
            <X size={20} />
          </button>
        </div>

        <nav className="tab-list">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                className={clsx('tab-button', activeTab === tab.id && 'active')}
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                type="button"
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-user">
          <span className="avatar">{initials}</span>
          <div>
            <strong>{user.full_name || user.email}</strong>
            <span>{user.role === 'superadmin' ? 'Super admin' : 'Modération'}</span>
          </div>
        </div>
      </aside>

      {sidebarOpen ? <button className="scrim" onClick={() => setSidebarOpen(false)} type="button" /> : null}

      <main className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setSidebarOpen(true)} type="button">
            <Menu size={21} />
          </button>
          <div>
            <p className="eyebrow">Console</p>
            <h1>{tabs.find((tab) => tab.id === activeTab)?.label}</h1>
          </div>
          <button className="secondary-action" onClick={onLogout} type="button">
            <LogOut size={17} />
            Déconnexion
          </button>
        </header>
        {children}
      </main>
    </div>
  )
}

function Overview() {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadOverview = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/admin-panel/overview/')
      setOverview(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Impossible de charger le tableau de bord.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  if (loading) return <CenteredLoader label="Chargement des indicateurs" />
  if (error) return <ErrorPanel message={error} onRetry={loadOverview} />

  const stats = overview?.stats || {}
  const statCards = [
    { label: 'Utilisateurs', value: stats.users_total, detail: `${stats.hosts_total} hôtes`, icon: Users },
    { label: 'Hôtes à vérifier', value: stats.hosts_pending, detail: 'KYC et documents', icon: ShieldCheck },
    { label: 'Hébergements actifs', value: stats.establishments_active, detail: `${stats.establishments_pending} en attente`, icon: Building2 },
    { label: 'Réservations confirmées', value: stats.bookings_confirmed, detail: `${stats.bookings_total} au total`, icon: CalendarCheck },
    { label: 'Revenus encaissés', value: formatMoney(stats.revenue_total), detail: `${formatMoney(stats.revenue_month)} ce mois`, icon: CircleDollarSign },
    { label: 'Commission', value: formatMoney(stats.commission_total), detail: 'Réservations validées', icon: Star },
  ]

  return (
    <section className="stack">
      <div className="section-head">
        <div>
          <p className="eyebrow">Pilotage</p>
          <h2>Activité NoamHome</h2>
        </div>
        <button className="secondary-action" onClick={loadOverview} type="button">
          <RefreshCw size={16} />
          Actualiser
        </button>
      </div>

      <div className="stats-grid">
        {statCards.map((item) => {
          const Icon = item.icon
          return (
            <article className="stat-card" key={item.label}>
              <span className="stat-icon">
                <Icon size={20} />
              </span>
              <div>
                <p>{item.label}</p>
                <strong>{item.value ?? 0}</strong>
                <span>{item.detail}</span>
              </div>
            </article>
          )
        })}
      </div>

      <div className="two-columns">
        <SummaryList
          emptyLabel="Aucun hébergeur en attente"
          icon={ShieldCheck}
          items={overview.pending_hosts}
          title="Hôtes à vérifier"
          renderItem={(item) => (
            <>
              <strong>{item.company_name || item.user_name}</strong>
              <span>{item.user_email}</span>
              <Badge value={item.verification_status} />
            </>
          )}
        />
        <SummaryList
          emptyLabel="Aucun hébergement en attente"
          icon={Hotel}
          items={overview.pending_establishments}
          title="Hébergements à valider"
          renderItem={(item) => (
            <>
              <strong>{item.name}</strong>
              <span>{item.city}{item.quarter ? `, ${item.quarter}` : ''}</span>
              <Badge value={item.status} />
            </>
          )}
        />
      </div>

      <DataPanel title="Dernières réservations" icon={Clock}>
        <BookingTable rows={overview.recent_bookings || []} compact />
      </DataPanel>
    </section>
  )
}

function ResourceView({ resource }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')

  const loadRows = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(resourceEndpoints[resource], {
        params: {
          search: search || undefined,
          status: filter || undefined,
          role: resource === 'users' && filter ? filter : undefined,
        },
      })
      setRows(extractRows(data))
    } catch (err) {
      setError(err.response?.data?.detail || 'Chargement impossible.')
    } finally {
      setLoading(false)
    }
  }, [filter, resource, search])

  useEffect(() => {
    loadRows()
  }, [loadRows])

  const updateRow = async (path, payload) => {
    await api.patch(path, payload)
    await loadRows()
  }

  const filterOptions = {
    users: [
      ['guest', 'Voyageurs'],
      ['host', 'Hôtes'],
      ['moderator', 'Modérateurs'],
      ['superadmin', 'Super admins'],
    ],
    hosts: [
      ['pending', 'En attente'],
      ['under_review', 'En revue'],
      ['verified', 'Vérifiés'],
      ['rejected', 'Rejetés'],
    ],
    establishments: [
      ['pending', 'En attente'],
      ['active', 'Actifs'],
      ['suspended', 'Suspendus'],
      ['rejected', 'Rejetés'],
    ],
    bookings: [
      ['cart', 'Panier'],
      ['confirmed', 'Confirmées'],
      ['in_progress', 'En cours'],
      ['completed', 'Terminées'],
    ],
    payments: [
      ['pending', 'En attente'],
      ['processing', 'En cours'],
      ['succeeded', 'Réussis'],
      ['failed', 'Échoués'],
      ['refunded', 'Remboursés'],
    ],
  }

  return (
    <section className="stack">
      <div className="toolbar">
        <label className="search-box">
          <Search size={18} />
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher"
            type="search"
            value={search}
          />
        </label>
        <select onChange={(event) => setFilter(event.target.value)} value={filter}>
          <option value="">Tous les statuts</option>
          {(filterOptions[resource] || []).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button className="secondary-action" onClick={loadRows} type="button">
          <RefreshCw size={16} />
          Actualiser
        </button>
      </div>

      <DataPanel title={tabs.find((tab) => tab.id === resource)?.label} icon={tabs.find((tab) => tab.id === resource)?.icon}>
        {loading ? (
          <CenteredLoader label="Chargement" compact />
        ) : error ? (
          <ErrorPanel message={error} onRetry={loadRows} />
        ) : (
          <ResourceTable resource={resource} rows={rows} updateRow={updateRow} />
        )}
      </DataPanel>
    </section>
  )
}

function ResourceTable({ resource, rows, updateRow }) {
  if (!rows.length) {
    return <p className="empty-state">Aucune donnée trouvée.</p>
  }

  if (resource === 'users') {
    return (
      <Table
        headers={['Utilisateur', 'Rôle', 'Statut', 'Création', 'Actions']}
        rows={rows.map((row) => [
          <Identity key="user" title={row.full_name || row.email} subtitle={row.email} />,
          row.role_label || row.role,
          <Badge key="status" value={row.is_active ? 'active' : 'suspended'} />,
          formatDate(row.created_at),
          <button
            className="icon-button"
            key="action"
            onClick={() =>
              updateRow(`/admin-panel/users/${row.id}/`, { is_active: !row.is_active })
            }
            title={row.is_active ? 'Désactiver' : 'Activer'}
            type="button"
          >
            <Power size={17} />
          </button>,
        ])}
      />
    )
  }

  if (resource === 'hosts') {
    return (
      <Table
        headers={['Hôte', 'Entreprise', 'Vérification', 'Commission', 'Actions']}
        rows={rows.map((row) => [
          <Identity key="host" title={row.user_name} subtitle={row.user_email} />,
          row.company_name || 'Non renseigné',
          <Badge key="status" value={row.verification_status} />,
          row.commission_override_percent ? `${row.commission_override_percent}%` : 'Standard',
          <select
            key="action"
            onChange={(event) =>
              updateRow(`/admin-panel/hosts/${row.id}/`, {
                verification_status: event.target.value,
              })
            }
            value={row.verification_status}
          >
            <option value="pending">En attente</option>
            <option value="under_review">En revue</option>
            <option value="verified">Vérifié</option>
            <option value="rejected">Rejeté</option>
          </select>,
        ])}
      />
    )
  }

  if (resource === 'establishments') {
    return (
      <Table
        headers={['Hébergement', 'Hôte', 'Ville', 'Statut', 'Mise en avant']}
        rows={rows.map((row) => [
          <Identity key="establishment" title={row.name} subtitle={row.type_label || row.establishment_type} />,
          <Identity key="host" title={row.host_name} subtitle={row.host_email} />,
          row.quarter ? `${row.city}, ${row.quarter}` : row.city,
          <select
            key="status"
            onChange={(event) =>
              updateRow(`/admin-panel/establishments/${row.id}/`, {
                status: event.target.value,
              })
            }
            value={row.status}
          >
            <option value="pending">En attente</option>
            <option value="active">Actif</option>
            <option value="suspended">Suspendu</option>
            <option value="rejected">Rejeté</option>
          </select>,
          <button
            className={clsx('pill-toggle', row.is_featured && 'active')}
            key="featured"
            onClick={() =>
              updateRow(`/admin-panel/establishments/${row.id}/`, {
                is_featured: !row.is_featured,
              })
            }
            type="button"
          >
            {row.is_featured ? <CheckCircle2 size={16} /> : <Star size={16} />}
            {row.is_featured ? 'Oui' : 'Non'}
          </button>,
        ])}
      />
    )
  }

  if (resource === 'bookings') {
    return <BookingTable rows={rows} />
  }

  return (
    <Table
      headers={['Paiement', 'Client', 'Hébergement', 'Montant', 'Statut']}
      rows={rows.map((row) => [
        <Identity key="payment" title={row.booking_number} subtitle={row.method_label || row.payment_method} />,
        row.guest_email,
        row.establishment_name,
        formatMoney(row.amount),
        <Badge key="status" value={row.status} />,
      ])}
    />
  )
}

function BookingTable({ rows, compact = false }) {
  if (!rows.length) return <p className="empty-state">Aucune réservation trouvée.</p>

  return (
    <Table
      compact={compact}
      headers={['Réservation', 'Client', 'Séjour', 'Montant', 'Statut']}
      rows={rows.map((row) => [
        <Identity key="booking" title={row.booking_number} subtitle={row.establishment_name} />,
        row.guest_email || row.guest_name,
        `${formatDate(row.check_in_date)} - ${formatDate(row.check_out_date)}`,
        formatMoney(row.total_amount),
        <Badge key="status" value={row.status} />,
      ])}
    />
  )
}

function SummaryList({ emptyLabel, icon: Icon, items = [], renderItem, title }) {
  return (
    <DataPanel title={title} icon={Icon}>
      {items.length ? (
        <ul className="summary-list">
          {items.map((item) => (
            <li key={item.id}>{renderItem(item)}</li>
          ))}
        </ul>
      ) : (
        <p className="empty-state">{emptyLabel}</p>
      )}
    </DataPanel>
  )
}

function DataPanel({ children, icon: Icon = Activity, title }) {
  return (
    <article className="data-panel">
      <header>
        <span>
          <Icon size={18} />
        </span>
        <h3>{title}</h3>
      </header>
      {children}
    </article>
  )
}

function Table({ compact = false, headers, rows }) {
  return (
    <div className="table-wrap">
      <table className={clsx(compact && 'compact-table')}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={`${index}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Identity({ subtitle, title }) {
  return (
    <span className="identity">
      <strong>{title || 'Non défini'}</strong>
      <small>{subtitle || 'NoamHome'}</small>
    </span>
  )
}

function Badge({ value }) {
  const className = clsx(
    'badge',
    ['active', 'verified', 'confirmed', 'completed', 'succeeded'].includes(value) && 'success',
    ['pending', 'under_review', 'cart', 'processing'].includes(value) && 'warning',
    ['suspended', 'rejected', 'failed', 'cancelled_by_guest', 'cancelled_by_host'].includes(value) && 'danger',
  )

  return <span className={className}>{statusLabel(value)}</span>
}

function ErrorPanel({ message, onRetry }) {
  return (
    <div className="error-panel">
      <ShieldCheck size={20} />
      <span>{message}</span>
      {onRetry ? (
        <button className="secondary-action" onClick={onRetry} type="button">
          <RefreshCw size={16} />
          Réessayer
        </button>
      ) : null}
    </div>
  )
}

function CenteredLoader({ compact = false, label }) {
  return (
    <div className={clsx('centered-loader', compact && 'compact')}>
      <Loader2 className="spin" size={compact ? 22 : 30} />
      <span>{label}</span>
    </div>
  )
}
