import { useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import api from '../api/clientApi';
import { useAuth } from '../context/ContexteAuth';
import {
  Calendar, Users, Smartphone, CreditCard, Banknote,
  AlertCircle, Loader, CheckCircle, ArrowLeft, Shield, Info,
} from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'wave', label: 'Wave', icon: '🌊', description: 'Paiement instantané via Wave' },
  { id: 'orange_money', label: 'Orange Money', icon: '🟠', description: 'Paiement via Orange Money' },
  { id: 'mtn_money', label: 'MTN Mobile Money', icon: '🟡', description: 'Paiement via MTN MoMo' },
  { id: 'moov_money', label: 'Moov Money', icon: '🔵', description: 'Paiement via Moov Money' },
  { id: 'card', label: 'Carte Bancaire', icon: '💳', description: 'Visa, Mastercard' },
  { id: 'bank_transfer', label: 'Virement Bancaire', icon: '🏦', description: 'Virement SWIFT/SEPA' },
];

const CANCELLATION_INFO = {
  flexible: 'Annulation gratuite jusqu\'à 24h avant l\'arrivée. Après, aucun remboursement.',
  moderate: 'Annulation gratuite jusqu\'à 5 jours avant. Entre J-5 et J-1 : 50% remboursé. Après : aucun remboursement.',
  strict: 'Annulation gratuite jusqu\'à 14 jours avant. Entre J-14 et J-7 : 50% remboursé. Après : aucun remboursement.',
};

export default function BookingPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const roomTypeId = searchParams.get('room_type');
  const checkIn = searchParams.get('check_in');
  const checkOut = searchParams.get('check_out');
  const guestsCount = parseInt(searchParams.get('guests') || '1');

  const [paymentMethod, setPaymentMethod] = useState('wave');
  const [guestNotes, setGuestNotes] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: résumé, 2: paiement, 3: confirmation

  const { data: establishment, isLoading } = useQuery(
    ['establishment', slug],
    async () => {
      const { data } = await api.get(`/establishments/${slug}/`);
      return data;
    }
  );

  const roomType = establishment?.room_types?.find((r) => String(r.id) === String(roomTypeId));

  const nights = checkIn && checkOut
    ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000))
    : 1;

  const pricePerNight = roomType ? Number(roomType.base_price_per_night) : 0;
  const subtotal = pricePerNight * nights;
  const platformFeeRate = 0.15;
  const platformFee = Math.round(subtotal * platformFeeRate);
  const total = subtotal + platformFee;
  const hostPayout = subtotal - Math.round(subtotal * 0.15); // ce que reçoit l'hôte

  const bookingMutation = useMutation(
    async () => {
      // 1. Créer la réservation
      const { data: booking } = await api.post('/bookings/', {
        room_type_id: roomTypeId,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guest_count_adults: guestsCount,
        guest_count_children: 0,
        guest_notes: guestNotes,
      });

      // 2. Initier le paiement
      await api.post('/payments/payments/', {
        booking: booking.id,
        payment_method: paymentMethod,
      });

      return booking;
    },
    {
      onSuccess: (booking) => {
        navigate(`/confirmation/${booking.booking_number}`, { replace: true });
      },
      onError: (err) => {
        const data = err.response?.data;
        if (data?.dates) setError(Array.isArray(data.dates) ? data.dates[0] : data.dates);
        else if (data?.detail) setError(data.detail);
        else if (data && typeof data === 'object') setError(Object.values(data).flat()[0]);
        else setError('Une erreur est survenue. Veuillez réessayer.');
        setStep(1);
      },
    }
  );

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-noam-600" />
      </div>
    );
  }

  if (!roomType) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-300" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900">Chambre non trouvée</h2>
        <p className="mt-2 text-gray-500">Ce type de chambre n'est pas disponible.</p>
        <Link to={`/hebergements/${slug}`} className="btn-primaire mt-4 inline-block">
          Retour à l'hébergement
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <Link
        to={`/hebergements/${slug}`}
        className="mb-6 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à {establishment?.name}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">Finaliser votre réservation</h1>

      {/* Indicateur d'étapes */}
      <div className="mt-4 flex items-center gap-2">
        {[
          { n: 1, label: 'Résumé' },
          { n: 2, label: 'Paiement' },
          { n: 3, label: 'Confirmation' },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
              step >= s.n ? 'bg-noam-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step > s.n ? <CheckCircle className="h-4 w-4" /> : s.n}
            </div>
            <span className={`text-sm ${step >= s.n ? 'font-medium text-gray-900' : 'text-gray-400'}`}>
              {s.label}
            </span>
            {i < 2 && <div className={`h-px w-8 ${step > s.n ? 'bg-noam-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Étape 1 : Résumé du séjour */}
          <section className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Votre séjour</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                <Calendar className="h-5 w-5 text-noam-600 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Arrivée</p>
                  <p className="text-sm font-semibold">
                    {new Date(checkIn).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-400">dès {establishment?.check_in_time || '14:00'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                <Calendar className="h-5 w-5 text-noam-600 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Départ</p>
                  <p className="text-sm font-semibold">
                    {new Date(checkOut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-400">avant {establishment?.check_out_time || '11:00'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                <Users className="h-5 w-5 text-noam-600 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Voyageurs</p>
                  <p className="text-sm font-semibold">{guestsCount} adulte(s)</p>
                  <p className="text-xs text-gray-400">{nights} nuit(s)</p>
                </div>
              </div>
            </div>

            {/* Chambre sélectionnée */}
            <div className="mt-4 flex items-center gap-3 rounded-lg border p-3">
              <div className="h-16 w-20 overflow-hidden rounded-lg bg-gray-100 shrink-0">
                {roomType.primary_image ? (
                  <img src={roomType.primary_image.image_url || roomType.primary_image.image}
                    alt={roomType.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400 text-xs">Photo</div>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{roomType.name}</p>
                <p className="text-sm text-gray-500">{establishment?.name}</p>
                {roomType.bed_type && <p className="text-xs text-gray-400">{roomType.bed_type}</p>}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Demandes spéciales <span className="text-gray-400">(optionnel)</span>
              </label>
              <textarea
                rows={2}
                className="champ"
                placeholder="Heure d'arrivée, lit bébé, étage préféré..."
                value={guestNotes}
                onChange={(e) => setGuestNotes(e.target.value)}
              />
            </div>
          </section>

          {/* Étape 2 : Paiement */}
          <section className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Moyen de paiement</h2>
            <p className="mt-1 text-sm text-gray-500">Choisissez votre méthode de paiement préférée</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${
                    paymentMethod === method.id
                      ? 'border-noam-500 bg-noam-50 ring-1 ring-noam-500'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-2xl">{method.icon}</span>
                  <div>
                    <p className={`text-sm font-semibold ${paymentMethod === method.id ? 'text-noam-700' : 'text-gray-900'}`}>
                      {method.label}
                    </p>
                    <p className="text-xs text-gray-500">{method.description}</p>
                  </div>
                  {paymentMethod === method.id && (
                    <CheckCircle className="ml-auto h-5 w-5 text-noam-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Info sécurité */}
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
              <Shield className="h-4 w-4 text-green-600 shrink-0" />
              Paiement sécurisé. Vos données sont protégées et chiffrées.
            </div>
          </section>

          {/* Politique d'annulation */}
          <section className="rounded-xl border bg-amber-50 p-4">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Politique d'annulation : {establishment?.cancellation_policy}
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  {CANCELLATION_INFO[establishment?.cancellation_policy] || ''}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Récapitulatif prix */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border bg-white p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-900">Récapitulatif</h3>

            {/* Détail des prix */}
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {pricePerNight.toLocaleString('fr-FR')} FCFA × {nights} nuit(s)
                </span>
                <span className="font-medium">{subtotal.toLocaleString('fr-FR')} FCFA</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1 text-gray-600">
                  Frais de service (15%)
                  <span className="group relative cursor-help">
                    <Info className="h-3.5 w-3.5 text-gray-400" />
                  </span>
                </span>
                <span className="font-medium">{platformFee.toLocaleString('fr-FR')} FCFA</span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between text-base font-bold">
                  <span>Total à payer</span>
                  <span className="text-noam-700">{total.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <p className="mt-1 text-xs text-gray-400">Toutes taxes comprises</p>
              </div>

              {/* Ce que reçoit l'hôte — info transparence */}
              <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500 space-y-1">
                <p className="font-medium text-gray-700">Détail de la transaction</p>
                <div className="flex justify-between">
                  <span>Montant hébergement</span>
                  <span>{subtotal.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span>Commission plateforme (15%)</span>
                  <span>- {Math.round(subtotal * 0.15).toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div className="flex justify-between font-medium text-gray-700 border-t pt-1">
                  <span>Versement à l'hébergeur</span>
                  <span>{(subtotal - Math.round(subtotal * 0.15)).toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>
            </div>

            {/* Infos voyageur */}
            <div className="mt-4 rounded-lg bg-noam-50 p-3 text-xs text-noam-700">
              <p className="font-medium">Réservation pour :</p>
              <p>{user?.first_name} {user?.last_name}</p>
              <p>{user?.email}</p>
              {user?.phone && <p>{user?.phone}</p>}
            </div>

            <button
              onClick={() => bookingMutation.mutate()}
              disabled={bookingMutation.isLoading}
              className="btn-primaire mt-5 w-full py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {bookingMutation.isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader className="h-5 w-5 animate-spin" />
                  Traitement en cours...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Confirmer et payer — {total.toLocaleString('fr-FR')} FCFA
                </span>
              )}
            </button>

            <p className="mt-3 text-center text-xs text-gray-400">
              En confirmant, vous acceptez les conditions générales et la politique d'annulation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
