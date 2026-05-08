import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Mail, Lock, User, Phone, AlertCircle, CheckCircle } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    password_confirm: '',
    role: 'guest',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/accounts/register/', form);
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data;
      if (msg && typeof msg === 'object') {
        setError(Object.values(msg).flat().join(' '));
      } else {
        setError(err.response?.data?.detail || 'Une erreur est survenue.');
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
          <p className="mt-2 text-gray-500">Vous pouvez maintenant vous connecter.</p>
          <button onClick={() => navigate('/login')} className="btn-primary mt-6 w-full">
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900">Créer un compte</h2>
        <p className="mt-1 text-sm text-gray-500">Rejoignez AfriStay en quelques secondes</p>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Prénom</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input required className="w-full rounded-lg border-gray-300 pl-9 text-sm focus:border-primary-500 focus:ring-primary-500"
                  value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input required className="w-full rounded-lg border-gray-300 pl-9 text-sm focus:border-primary-500 focus:ring-primary-500"
                  value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input type="email" required className="w-full rounded-lg border-gray-300 pl-9 text-sm focus:border-primary-500 focus:ring-primary-500"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Téléphone</label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input type="tel" className="w-full rounded-lg border-gray-300 pl-9 text-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="+225 07 XX XX XX XX"
                value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Type de compte</label>
            <select className="mt-1 w-full rounded-lg border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
              value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="guest">Voyageur</option>
              <option value="host">Hébergeur</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input type="password" required className="w-full rounded-lg border-gray-300 pl-9 text-sm focus:border-primary-500 focus:ring-primary-500"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input type="password" required className="w-full rounded-lg border-gray-300 pl-9 text-sm focus:border-primary-500 focus:ring-primary-500"
                value={form.password_confirm} onChange={(e) => setForm({ ...form, password_confirm: e.target.value })} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Création...' : "Créer mon compte"}
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
