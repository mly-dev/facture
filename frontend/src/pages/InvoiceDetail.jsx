import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { invoicesApi } from '../api/invoices'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'

const METHOD_LABELS = {
  orange_money: 'Orange Money',
  airtel_money: 'Airtel Money',
  virement: 'Virement bancaire',
  especes: 'Espèces',
  carte: 'Carte bancaire',
  cheque: 'Chèque',
}

function PaymentModal({ invoice, onClose, onSaved }) {
  const balance = parseFloat(invoice.balance_due) > 0
    ? parseFloat(invoice.balance_due)
    : parseFloat(invoice.total_ttc)

  const [form, setForm] = useState({
    amount: balance,
    payment_date: new Date().toISOString().split('T')[0],
    method: 'orange_money',
    reference: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  const inputClass = "w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-sm"

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await invoicesApi.addPayment(invoice.id, form)
      toast.success('Paiement enregistré')
      onSaved()
      onClose()
    } catch (err) {
      const msgs = Object.values(err.response?.data || {}).flat().join(' | ')
      toast.error(msgs || "Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="bg-gray-800/50 rounded-xl p-3 text-sm text-gray-300">
        Reste à payer :&nbsp;
        <span className="text-accent font-bold text-base">
          {formatCurrency(invoice.balance_due)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Montant (FCFA) *</label>
          <input
            required type="number" min="1" step="1"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Date *</label>
          <input
            required type="date"
            value={form.payment_date}
            onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Mode de paiement *</label>
        <select
          required value={form.method}
          onChange={(e) => setForm({ ...form, method: e.target.value })}
          className={inputClass}
        >
          {Object.entries(METHOD_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Référence</label>
        <input
          type="text" value={form.reference}
          onChange={(e) => setForm({ ...form, reference: e.target.value })}
          className={inputClass} placeholder="N° transaction, chèque..."
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit" disabled={saving}
          className="flex-1 bg-accent hover:bg-accent-600 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer le paiement'}
        </button>
        <button
          type="button" onClick={onClose}
          className="px-4 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors text-sm"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchInvoice = async () => {
    try {
      const { data } = await invoicesApi.get(id)
      setInvoice(data)
    } catch {
      toast.error('Facture introuvable')
      navigate('/invoices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInvoice() }, [id])

  const handleSend = async () => {
    setActionLoading(true)
    try {
      const { data } = await invoicesApi.send(id)
      setInvoice(data)
      toast.success('Facture marquée comme envoyée')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Annuler cette facture ? Cette action est irréversible.')) return
    setActionLoading(true)
    try {
      const { data } = await invoicesApi.cancel(id)
      setInvoice(data)
      toast.success('Facture annulée')
    } catch {
      toast.error('Erreur lors de l\'annulation')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Supprimer ce paiement ?')) return
    try {
      const { data } = await invoicesApi.deletePayment(id, paymentId)
      setInvoice(data)
      toast.success('Paiement supprimé')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handlePDF = () => {
    const token = localStorage.getItem('access_token')
    const url = invoicesApi.pdfUrl(id)
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.blob()
      })
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob)
        window.open(blobUrl, '_blank')
      })
      .catch(() => toast.error('Erreur lors de la génération du PDF'))
  }

  if (loading) {
    return (
      <Layout>
        <Header title="Facture" />
        <div className="p-6 flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  const canSend = invoice?.status === 'brouillon'
  const canPay = ['envoyee', 'partielle'].includes(invoice?.status)
  const canCancel = !['annulee', 'payee'].includes(invoice?.status)
  const canDeletePayments = !['annulee'].includes(invoice?.status)

  return (
    <Layout>
      <Header
        title={invoice?.invoice_number || 'Facture'}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/invoices"
              className="text-sm px-3 py-2 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              ← Retour
            </Link>
            <button
              onClick={handlePDF}
              className="text-sm px-3 py-2 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              📄 PDF
            </button>
            {canSend && (
              <button
                onClick={handleSend}
                disabled={actionLoading}
                className="text-sm px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-60"
              >
                Marquer envoyée
              </button>
            )}
            {canPay && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="text-sm px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
              >
                + Paiement
              </button>
            )}
            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="text-sm px-3 py-2 rounded-xl bg-red-900/40 text-red-400 hover:bg-red-900/60 transition-colors disabled:opacity-60"
              >
                Annuler
              </button>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Header cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status / dates */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Statut</div>
              <StatusBadge status={invoice.status} />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">N° Facture</div>
              <div className="text-sm font-semibold text-white">{invoice.invoice_number}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Date d'émission</div>
              <div className="text-sm text-gray-300">{formatDate(invoice.issue_date)}</div>
            </div>
            {invoice.due_date && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Échéance</div>
                <div className="text-sm text-gray-300">{formatDate(invoice.due_date)}</div>
              </div>
            )}
          </div>

          {/* Client */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="text-xs text-gray-500 mb-2">Client</div>
            <div className="text-base font-semibold text-white mb-1">
              {invoice.client_detail?.name}
            </div>
            <div className="text-sm text-gray-400 space-y-0.5">
              {invoice.client_detail?.email && <div>{invoice.client_detail.email}</div>}
              {invoice.client_detail?.phone && <div>{invoice.client_detail.phone}</div>}
              {invoice.client_detail?.address && (
                <div className="text-xs">{invoice.client_detail.address}</div>
              )}
            </div>
            <Link
              to={`/clients/${invoice.client}`}
              className="text-xs text-accent hover:underline mt-2 inline-block"
            >
              Voir la fiche client →
            </Link>
          </div>

          {/* Totals */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total HT</span>
              <span className="text-white font-medium">{formatCurrency(invoice.total_ht)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">TVA</span>
              <span className="text-white font-medium">{formatCurrency(invoice.total_tva)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-gray-700 pt-3">
              <span className="text-gray-200">Total TTC</span>
              <span className="text-accent">{formatCurrency(invoice.total_ttc)}</span>
            </div>
            {parseFloat(invoice.total_paid) > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-green-400">Déjà payé</span>
                  <span className="text-green-400 font-medium">{formatCurrency(invoice.total_paid)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-yellow-400">Reste à payer</span>
                  <span className="text-yellow-400">{formatCurrency(invoice.balance_due)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-white">Détail des prestations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/30">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Description</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Qté</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Prix HT</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">TVA</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Total HT</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Total TTC</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800/50">
                    <td className="px-5 py-3 text-sm text-white">{item.description}</td>
                    <td className="px-5 py-3 text-sm text-gray-300 text-right">{item.quantity}</td>
                    <td className="px-5 py-3 text-sm text-gray-300 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="px-5 py-3 text-sm text-gray-300 text-right">{item.tax_rate}%</td>
                    <td className="px-5 py-3 text-sm text-gray-300 text-right">{formatCurrency(item.total_ht)}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-white text-right">{formatCurrency(item.total_ttc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payments */}
        {invoice.payments?.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Paiements reçus ({invoice.payments.length})
              </h2>
              {canPay && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="text-xs px-3 py-1.5 bg-green-900/30 text-green-400 rounded-lg hover:bg-green-900/50 transition-colors"
                >
                  + Ajouter
                </button>
              )}
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Mode</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Référence</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Montant</th>
                  {canDeletePayments && (
                    <th className="px-5 py-3 w-16" />
                  )}
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                    <td className="px-5 py-3 text-sm text-gray-300">{formatDate(p.payment_date)}</td>
                    <td className="px-5 py-3 text-sm text-gray-300">{METHOD_LABELS[p.method] || p.method}</td>
                    <td className="px-5 py-3 text-sm text-gray-400">{p.reference || '—'}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-green-400 text-right">
                      {formatCurrency(p.amount)}
                    </td>
                    {canDeletePayments && (
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => handleDeletePayment(p.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none"
                          title="Supprimer ce paiement"
                        >
                          ×
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-2">Notes</h2>
            <p className="text-sm text-gray-400 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Enregistrer un paiement"
      >
        {invoice && (
          <PaymentModal
            invoice={invoice}
            onClose={() => setShowPaymentModal(false)}
            onSaved={fetchInvoice}
          />
        )}
      </Modal>
    </Layout>
  )
}
