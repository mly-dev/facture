import { useAuth } from '../contexts/AuthContext'

export default function Header({ title, actions }) {
  const { user, company } = useAuth()

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.email[0].toUpperCase()
    : '?'

  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-lg font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-3">
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-700">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-white leading-none">
              {user ? `${user.first_name} ${user.last_name}`.trim() || user.email : ''}
            </div>
            {company && <div className="text-xs text-gray-400 mt-0.5">{company.name}</div>}
          </div>
          <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent text-sm font-bold">
            {initials}
          </div>
        </div>
      </div>
    </header>
  )
}
