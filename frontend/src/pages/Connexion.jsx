import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/ContexteAuth';
import { Mail, Lock, AlertCircle, Eye, EyeOff, Home } from 'lucide-react';

export default function Connexion() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);

  const destination = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (erreur) setErreur('');
  };

  const handleSoumission = async (e) => {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(destination, { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.detail) setErreur(data.detail);
      else if (data?.non_field_errors) setErreur(data.non_field_errors[0]);
      else setErreur('Email ou mot de passe incorrect.');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center bg-gradient-to-br from-noam-50 via-white to-or-50 px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-noam-600 to-noam-500 shadow-noam">
              <Home className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold">
              <span className="text-noam-600">Noam</span>
              <span className="text-gray-900">Home</span>
            </span>
          </Link>
        </div>

        <div className="carte p-8">
          <h1 className="text-2xl font-bold text-gray-900">Bon retour 👋</h1>
          <p className="mt-1 text-sm text-gray-500">Connectez-vous à votre compte NoamHome</p>

          {erreur && (
            <div className="alerte-erreur mt-5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{erreur}</span>
            </div>
          )}

          <form onSubmit={handleSoumission} className="mt-6 space-y-5" noValidate>
            {/* Email */}
            <div className="groupe-champ">
              <label htmlFor="email" className="label">Adresse email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="champ pl-10"
                  placeholder="vous@exemple.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="groupe-champ">
              <label htmlFor="password" className="label">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type={motDePasseVisible ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="champ pl-10 pr-11"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setMotDePasseVisible((v) => !v)}
                  tabIndex={-1}
                  aria-label={motDePasseVisible ? 'Masquer' : 'Afficher'}
                >
                  {motDePasseVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={chargement}
              className="btn-primaire w-full py-3 text-base"
            >
              {chargement ? (
                <>
                  <span className="spinner h-4 w-4 border-white border-t-transparent" />
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Pas encore de compte ?{' '}
            <Link to="/inscription" className="font-semibold text-noam-600 hover:text-noam-700 transition-colors">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
