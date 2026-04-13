import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import { clientsApi } from '../api/clients'
import { invoicesApi } from '../api/invoices'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      clientsApi.get(id),
      invoicesApi.list({ client: id, page_size: 50 }),
    ]).then(([cRes, iRes]) => {
      setClient(cRes.data)
      setInvoices(iRes.data.results || iRes.data)
    }).catch(() => {
      toast.error('Erreur de chargement')
      navigate('/clients')
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <Layout>
        <Header title="Fiche client" />
        <div className="p-6 flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  const totalInvoiced = invoices.reduce((s, i) => s + parseFloat(i.total_ttc || 0), 0)
  const totalPaid = invoices.reduce((s, i) => s + parseFloat(i.total_paid || 0), 0)

  return (
    <Layout>
      <Header
        title={client?.name || 'Client'}
        actions={
          <div className="flex gap-2">
            <Link to="/clients" className="text-sm px-4 py-2 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors">
              ← Retour
            </Link>
            <Link
              to={`/invoices/new?client=${id}`}
              className="bg-accent hover:bg-accent-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              + Nouvelle facture
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client info */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Informations</h2>
            <div className="space-y-3">
              {[
                { label: 'Nom', value: client?.name },
                { label: 'Email', value: client?.email || '-' },
                { label: 'Téléphone', value: client?.phone || '-' },
                { label: 'Adresse', value: client?.address || '-' },
                { label: 'Client depuis', value: formatDate(client?.created_at) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-xs text-gray-500 mb-0.5">{label}</div>
                  <div className="text-sm text-gray-200">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {[
              { label: 'Total facturé', value: formatCurrency(totalInvoiced), color: 'text-white' },
              { label: 'Total encaissé', value: formatCurrency(totalPaid), color: 'text-green-400' },
              { label: 'Reste à payer', value: formatCurrency(totalInvoiced - totalPaid), color: 'text-yellow-400' },
              { label: 'Nb. factures', value: invoices.length, color: 'text-accent' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">{label}</div>
                <div className={`text-xl font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoices */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="text-base font-semibold text-white">Factures ({invoices.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">N°</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Échéance</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Statut</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Montant</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Payé</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-500 text-sm">Aucune facture</td></tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <Link to={`/invoices/${inv.id}`} className="text-accent hover:underline text-sm font-medium">
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-400">{formatDate(inv.issue_date)}</td>
                      <td className="px-5 py-3 text-sm text-gray-400">{formatDate(inv.due_date)}</td>
                      <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                      <td className="px-5 py-3 text-sm font-semibold text-white text-right">{formatCurrency(inv.total_ttc)}</td>
                      <td className="px-5 py-3 text-sm text-green-400 text-right">{formatCurrency(inv.total_paid)}</td>
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
