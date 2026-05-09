import { useState } from 'react';
import { useAuth } from '../context/ContexteAuth';
import { User, Mail, Phone, Save, AlertCircle, Loader, CheckCircle } from 'lucide-react';

export default function Profil() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await updateProfile(form);
      setSuccess(true);
    } catch (err) {
      setError('Erreur lors de la mise à jour du profil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>

      {error && (
        <div className="alerte-erreur mt-4">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="alerte-succes mt-4">
          <CheckCircle className="h-4 w-4 shrink-0" /> Profil mis à jour avec succès.
        </div>
      )}

      <form onSubmit={handleSubmit} className="carte mt-6 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="groupe-champ">
            <label htmlFor="profil-prenom" className="label">Prénom</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                id="profil-prenom"
                className="champ pl-10"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </div>
          </div>
          <div className="groupe-champ">
            <label htmlFor="profil-nom" className="label">Nom</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                id="profil-nom"
                className="champ pl-10"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="groupe-champ">
          <label htmlFor="profil-email" className="label">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              id="profil-email"
              type="email"
              disabled
              className="champ pl-10 bg-gray-50 text-gray-500 cursor-not-allowed"
              value={user?.email || ''}
            />
          </div>
        </div>

        <div className="groupe-champ">
          <label htmlFor="profil-tel" className="label">Téléphone</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              id="profil-tel"
              className="champ pl-10"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
        </div>

        <div className="groupe-champ">
          <label className="label">Rôle</label>
          <input
            disabled
            className="champ bg-gray-50 text-gray-500 capitalize cursor-not-allowed"
            value={user?.role === 'host' ? 'Hébergeur' : user?.role === 'guest' ? 'Voyageur' : user?.role || ''}
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primaire w-full py-3">
          {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </form>
    </div>
  );
}
