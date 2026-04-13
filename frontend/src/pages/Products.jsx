import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import Header from '../components/Header'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import { SkeletonTable } from '../components/SkeletonLoader'
import { productsApi } from '../api/products'
import { formatCurrency } from '../utils/formatCurrency'

const UNITS = [
  { value: 'piece', label: 'Pièce' },
  { value: 'heure', label: 'Heure' },
  { value: 'forfait', label: 'Forfait' },
  { value: 'kg', label: 'Kilogramme' },
  { value: 'litre', label: 'Litre' },
  { value: 'metre', label: 'Mètre' },
]

function ProductForm({ initial = {}, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    description: initial.description || '',
    unit_price: initial.unit_price || '',
    unit: initial.unit || 'piece',
    category: initial.category || '',
  })
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })
  const inputClass = "w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom *</label>
        <input required type="text" value={form.name} onChange={set('name')} className={inputClass} placeholder="Nom du produit/service" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Prix unitaire (FCFA) *</label>
          <input required type="number" min="0" step="1" value={form.unit_price} onChange={set('unit_price')}
            className={inputClass} placeholder="50000" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Unité</label>
          <select value={form.unit} onChange={set('unit')} className={inputClass}>
            {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Catégorie</label>
        <input type="text" value={form.category} onChange={set('category')} className={inputClass} placeholder="ex: Développement, Formation..." />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
        <textarea value={form.description} onChange={set('description')} rows={2}
          className={inputClass + ' resize-none'} placeholder="Description optionnelle" />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="flex-1 bg-accent hover:bg-accent-600 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60">
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors">
          Annuler
        </button>
      </div>
    </form>
  )
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchProducts = async (p = page, s = search) => {
    setLoading(true)
    try {
      const { data } = await productsApi.list({ page: p, search: s })
      setProducts(data.results || data)
      setCount(data.count || 0)
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts(1, search) }, [search])

  const handleSave = async (form) => {
    setSaving(true)
    try {
      if (editProduct) {
        await productsApi.update(editProduct.id, form)
        toast.success('Produit mis à jour')
      } else {
        await productsApi.create(form)
        toast.success('Produit créé')
      }
      setShowModal(false)
      setEditProduct(null)
      fetchProducts(page, search)
    } catch (err) {
      const msgs = Object.values(err.response?.data || {}).flat().join(' | ')
      toast.error(msgs || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Supprimer "${product.name}" ?`)) return
    try {
      await productsApi.delete(product.id)
      toast.success('Produit supprimé')
      fetchProducts(page, search)
    } catch {
      toast.error('Impossible de supprimer ce produit')
    }
  }

  const unitLabel = (v) => UNITS.find((u) => u.value === v)?.label || v

  return (
    <Layout>
      <Header
        title="Produits & Services"
        actions={
          <button
            onClick={() => { setEditProduct(null); setShowModal(true) }}
            className="bg-accent hover:bg-accent-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-lg shadow-accent/20"
          >
            + Nouveau produit
          </button>
        }
      />

      <div className="p-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Rechercher un produit..."
              className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Produit / Service</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Catégorie</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Unité</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Prix HT</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Prix TTC (18%)</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonTable rows={5} cols={6} />
                ) : products.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-500 text-sm">
                    {search ? 'Aucun produit trouvé' : 'Aucun produit — ajoutez votre catalogue'}
                  </td></tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="text-sm font-medium text-white">{p.name}</div>
                        {p.description && <div className="text-xs text-gray-500 truncate max-w-xs">{p.description}</div>}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-400">{p.category || '-'}</td>
                      <td className="px-5 py-3 text-sm text-gray-300">{unitLabel(p.unit)}</td>
                      <td className="px-5 py-3 text-sm text-gray-300 text-right">{formatCurrency(p.unit_price)}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-white text-right">
                        {formatCurrency(parseFloat(p.unit_price) * 1.18)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditProduct(p); setShowModal(true) }}
                            className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination count={count} page={page} onPageChange={(p) => { setPage(p); fetchProducts(p, search) }} />
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditProduct(null) }}
        title={editProduct ? 'Modifier le produit' : 'Nouveau produit'}
      >
        <ProductForm
          initial={editProduct || {}}
          onSave={handleSave}
          onCancel={() => { setShowModal(false); setEditProduct(null) }}
          loading={saving}
        />
      </Modal>
    </Layout>
  )
}
