import { useState } from 'react'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import Header from '../components/Header'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../api/auth'

export default function Settings() {
  const { user, company, refreshCompany } = useAuth()

  const [companyForm, setCompanyForm] = useState({
    name: company?.name || '',
    email: company?.email || '',
    phone: company?.phone || '',
    address: company?.address || '',
  })
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(company?.logo || null)
  const [savingCompany, setSavingCompany] = useState(false)

  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
  })
  const [savingProfile, setSavingProfile] = useState(false)

  const inputClass = "w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-sm"
  const labelClass = "block text-sm font-medium text-gray-300 mb-1.5"

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setLogoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const saveCompany = async (e) => {
    e.preventDefault()
    setSavingCompany(true)
    try {
      const payload = { ...companyForm }
      if (logoFile) payload.logo = logoFile
      await authApi.updateCompany(payload)
      await refreshCompany()
      toast.success('Entreprise mise à jour')
    } catch (err) {
      const msgs = Object.values(err.response?.data || {}).flat().join(' | ')
      toast.error(msgs || 'Erreur lors de la mise à jour')
    } finally {
      setSavingCompany(false)
    }
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await authApi.updateProfile(profileForm)
      toast.success('Profil mis à jour')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <Layout>
      <Header title="Paramètres" />

      <div className="p-6 space-y-6 max-w-2xl">
        {/* Company settings */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-5">Informations entreprise</h2>

          {/* Logo */}
          <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-800">
            <div className="w-20 h-20 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-2xl font-bold text-accent">
                  {company?.name?.[0] || 'S'}
                </span>
              )}
            </div>
            <div>
              <label className="cursor-pointer">
                <span className="text-sm px-4 py-2 bg-gray-800 text-gray-300 rounded-xl border border-gray-700 hover:bg-gray-700 transition-colors cursor-pointer">
                  Changer le logo
                </span>
                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              </label>
              <p className="text-xs text-gray-500 mt-1.5">PNG, JPG, SVG — max 2MB</p>
            </div>
          </div>

          <form onSubmit={saveCompany} className="space-y-4">
            <div>
              <label className={labelClass}>Nom de l'entreprise</label>
              <input type="text" value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Téléphone</label>
                <input type="text" value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  className={inputClass} placeholder="+227 XX XX XX XX" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Adresse</label>
              <textarea value={companyForm.address}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                rows={2} className={inputClass + ' resize-none'} placeholder="Adresse complète" />
            </div>
            <div className="pt-2">
              <div className="text-xs text-gray-500 mb-1">Plan actuel</div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20 capitalize">
                {company?.subscription_plan}
              </span>
            </div>
            <button type="submit" disabled={savingCompany}
              className="bg-accent hover:bg-accent-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60 shadow-lg shadow-accent/20 text-sm">
              {savingCompany ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </form>
        </div>

        {/* Profile */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-5">Mon profil</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Prénom</label>
                <input type="text" value={profileForm.first_name}
                  onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nom</label>
                <input type="text" value={profileForm.last_name}
                  onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                  className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={user?.email || ''} disabled
                className={inputClass + ' opacity-50 cursor-not-allowed'} />
              <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
            </div>
            <button type="submit" disabled={savingProfile}
              className="bg-accent hover:bg-accent-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm">
              {savingProfile ? 'Enregistrement...' : 'Mettre à jour le profil'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
