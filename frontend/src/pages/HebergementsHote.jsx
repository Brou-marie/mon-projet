import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../api/clientApi';
import {
  Hotel, Plus, Edit, Eye, Loader, MapPin, Star, Upload, X,
  Trash2, BedDouble, ChevronDown, ChevronUp, Check,
} from 'lucide-react';

const EMPTY_ESTABLISHMENT = {
  name: '', description: '', establishment_type: 'hotel',
  address: '', city: '', quarter: '',
  check_in_time: '14:00', check_out_time: '11:00',
  cancellation_policy: 'moderate',
};

const EMPTY_ROOM = {
  name: '', description: '', capacity_adults: 2, capacity_children: 0,
  base_price_per_night: '', physical_room_count: 1,
  size_sqm: '', bed_type: '',
};

// ─── Composant upload d'images ────────────────────────────────────────────────
function ImageUploader({ establishmentSlug, existingImages = [], onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState([]);
  const inputRef = useRef();

  const handleFiles = (files) => {
    const arr = Array.from(files);
    setPreviews(arr.map((f) => ({ file: f, url: URL.createObjectURL(f) })));
  };

  const handleUpload = async () => {
    if (!previews.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      previews.forEach((p) => formData.append('images', p.file));
      await api.post(`/establishments/${establishmentSlug}/images/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreviews([]);
      onUploaded();
    } catch (err) {
      alert('Erreur lors de l\'upload des images.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (!confirm('Supprimer cette image ?')) return;
    try {
      await api.delete(`/establishments/images/${imageId}/`);
      onUploaded();
    } catch {
      alert('Erreur lors de la suppression.');
    }
  };

  return (
    <div className="space-y-3">
      {/* Images existantes */}
      {existingImages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {existingImages.map((img) => (
            <div key={img.id} className="relative h-20 w-20 overflow-hidden rounded-lg border">
              <img src={img.image_url || img.image} alt="" className="h-full w-full object-cover" />
              {img.is_primary && (
                <span className="absolute left-0 top-0 bg-noam-600 px-1 text-xs text-white">
                  Principale
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                className="absolute right-0 top-0 rounded-bl bg-red-500 p-0.5 text-white hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Zone de drop */}
      <div
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4 hover:border-noam-400 hover:bg-noam-50 transition"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        <Upload className="h-6 w-6 text-gray-400" />
        <p className="mt-1 text-sm text-gray-500">Cliquez ou glissez vos photos ici</p>
        <p className="text-xs text-gray-400">JPG, PNG, WEBP — plusieurs fichiers acceptés</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Aperçu des nouvelles images */}
      {previews.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {previews.map((p, i) => (
              <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border">
                <img src={p.url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPreviews((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute right-0 top-0 rounded-bl bg-red-500 p-0.5 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="btn-primary text-sm py-1.5"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <Loader className="h-4 w-4 animate-spin" /> Upload en cours...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" /> Envoyer {previews.length} photo(s)
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Formulaire d'ajout de chambre ────────────────────────────────────────────
function RoomForm({ establishmentSlug, onCreated }) {
  const [form, setForm] = useState(EMPTY_ROOM);
  const [roomImages, setRoomImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') formData.append(k, v); });
      roomImages.forEach((f) => formData.append('images', f));
      await api.post(`/establishments/${establishmentSlug}/room-types/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(EMPTY_ROOM);
      setRoomImages([]);
      onCreated();
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        setError(Object.values(data).flat().join(' '));
      } else {
        setError('Erreur lors de la création de la chambre.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-lg border bg-gray-50 p-4 space-y-3">
      <h4 className="font-medium text-gray-900">Nouvelle chambre / type de logement</h4>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-gray-700">Nom *</label>
          <input required className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Ex: Chambre Deluxe, Suite Junior..."
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Prix / nuit (FCFA) *</label>
          <input required type="number" min="0" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Ex: 25000"
            value={form.base_price_per_night} onChange={(e) => setForm({ ...form, base_price_per_night: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-700">Description</label>
          <textarea rows={2} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Capacité adultes</label>
          <input type="number" min="1" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={form.capacity_adults} onChange={(e) => setForm({ ...form, capacity_adults: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Capacité enfants</label>
          <input type="number" min="0" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={form.capacity_children} onChange={(e) => setForm({ ...form, capacity_children: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Nombre de chambres physiques</label>
          <input type="number" min="1" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={form.physical_room_count} onChange={(e) => setForm({ ...form, physical_room_count: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Surface (m²)</label>
          <input type="number" min="0" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Ex: 25"
            value={form.size_sqm} onChange={(e) => setForm({ ...form, size_sqm: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Type de lit</label>
          <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Ex: Lit double, Lits jumeaux..."
            value={form.bed_type} onChange={(e) => setForm({ ...form, bed_type: e.target.value })} />
        </div>
      </div>

      {/* Photos de la chambre */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Photos de la chambre</label>
        <div
          className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-3 hover:border-noam-400 transition"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">
            {roomImages.length > 0 ? `${roomImages.length} photo(s) sélectionnée(s)` : 'Ajouter des photos'}
          </span>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => setRoomImages(Array.from(e.target.files))} />
        </div>
        {roomImages.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {roomImages.map((f, i) => (
              <div key={i} className="relative h-16 w-16 overflow-hidden rounded border">
                <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setRoomImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute right-0 top-0 bg-red-500 p-0.5 text-white rounded-bl">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button type="submit" disabled={saving} className="btn-primary text-sm">
          {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saving ? 'Enregistrement...' : 'Ajouter la chambre'}
        </button>
      </div>
    </form>
  );
}

// ─── Carte d'un établissement ─────────────────────────────────────────────────
function EstablishmentCard({ est, onRefetch }) {
  const [expanded, setExpanded] = useState(false);
  const [showRoomForm, setShowRoomForm] = useState(false);

  const { data: detail, refetch: refetchDetail } = useQuery(
    ['est-detail', est.slug],
    async () => {
      const { data } = await api.get(`/establishments/${est.slug}/`);
      return data;
    },
    { enabled: expanded }
  );

  const handleImageUploaded = () => {
    refetchDetail();
    onRefetch();
  };

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* Image principale */}
      <div className="h-44 overflow-hidden bg-gray-100">
        {est.primary_image ? (
          <img src={est.primary_image.image_url || est.primary_image.image} alt={est.name}
            className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <Hotel className="h-10 w-10" />
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{est.name}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="h-3.5 w-3.5" /> {est.city_quarter}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            est.status === 'active' ? 'bg-green-50 text-green-700' :
            est.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
            'bg-red-50 text-red-700'
          }`}>
            {est.status === 'active' ? 'Actif' : est.status === 'pending' ? 'En attente' : est.status}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            {Number(est.avg_rating) > 0 ? est.avg_rating : 'Nouveau'}
          </span>
          {est.lowest_price && (
            <span className="font-medium text-gray-900">
              À partir de {Number(est.lowest_price).toLocaleString('fr-FR')} FCFA/nuit
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <Link to={`/hebergements/${est.slug}`} className="btn-secondaire flex-1 py-1.5 text-xs justify-center">
            <Eye className="mr-1 h-3.5 w-3.5" /> Voir
          </Link>
          <button
            onClick={() => setExpanded(!expanded)}
            className="btn-outline flex-1 py-1.5 text-xs justify-center"
          >
            <Edit className="mr-1 h-3.5 w-3.5" />
            Gérer
            {expanded ? <ChevronUp className="ml-1 h-3.5 w-3.5" /> : <ChevronDown className="ml-1 h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Panneau de gestion étendu */}
        {expanded && (
          <div className="mt-4 space-y-4 border-t pt-4">
            {/* Upload photos */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Photos de l'établissement</h4>
              <ImageUploader
                establishmentSlug={est.slug}
                existingImages={detail?.images || []}
                onUploaded={handleImageUploaded}
              />
            </div>

            {/* Chambres existantes */}
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">
                  Chambres ({detail?.room_types?.length || 0})
                </h4>
                <button
                  onClick={() => setShowRoomForm(!showRoomForm)}
                  className="flex items-center gap-1 text-xs font-medium text-noam-600 hover:text-noam-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {showRoomForm ? 'Annuler' : 'Ajouter une chambre'}
                </button>
              </div>

              {detail?.room_types?.length > 0 && (
                <div className="mt-2 space-y-2">
                  {detail.room_types.map((room) => (
                    <div key={room.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <BedDouble className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{room.name}</span>
                        <span className="text-gray-500">
                          {Number(room.base_price_per_night).toLocaleString('fr-FR')} FCFA/nuit
                        </span>
                      </div>
                      <span className={`text-xs ${room.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                        {room.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {showRoomForm && (
                <RoomForm
                  establishmentSlug={est.slug}
                  onCreated={() => { setShowRoomForm(false); refetchDetail(); onRefetch(); }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function HostEstablishments() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_ESTABLISHMENT);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const { data: establishments, isLoading, refetch } = useQuery(
    'myEstablishments',
    async () => {
      const { data } = await api.get('/establishments/my_establishments/');
      return data;
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setSaving(true);
    try {
      await api.post('/establishments/', form);
      setShowForm(false);
      setForm(EMPTY_ESTABLISHMENT);
      refetch();
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        setFormErrors(data);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes établissements</h1>
          <p className="text-sm text-gray-500">Gérez vos hébergements, photos et chambres</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? 'Annuler' : 'Ajouter un établissement'}
        </button>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <form onSubmit={handleCreate} className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Nouvel établissement</h2>
          <p className="text-sm text-gray-500">Votre établissement sera visible après validation par notre équipe.</p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { name: 'name', label: 'Nom de l\'établissement *', placeholder: 'Ex: Hôtel Ivoire Palace', required: true },
              { name: 'city', label: 'Ville *', placeholder: 'Ex: Abidjan', required: true },
              { name: 'address', label: 'Adresse complète *', placeholder: 'Ex: Rue des Jardins, Cocody', required: true },
              { name: 'quarter', label: 'Quartier', placeholder: 'Ex: Cocody, Plateau...' },
            ].map((field) => (
              <div key={field.name} className={field.name === 'address' ? 'sm:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                <input
                  name={field.name}
                  required={field.required}
                  placeholder={field.placeholder}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                    formErrors[field.name]
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
                      : 'border-gray-300 focus:border-noam-500 focus:ring-noam-500'
                  }`}
                  value={form[field.name]}
                  onChange={handleChange}
                />
                {formErrors[field.name] && (
                  <p className="mt-1 text-xs text-red-600">
                    {Array.isArray(formErrors[field.name]) ? formErrors[field.name][0] : formErrors[field.name]}
                  </p>
                )}
              </div>
            ))}

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description *</label>
              <textarea
                name="description"
                required
                rows={4}
                placeholder="Décrivez votre établissement : ambiance, services, points forts..."
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                  formErrors.description
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
                    : 'border-gray-300 focus:border-noam-500 focus:ring-noam-500'
                }`}
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type d'établissement</label>
              <select name="establishment_type"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-noam-500 focus:outline-none focus:ring-1 focus:ring-noam-500"
                value={form.establishment_type} onChange={handleChange}>
                <option value="hotel">Hôtel</option>
                <option value="residence">Résidence</option>
                <option value="villa">Villa</option>
                <option value="apartment">Appartement</option>
                <option value="guesthouse">Maison d'hôtes</option>
                <option value="hostel">Auberge</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Politique d'annulation</label>
              <select name="cancellation_policy"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-noam-500 focus:outline-none focus:ring-1 focus:ring-noam-500"
                value={form.cancellation_policy} onChange={handleChange}>
                <option value="flexible">Flexible — Remboursement jusqu'à J-1</option>
                <option value="moderate">Modérée — Remboursement jusqu'à J-5</option>
                <option value="strict">Stricte — Remboursement jusqu'à J-14</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Heure de check-in</label>
              <input type="time" name="check_in_time"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-noam-500 focus:outline-none focus:ring-1 focus:ring-noam-500"
                value={form.check_in_time} onChange={handleChange} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Heure de check-out</label>
              <input type="time" name="check_out_time"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-noam-500 focus:outline-none focus:ring-1 focus:ring-noam-500"
                value={form.check_out_time} onChange={handleChange} />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <span className="flex items-center gap-2"><Loader className="h-4 w-4 animate-spin" /> Création...</span>
              ) : (
                <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Créer l'établissement</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Liste des établissements */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && (
          <div className="col-span-full flex h-64 items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-noam-600" />
          </div>
        )}

        {!isLoading && (establishments || []).length === 0 && (
          <div className="col-span-full rounded-xl border bg-white p-12 text-center">
            <Hotel className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Aucun établissement</h3>
            <p className="mt-1 text-gray-500">Ajoutez votre premier hébergement pour commencer à recevoir des réservations.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
              <Plus className="mr-2 h-4 w-4" /> Ajouter un établissement
            </button>
          </div>
        )}

        {(establishments || []).map((est) => (
          <EstablishmentCard key={est.id} est={est} onRefetch={refetch} />
        ))}
      </div>
    </div>
  );
}
