import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import Layout from '../components/Layout'
import Header from '../components/Header'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import { SkeletonCard } from '../components/SkeletonLoader'
import { dashboardApi } from '../api/dashboard'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 shadow-xl">
      <p className="text-gray-300 text-xs mb-2 font-medium">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="text-sm font-semibold">
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.stats().then(({ data }) => {
      setStats(data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <Layout>
      <Header title="Tableau de bord" />

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard
                title="Total facturé (ce mois)"
                value={formatCurrency(stats?.month_total || 0)}
                icon="🧾"
                color="accent"
                subtitle={`${stats?.invoice_count || 0} factures au total`}
              />
              <StatCard
                title="Encaissé (ce mois)"
                value={formatCurrency(stats?.month_paid || 0)}
                icon="✅"
                color="green"
                subtitle="Paiements reçus"
              />
              <StatCard
                title="En attente"
                value={formatCurrency(stats?.total_pending || 0)}
                icon="⏳"
                color="yellow"
                subtitle="À encaisser"
              />
              <StatCard
                title="En retard"
                value={`${stats?.overdue_count || 0} facture${stats?.overdue_count > 1 ? 's' : ''}`}
                icon="⚠️"
                color="red"
                subtitle="Échéance dépassée"
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white mb-5">
              Évolution sur 6 mois
            </h2>
            {loading ? (
              <div className="h-64 bg-gray-800 rounded-xl animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats?.monthly_data || []} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis
                    dataKey="month_short"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(108,99,255,0.08)' }} />
                  <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                  <Bar dataKey="total" name="Facturé" fill="#6C63FF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="paid" name="Encaissé" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Status breakdown */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white mb-4">Répartition statuts</h2>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 bg-gray-800 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  { key: 'payee', label: 'Payées', color: 'bg-green-500' },
                  { key: 'envoyee', label: 'Envoyées', color: 'bg-blue-500' },
                  { key: 'partielle', label: 'Part. payées', color: 'bg-yellow-500' },
                  { key: 'brouillon', label: 'Brouillons', color: 'bg-gray-500' },
                  { key: 'annulee', label: 'Annulées', color: 'bg-red-500' },
                ].map(({ key, label, color }) => {
                  const count = stats?.status_counts?.[key] || 0
                  const total = stats?.invoice_count || 1
                  const pct = Math.round((count / total) * 100)
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{label}</span>
                        <span>{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full">
                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Top clients */}
            {!loading && stats?.top_clients?.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-800">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Top clients</h3>
                <div className="space-y-2">
                  {stats.top_clients.slice(0, 3).map((c) => (
                    <div key={c.id} className="flex justify-between items-center">
                      <span className="text-sm text-gray-300 truncate max-w-[140px]">{c.name}</span>
                      <span className="text-xs text-accent font-medium">{formatCurrency(c.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent invoices */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="text-base font-semibold text-white">Dernières factures</h2>
            <Link to="/invoices" className="text-sm text-accent hover:text-accent-400 transition-colors">
              Voir tout →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">N°</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Client</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Statut</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Montant</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-gray-800/50">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-5 py-3">
                          <div className="h-4 bg-gray-800 rounded w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : stats?.recent_invoices?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                      Aucune facture pour le moment
                    </td>
                  </tr>
                ) : (
                  stats?.recent_invoices?.map((inv) => (
                    <tr key={inv.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <Link to={`/invoices/${inv.id}`} className="text-accent hover:underline text-sm font-medium">
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-300">{inv.client_name}</td>
                      <td className="px-5 py-3 text-sm text-gray-400">{formatDate(inv.issue_date)}</td>
                      <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                      <td className="px-5 py-3 text-sm font-semibold text-white text-right">
                        {formatCurrency(inv.total_ttc)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
