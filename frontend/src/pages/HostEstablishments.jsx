import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../api/client';
import { Hotel, Plus, Edit, Eye, Loader, MapPin, Star } from 'lucide-react';

export default function HostEstablishments() {
  const { data: establishments, isLoading, refetch } = useQuery(
    'myEstablishments',
    async () => {
      const { data } = await api.get('/establishments/my_establishments/');
      return data;
    }
  );

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    establishment_type: 'hotel',
    address: '',
    city: '',
    quarter: '',
    check_in_time: '14:00',
    check_out_time: '11:00',
    cancellation_policy: 'moderate',
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await api.post('/establishments/', form);
      setShowForm(false);
      setForm({
        name: '', description: '', establishment_type: 'hotel',
        address: '', city: '', quarter: '',
        check_in_time: '14:00', check_out_time: '11:00', cancellation_policy: 'moderate'
      });
      refetch();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mes établissements</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? 'Annuler' : 'Ajouter un établissement'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Nouvel établissement</h2>
          {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom</label>
              <input required className="mt-1 w-full rounded-lg border-gray-300 text-sm"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select className="mt-1 w-full rounded-lg border-gray-300 text-sm"
                value={form.establishment_type} onChange={(e) => setForm({ ...form, establishment_type: e.target.value })}>
                <option value="hotel">Hôtel</option>
                <option value="residence">Résidence</option>
                <option value="villa">Villa</option>
                <option value="apartment">Appartement</option>
                <option value="guesthouse">Maison d'hôtes</option>
                <option value="hostel">Auberge</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea rows={3} className="mt-1 w-full rounded-lg border-gray-300 text-sm"
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Adresse</label>
              <input required className="mt-1 w-full rounded-lg border-gray-300 text-sm"
                value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ville</label>
              <input required className="mt-1 w-full rounded-lg border-gray-300 text-sm"
                value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quartier</label>
              <input className="mt-1 w-full rounded-lg border-gray-300 text-sm"
                value={form.quarter} onChange={(e) => setForm({ ...form, quarter: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Politique d'annulation</label>
              <select className="mt-1 w-full rounded-lg border-gray-300 text-sm"
                value={form.cancellation_policy} onChange={(e) => setForm({ ...form, cancellation_policy: e.target.value })}>
                <option value="flexible">Flexible</option>
                <option value="moderate">Modérée</option>
                <option value="strict">Stricte</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Enregistrement...' : 'Créer'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && (
          <div className="col-span-full flex h-64 items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        )}

        {!isLoading && (establishments || []).length === 0 && (
          <div className="col-span-full rounded-xl border bg-white p-12 text-center">
            <Hotel className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Aucun établissement</h3>
            <p className="mt-1 text-gray-500">Ajoutez votre premier hébergement pour commencer.</p>
          </div>
        )}

        {(establishments || []).map((est) => (
          <div key={est.id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="h-40 overflow-hidden rounded-lg bg-gray-200">
              {est.primary_image ? (
                <img src={est.primary_image.image} alt={est.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">Pas d'image</div>
              )}
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{est.name}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  est.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                }`}>
                  {est.status}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="h-3.5 w-3.5" /> {est.city_quarter}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{est.avg_rating || 'Nouveau'}</span>
                <span className="text-xs text-gray-400">({est.review_count} avis)</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Link to={`/establishments/${est.slug}`} className="btn-outline flex-1 py-1.5 text-xs">
                  <Eye className="mr-1 h-3.5 w-3.5" /> Voir
                </Link>
                <button className="btn-outline flex-1 py-1.5 text-xs">
                  <Edit className="mr-1 h-3.5 w-3.5" /> Modifier
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
