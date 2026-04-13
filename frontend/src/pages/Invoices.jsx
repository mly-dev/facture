import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import Header from '../components/Header'
import Pagination from '../components/Pagination'
import StatusBadge from '../components/StatusBadge'
import { SkeletonTable } from '../components/SkeletonLoader'
import { invoicesApi } from '../api/invoices'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'envoyee', label: 'Envoyée' },
  { value: 'payee', label: 'Payée' },
  { value: 'partielle', label: 'Part. payée' },
  { value: 'annulee', label: 'Annulée' },
]

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)

  const fetchInvoices = async (p = page, s = search, st = status) => {
    setLoading(true)
    try {
      const params = { page: p }
      if (s) params.search = s
      if (st) params.status = st
      const { data } = await invoicesApi.list(params)
      setInvoices(data.results || data)
      setCount(data.count || 0)
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInvoices(1, search, status) }, [search, status])

  const handleDelete = async (inv) => {
    if (inv.status !== 'brouillon') {
      toast.error('Seuls les brouillons peuvent être supprimés')
      return
    }
    if (!window.confirm(`Supprimer la facture ${inv.invoice_number} ?`)) return
    try {
      await invoicesApi.delete(inv.id)
      toast.success('Facture supprimée')
      fetchInvoices(page, search, status)
    } catch {
      toast.error('Impossible de supprimer')
    }
  }

  const selectClass = "bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent transition-colors"

  return (
    <Layout>
      <Header
        title="Factures"
        actions={
          <Link
            to="/invoices/new"
            className="bg-accent hover:bg-accent-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-lg shadow-accent/20"
          >
            + Nouvelle facture
          </Link>
        }
      />

      <div className="p-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-gray-800 flex flex-wrap gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Rechercher..."
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors w-56"
            />
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className={selectClass}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">N° Facture</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Client</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Échéance</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Statut</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Total TTC</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Payé</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonTable rows={7} cols={8} />
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <p className="text-gray-500 text-sm">Aucune facture trouvée</p>
                      <Link to="/invoices/new" className="text-accent text-sm hover:underline mt-2 block">
                        Créer votre première facture →
                      </Link>
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <Link to={`/invoices/${inv.id}`} className="text-accent hover:underline text-sm font-medium">
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-300">{inv.client_name}</td>
                      <td className="px-5 py-3 text-sm text-gray-400">{formatDate(inv.issue_date)}</td>
                      <td className="px-5 py-3 text-sm text-gray-400">{formatDate(inv.due_date)}</td>
                      <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                      <td className="px-5 py-3 text-sm font-semibold text-white text-right">
                        {formatCurrency(inv.total_ttc)}
                      </td>
                      <td className="px-5 py-3 text-sm text-green-400 text-right">
                        {formatCurrency(inv.total_paid)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/invoices/${inv.id}`}
                            className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                          >
                            Voir
                          </Link>
                          {inv.status === 'brouillon' && (
                            <button
                              onClick={() => handleDelete(inv)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
                            >
                              Suppr.
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination count={count} page={page} onPageChange={(p) => { setPage(p); fetchInvoices(p, search, status) }} />
        </div>
      </div>
    </Layout>
  )
}
