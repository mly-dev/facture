import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/dashboard', icon: '◉', label: 'Tableau de bord' },
  { to: '/invoices', icon: '🧾', label: 'Factures' },
  { to: '/clients', icon: '👥', label: 'Clients' },
  { to: '/products', icon: '📦', label: 'Produits' },
  { to: '/settings', icon: '⚙️', label: 'Paramètres' },
]

export default function Sidebar() {
  const { company, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white font-bold text-lg">
            S
          </div>
          <div>
            <div className="text-white font-bold text-base leading-none">Sallah</div>
            <div className="text-gray-500 text-xs mt-0.5">Facturation PME</div>
          </div>
        </div>
      </div>

      {/* Company */}
      {company && (
        <div className="px-4 py-3 mx-3 mt-3 bg-gray-800 rounded-xl border border-gray-700">
          <div className="text-xs text-gray-400 mb-0.5">Entreprise</div>
          <div className="text-white text-sm font-semibold truncate">{company.name}</div>
          <div className="text-xs text-accent capitalize mt-0.5">{company.subscription_plan}</div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
              ${isActive
                ? 'bg-accent text-white shadow-lg shadow-accent/20'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-all"
        >
          <span className="text-base w-5 text-center">↩</span>
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
