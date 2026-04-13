import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import Header from '../components/Header'
import { invoicesApi } from '../api/invoices'
import { clientsApi } from '../api/clients'
import { productsApi } from '../api/products'
import { formatCurrency } from '../utils/formatCurrency'
import { todayISO, addDays } from '../utils/formatDate'

function LineRow({ item, index, products, onChange, onRemove }) {
  const handleProductSelect = (productId) => {
    const product = products.find((p) => String(p.id) === String(productId))
    if (product) {
      onChange(index, {
        ...item,
        product: product.id,
        description: product.name,
        unit_price: product.unit_price,
      })
    } else {
      onChange(index, { ...item, product: '' })
    }
  }

  const ht = parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)
  const tva = ht * parseFloat(item.tax_rate || 18) / 100
  const ttc = ht + tva

  return (
    <tr className="border-b border-gray-800">
      <td className="px-3 py-2 w-44">
        <select
          value={item.product || ''}
          onChange={(e) => handleProductSelect(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent transition-colors"
        >
          <option value="">— Libre —</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={item.description}
          onChange={(e) => onChange(index, { ...item, description: e.target.value })}
          placeholder="Description de la prestation"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent transition-colors"
          required
        />
      </td>
      <td className="px-3 py-2 w-24">
        <input
          type="number"
          value={item.quantity}
          min="0.01"
          step="0.01"
          onChange={(e) => onChange(index, { ...item, quantity: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white text-right focus:outline-none focus:border-accent transition-colors"
        />
      </td>
      <td className="px-3 py-2 w-32">
        <input
          type="number"
          value={item.unit_price}
          min="0"
          step="1"
          onChange={(e) => onChange(index, { ...item, unit_price: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white text-right focus:outline-none focus:border-accent transition-colors"
        />
      </td>
      <td className="px-3 py-2 w-20">
        <input
          type="number"
          value={item.tax_rate}
          min="0"
          max="100"
          step="0.5"
          onChange={(e) => onChange(index, { ...item, tax_rate: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white text-right focus:outline-none focus:border-accent transition-colors"
        />
      </td>
      <td className="px-3 py-2 w-36 text-right text-xs text-white font-medium">
        {formatCurrency(ttc)}
      </td>
      <td className="px-3 py-2 w-10 text-center">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:bg-red-900/30 hover:text-red-400 transition-colors mx-auto"
        >
          ×
        </button>
      </td>
    </tr>
  )
}

const newItem = () => ({
  product: '',
  description: '',
  quantity: 1,
  unit_price: 0,
  tax_rate: 18,
})

export default function InvoiceNew() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedClient = searchParams.get('client')

  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    client: preselectedClient || '',
    issue_date: todayISO(),
    due_date: addDays(todayISO(), 30),
    notes: '',
    status: 'brouillon',
  })
  const [items, setItems] = useState([newItem()])

  useEffect(() => {
    clientsApi.list({ page_size: 500 }).then(({ data }) => setClients(Array.isArray(data) ? data : (data.results || [])))
    productsApi.list({ page_size: 500 }).then(({ data }) => setProducts(Array.isArray(data) ? data : (data.results || [])))
  }, [])

  const updateItem = (index, updated) => {
    setItems((prev) => prev.map((item, i) => (i === index ? updated : item)))
  }
  const removeItem = (index) => {
    if (items.length === 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }
  const addItem = () => setItems((prev) => [...prev, newItem()])

  const totalHT = items.reduce((s, it) => s + parseFloat(it.quantity || 0) * parseFloat(it.unit_price || 0), 0)
  const totalTVA = items.reduce((s, it) => {
    const ht = parseFloat(it.quantity || 0) * parseFloat(it.unit_price || 0)
    return s + ht * parseFloat(it.tax_rate || 18) / 100
  }, 0)
  const totalTTC = totalHT + totalTVA

  const handleSubmit = async (e, submitStatus = 'brouillon') => {
    e.preventDefault()
    if (!form.client) { toast.error('Veuillez sélectionner un client'); return }
    if (items.some((it) => !it.description || !it.quantity || !it.unit_price)) {
      toast.error('Remplissez toutes les lignes de facturation')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        status: submitStatus,
        items: items.map((it) => ({
          ...(it.product ? { product: it.product } : {}),
          description: it.description,
          quantity: parseFloat(it.quantity),
          unit_price: parseFloat(it.unit_price),
          tax_rate: parseFloat(it.tax_rate),
        })),
      }
      const { data } = await invoicesApi.create(payload)
      toast.success('Facture créée avec succès')
      navigate(`/invoices/${data.id}`)
    } catch (err) {
      const msgs = Object.values(err.response?.data || {}).flat().join(' | ')
      toast.error(msgs || 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-sm"

  return (
    <Layout>
      <Header
        title="Nouvelle facture"
        actions={
          <Link to="/invoices" className="text-sm px-4 py-2 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors">
            ← Annuler
          </Link>
        }
      />

      <form className="p-6 space-y-6">
        {/* Info section */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">Informations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Client *</label>
              <select
                required
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                className={inputClass}
              >
                <option value="">Sélectionner un client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Date d'émission</label>
              <input type="date" value={form.issue_date}
                onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Date d'échéance</label>
              <input type="date" value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className={inputClass} />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Lignes de facturation</h2>
            <button
              type="button"
              onClick={addItem}
              className="text-xs px-3 py-1.5 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors font-medium"
            >
              + Ajouter une ligne
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/40">
                  <th className="px-3 py-2 text-left text-xs text-gray-400">Produit</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-400">Description *</th>
                  <th className="px-3 py-2 text-right text-xs text-gray-400">Qté</th>
                  <th className="px-3 py-2 text-right text-xs text-gray-400">Prix HT (FCFA)</th>
                  <th className="px-3 py-2 text-right text-xs text-gray-400">TVA %</th>
                  <th className="px-3 py-2 text-right text-xs text-gray-400">Total TTC</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <LineRow
                    key={index}
                    item={item}
                    index={index}
                    products={products}
                    onChange={updateItem}
                    onRemove={removeItem}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end p-5 border-t border-gray-800">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Total HT</span>
                <span className="text-white">{formatCurrency(totalHT)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>TVA</span>
                <span className="text-white">{formatCurrency(totalTVA)}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-white border-t border-gray-700 pt-2">
                <span>Total TTC</span>
                <span className="text-accent">{formatCurrency(totalTTC)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Notes</h2>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className={inputClass + ' resize-none'}
            placeholder="Conditions de paiement, notes spéciales..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'brouillon')}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-60"
          >
            Enregistrer brouillon
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'envoyee')}
            disabled={saving}
            className="bg-accent hover:bg-accent-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-lg shadow-accent/20 text-sm disabled:opacity-60"
          >
            {saving ? 'Création...' : 'Créer & Envoyer'}
          </button>
        </div>
      </form>
    </Layout>
  )
}
