import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Phone, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { register, login } = useAuth();

  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    password_confirm: '',
    role: 'guest',
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (globalError) setGlobalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');

    // Validation côté client
    if (form.password !== form.password_confirm) {
      setErrors({ password_confirm: 'Les mots de passe ne correspondent pas.' });
      return;
    }

    setLoading(true);
    try {
      await register(form);
      setSuccess(true);

      // Auto-login après inscription réussie
      try {
        await login(form.email, form.password);
        navigate('/', { replace: true });
      } catch {
        // Si l'auto-login échoue, rediriger vers la page de connexion
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        // Erreurs par champ
        const fieldErrors = {};
        let hasFieldError = false;
        Object.entries(data).forEach(([key, val]) => {
          const msg = Array.isArray(val) ? val[0] : val;
          if (key === 'non_field_errors' || key === 'detail') {
            setGlobalError(msg);
          } else {
            fieldErrors[key] = msg;
            hasFieldError = true;
          }
        });
        if (hasFieldError) setErrors(fieldErrors);
      } else {
        setGlobalError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Compte créé !</h2>
          <p className="mt-2 text-gray-500">Connexion en cours...</p>
          <div className="mt-4 flex justify-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900">Créer un compte</h2>
        <p className="mt-1 text-sm text-gray-500">Rejoignez Reservation en quelques secondes</p>

        {globalError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{globalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          {/* Prénom / Nom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                Prénom
              </label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  id="first_name"
                  name="first_name"
                  required
                  autoComplete="given-name"
                  className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 ${
                    errors.first_name
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
                      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                  }`}
                  value={form.first_name}
                  onChange={handleChange}
                />
              </div>
              {errors.first_name && (
                <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>
              )}
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                Nom
              </label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  id="last_name"
                  name="last_name"
                  required
                  autoComplete="family-name"
                  className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 ${
                    errors.last_name
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
                      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                  }`}
                  value={form.last_name}
                  onChange={handleChange}
                />
              </div>
              {errors.last_name && (
                <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 ${
                  errors.email
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                }`}
                placeholder="vous@exemple.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          {/* Téléphone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Téléphone <span className="text-gray-400">(optionnel)</span>
            </label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="+225 07 XX XX XX XX"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Type de compte */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Type de compte
            </label>
            <select
              id="role"
              name="role"
              className="mt-1 w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={form.role}
              onChange={handleChange}
            >
              <option value="guest">Voyageur — je cherche un hébergement</option>
              <option value="host">Hébergeur — je propose un hébergement</option>
            </select>
          </div>

          {/* Mot de passe */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                className={`w-full rounded-lg border py-2 pl-9 pr-10 text-sm focus:outline-none focus:ring-1 ${
                  errors.password
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                }`}
                placeholder="8 caractères minimum"
                value={form.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Masquer' : 'Afficher'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>

          {/* Confirmation mot de passe */}
          <div>
            <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700">
              Confirmer le mot de passe
            </label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                id="password_confirm"
                name="password_confirm"
                type={showConfirm ? 'text' : 'password'}
                required
                autoComplete="new-password"
                className={`w-full rounded-lg border py-2 pl-9 pr-10 text-sm focus:outline-none focus:ring-1 ${
                  errors.password_confirm
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                }`}
                placeholder="••••••••"
                value={form.password_confirm}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirm((v) => !v)}
                tabIndex={-1}
                aria-label={showConfirm ? 'Masquer' : 'Afficher'}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password_confirm && (
              <p className="mt-1 text-xs text-red-600">{errors.password_confirm}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Création...
              </span>
            ) : (
              'Créer mon compte'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Déjà un compte ?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
