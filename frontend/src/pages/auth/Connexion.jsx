import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react'
import { useAuth } from '../../contextes/AuthContexte'

export function PageConnexion() {
  const [email, setEmail]           = useState('')
  const [mdp, setMdp]               = useState('')
  const [visible, setVisible]       = useState(false)
  const [erreur, setErreur]         = useState(null)
  const { connecter, chargement }   = useAuth()
  const navigate                    = useNavigate()
  const location                    = useLocation()
  const depuis                      = location.state?.depuis || null

  const submit = async (e) => {
    e.preventDefault()
    setErreur(null)
    try {
      const user = await connecter(email, mdp)
      if (user.role === 'superadmin' || user.role === 'moderator') {
        window.location.href = 'http://localhost:8000/admin/'
        return
      }
      const dest = depuis || (user.role === 'host' ? '/hebergeur/tableau-de-bord' : '/voyageur/tableau-de-bord')
      navigate(dest, { replace: true })
    } catch (err) {
      setErreur(err.message || 'Email ou mot de passe incorrect.')
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl">

            <span className="text-gray-900">Noam<span className="text-primary-600">Home</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-6">Connexion</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Pas encore de compte ?{' '}
            <Link to="/inscription" className="text-primary-600 hover:text-primary-700 font-semibold">
              S'inscrire
            </Link>
          </p>
        </div>

        {/* Carte */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* Message d'erreur */}
          {erreur && (
            <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <span className="mt-0.5">⚠</span>
              <span>{erreur}</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="label" htmlFor="email">Adresse email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                className="input"
                placeholder="vous@exemple.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0" htmlFor="mdp">Mot de passe</label>
              </div>
              <div className="relative">
                <input
                  id="mdp"
                  type={visible ? 'text' : 'password'}
                  value={mdp}
                  onChange={(e) => setMdp(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="input pr-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setVisible(!visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={chargement || !email || !mdp}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {chargement
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Connexion...</>
                : <><LogIn className="w-5 h-5" /> Se connecter</>
              }
            </button>
          </form>

          {/* Comptes de démonstration */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">Comptes de test</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { email: 'voyageur@test.com', mdp: 'noamhome123', label: 'Voyageur', couleur: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                { email: 'hebergeur@test.com', mdp: 'noamhome123', label: 'Hébergeur', couleur: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
              ].map((c) => (
                <button
                  key={c.email}
                  type="button"
                  onClick={() => { setEmail(c.email); setMdp(c.mdp) }}
                  className={`text-xs font-medium px-3 py-2 rounded-lg transition-colors ${c.couleur}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
