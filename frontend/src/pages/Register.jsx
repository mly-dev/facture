import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_address: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  })

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.register(form)
      await login(form.email, form.password)
      toast.success('Compte créé avec succès!')
      navigate('/dashboard')
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const msgs = Object.values(data).flat().join(' | ')
        toast.error(msgs || 'Erreur lors de la création du compte')
      } else {
        toast.error('Erreur réseau')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
  const labelClass = "block text-sm font-medium text-gray-300 mb-1.5"

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent mx-auto flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg shadow-accent/30">
            S
          </div>
          <h1 className="text-2xl font-bold text-white">Créer votre compte</h1>
          <p className="text-gray-400 mt-1">Commencez à facturer en quelques minutes</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company info */}
            <div>
              <h3 className="text-sm font-semibold text-accent uppercase tracking-wide mb-4">
                Informations entreprise
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Nom de l'entreprise *</label>
                  <input type="text" required value={form.company_name} onChange={set('company_name')}
                    className={inputClass} placeholder="Mon Entreprise SARL" />
                </div>
                <div>
                  <label className={labelClass}>Email entreprise *</label>
                  <input type="email" required value={form.company_email} onChange={set('company_email')}
                    className={inputClass} placeholder="contact@entreprise.ne" />
                </div>
                <div>
                  <label className={labelClass}>Téléphone</label>
                  <input type="text" value={form.company_phone} onChange={set('company_phone')}
                    className={inputClass} placeholder="+227 20 XX XX XX" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Adresse</label>
                  <input type="text" value={form.company_address} onChange={set('company_address')}
                    className={inputClass} placeholder="Niamey, Niger" />
                </div>
              </div>
            </div>

            {/* User info */}
            <div>
              <h3 className="text-sm font-semibold text-accent uppercase tracking-wide mb-4">
                Votre compte administrateur
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Prénom</label>
                  <input type="text" value={form.first_name} onChange={set('first_name')}
                    className={inputClass} placeholder="Moussa" />
                </div>
                <div>
                  <label className={labelClass}>Nom</label>
                  <input type="text" value={form.last_name} onChange={set('last_name')}
                    className={inputClass} placeholder="Ibrahim" />
                </div>
                <div>
                  <label className={labelClass}>Email *</label>
                  <input type="email" required value={form.email} onChange={set('email')}
                    className={inputClass} placeholder="vous@email.com" />
                </div>
                <div>
                  <label className={labelClass}>Mot de passe *</label>
                  <input type="password" required minLength={8} value={form.password} onChange={set('password')}
                    className={inputClass} placeholder="8 caractères minimum" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 shadow-lg shadow-accent/20"
            >
              {loading ? 'Création en cours...' : 'Créer mon compte gratuitement'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <span className="text-gray-400 text-sm">Déjà un compte ? </span>
            <Link to="/login" className="text-accent hover:text-accent-400 text-sm font-medium">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
