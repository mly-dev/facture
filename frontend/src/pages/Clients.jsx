import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import Header from '../components/Header'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import { SkeletonTable } from '../components/SkeletonLoader'
import { clientsApi } from '../api/clients'
import { formatDate } from '../utils/formatDate'
import { formatCurrency } from '../utils/formatCurrency'

function ClientForm({ initial = {}, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    email: initial.email || '',
    phone: initial.phone || '',
    address: initial.address || '',
  })
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value })
  const inputClass = "w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom *</label>
        <input required type="text" value={form.name} onChange={set('name')} className={inputClass} placeholder="Nom du client" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
          <input type="email" value={form.email} onChange={set('email')} className={inputClass} placeholder="email@client.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Téléphone</label>
          <input type="text" value={form.phone} onChange={set('phone')} className={inputClass} placeholder="+227 XX XX XX XX" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Adresse</label>
        <textarea value={form.address} onChange={set('address')} rows={2}
          className={inputClass + ' resize-none'} placeholder="Adresse complète" />
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

export default function Clients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editClient, setEditClient] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchClients = async (p = page, s = search) => {
    setLoading(true)
    try {
      const { data } = await clientsApi.list({ page: p, search: s })
      setClients(data.results || data)
      setCount(data.count || 0)
    } catch {
      toast.error('Erreur lors du chargement des clients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchClients(1, search) }, [search])

  const handleSave = async (form) => {
    setSaving(true)
    try {
      if (editClient) {
        await clientsApi.update(editClient.id, form)
        toast.success('Client mis à jour')
      } else {
        await clientsApi.create(form)
        toast.success('Client créé')
      }
      setShowModal(false)
      setEditClient(null)
      fetchClients(page, search)
    } catch (err) {
      const msgs = Object.values(err.response?.data || {}).flat().join(' | ')
      toast.error(msgs || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (client) => {
    if (!window.confirm(`Supprimer "${client.name}" ?`)) return
    try {
      await clientsApi.delete(client.id)
      toast.success('Client supprimé')
      fetchClients(page, search)
    } catch {
      toast.error('Impossible de supprimer ce client (des factures y sont liées)')
    }
  }

  return (
    <Layout>
      <Header
        title="Clients"
        actions={
          <button
            onClick={() => { setEditClient(null); setShowModal(true) }}
            className="bg-accent hover:bg-accent-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-lg shadow-accent/20"
          >
            + Nouveau client
          </button>
        }
      />

      <div className="p-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-gray-800">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Rechercher un client..."
              className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Client</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Email</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Téléphone</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Factures</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Total facturé</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Depuis</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonTable rows={5} cols={7} />
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <div className="text-gray-500 text-sm">
                        {search ? 'Aucun client trouvé' : 'Aucun client — créez votre premier client'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <Link to={`/clients/${client.id}`} className="text-white font-medium hover:text-accent transition-colors text-sm">
                          {client.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-400">{client.email || '-'}</td>
                      <td className="px-5 py-3 text-sm text-gray-400">{client.phone || '-'}</td>
                      <td className="px-5 py-3 text-sm text-gray-300">{client.invoice_count}</td>
                      <td className="px-5 py-3 text-sm font-medium text-white">
                        {formatCurrency(client.total_invoiced)}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-400">{formatDate(client.created_at)}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditClient(client); setShowModal(true) }}
                            className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(client)}
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

          <Pagination count={count} page={page} onPageChange={(p) => { setPage(p); fetchClients(p, search) }} />
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditClient(null) }}
        title={editClient ? 'Modifier le client' : 'Nouveau client'}
      >
        <ClientForm
          initial={editClient || {}}
          onSave={handleSave}
          onCancel={() => { setShowModal(false); setEditClient(null) }}
          loading={saving}
        />
      </Modal>
    </Layout>
  )
}
