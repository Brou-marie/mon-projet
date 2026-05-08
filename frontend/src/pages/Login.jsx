import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900">Connexion</h2>
        <p className="mt-1 text-sm text-gray-500">Accédez à votre compte AfriStay</p>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="email"
                required
                className="w-full rounded-lg border-gray-300 pl-9 text-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="vous@exemple.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="password"
                required
                className="w-full rounded-lg border-gray-300 pl-9 text-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
