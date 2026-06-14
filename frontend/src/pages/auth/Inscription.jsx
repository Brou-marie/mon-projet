import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, UserPlus, Building2, Check } from 'lucide-react'
import { useAuth } from '../../contextes/AuthContexte'

const AVANTAGES = {
  guest: [
    'Réservez parmi des centaines d\'hébergements',
    'Paiement Wave, Orange Money, MTN',
    'Historique complet de vos séjours',
    'Programme de fidélité et points',
  ],
  host: [
    'Publiez vos hébergements gratuitement',
    'Gérez les réservations en temps réel',
    'Tableau de bord revenus et stats',
    'Paiements rapides et sécurisés',
  ],
}

export function PageInscription() {
  const [role, setRole]           = useState('guest')
  const [visiblePwd, setVisible]  = useState(false)
  const [erreur, setErreur]       = useState(null)
  const { inscrire, chargement }  = useAuth()
  const navigate                  = useNavigate()

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    password: '', password_confirm: '',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setErreur(null)
    if (form.password !== form.password_confirm) {
      setErreur('Les mots de passe ne correspondent pas.')
      return
    }
    if (form.password.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    try {
      await inscrire({ ...form, role })
      navigate(role === 'host' ? '/hebergeur/tableau-de-bord' : '/voyageur/tableau-de-bord', { replace: true })
    } catch (err) {
      const d = err.details
      if (d && typeof d === 'object') {
        const msgs = Object.entries(d).map(([, v]) => Array.isArray(v) ? v.join(', ') : v).join(' | ')
        setErreur(msgs)
      } else {
        setErreur(err.message || "Erreur lors de l'inscription.")
      }
    }
  }

  const estVoyageur = role === 'guest'
  const force = form.password
    ? [form.password.length >= 8, /[A-Z]/.test(form.password), /[0-9]/.test(form.password)].filter(Boolean).length
    : 0
  const couleurForce = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-500'][force] || ''

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl">
            <span className="bg-primary-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black">NH</span>
            <span className="text-gray-900">Noam<span className="text-primary-600">Home</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-5">Créer votre compte</h1>
          <p className="text-gray-500 text-sm mt-1">
            Déjà inscrit ?{' '}
            <Link to="/connexion" className="text-primary-600 hover:text-primary-700 font-semibold">Se connecter</Link>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── Sélection rôle + avantages ── */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Je suis...</p>

            {[
              { val: 'guest', label: 'Voyageur', desc: 'Je cherche un hébergement', couleurActif: 'border-primary-500 bg-primary-50', couleurBadge: 'bg-primary-600' },
              { val: 'host',  label: 'Hébergeur', desc: 'Je propose un hébergement', couleurActif: 'border-emerald-500 bg-emerald-50', couleurBadge: 'bg-emerald-600' },
            ].map(({ val, label, desc, couleurActif, couleurBadge }) => (
              <button
                key={val}
                type="button"
                onClick={() => setRole(val)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${role === val ? couleurActif : 'border-gray-200 bg-white hover:border-gray-300'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${role === val ? couleurBadge : 'bg-gray-200'}`}>
                    {val === 'guest' ? <UserPlus className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                  {role === val && (
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${couleurBadge}`}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}

            {/* Avantages */}
            <div className={`rounded-2xl p-4 mt-2 ${estVoyageur ? 'bg-blue-50' : 'bg-emerald-50'}`}>
              <p className={`text-xs font-bold mb-2 ${estVoyageur ? 'text-blue-700' : 'text-emerald-700'}`}>
                Ce que vous obtenez
              </p>
              <ul className="space-y-1.5">
                {AVANTAGES[role].map((a) => (
                  <li key={a} className="flex items-start gap-2 text-xs text-gray-600">
                    <Check className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${estVoyageur ? 'text-blue-500' : 'text-emerald-500'}`} />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Formulaire ── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">

              {erreur && (
                <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <span className="flex-shrink-0 mt-0.5">⚠</span>
                  <span>{erreur}</span>
                </div>
              )}

              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label" htmlFor="prenom">Prénom *</label>
                    <input id="prenom" type="text" value={form.first_name} onChange={e => set('first_name', e.target.value)} required autoComplete="given-name" className="input" placeholder="Orsini" />
                  </div>
                  <div>
                    <label className="label" htmlFor="nom">Nom *</label>
                    <input id="nom" type="text" value={form.last_name} onChange={e => set('last_name', e.target.value)} required autoComplete="family-name" className="input" placeholder="Ouattara" />
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="email-insc">Email *</label>
                  <input id="email-insc" type="email" value={form.email} onChange={e => set('email', e.target.value)} required autoComplete="email" className="input" placeholder="vous@gmail.com" />
                </div>

                <div>
                  <label className="label" htmlFor="tel">Téléphone</label>
                  <input id="tel" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} autoComplete="tel" className="input" placeholder="+225 07 00 00 00 00" />
                </div>

                <div>
                  <label className="label" htmlFor="pwd">Mot de passe *</label>
                  <div className="relative">
                    <input
                      id="pwd"
                      type={visiblePwd ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      required minLength={8}
                      autoComplete="new-password"
                      className="input pr-11"
                      placeholder="Minimum 8 caractères"
                    />
                    <button type="button" onClick={() => setVisible(!visiblePwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                      {visiblePwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex gap-1 flex-1">
                        {[0,1,2].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < force ? couleurForce : 'bg-gray-200'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">{['','Faible','Moyen','Fort'][force]}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="label" htmlFor="pwd2">Confirmer le mot de passe *</label>
                  <input
                    id="pwd2"
                    type="password"
                    value={form.password_confirm}
                    onChange={e => set('password_confirm', e.target.value)}
                    required
                    autoComplete="new-password"
                    className={`input ${form.password_confirm && form.password !== form.password_confirm ? 'border-red-300 focus:ring-red-400' : ''}`}
                    placeholder="Répétez le mot de passe"
                  />
                  {form.password_confirm && form.password !== form.password_confirm && (
                    <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={chargement || !form.email || !form.first_name || !form.last_name || form.password.length < 8 || form.password !== form.password_confirm}
                  className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white mt-2 ${estVoyageur ? 'bg-primary-600 hover:bg-primary-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                  {chargement
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Inscription...</>
                    : <><UserPlus className="w-4 h-4" /> Créer mon compte {estVoyageur ? 'voyageur' : 'hébergeur'}</>
                  }
                </button>

                <p className="text-xs text-gray-400 text-center">
                  En vous inscrivant, vous acceptez nos conditions d'utilisation.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
