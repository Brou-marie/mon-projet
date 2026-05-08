import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import api from '../api/client';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
import { Calendar, Users, CreditCard, Smartphone, Banknote, AlertCircle, Loader, CheckCircle } from 'lucide-react';

export default function BookingPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const roomTypeId = searchParams.get('room_type');
  const checkIn = searchParams.get('check_in');
  const checkOut = searchParams.get('check_out');
  const guests = searchParams.get('guests') || '1';

  const [paymentMethod, setPaymentMethod] = useState('wave');
  const [guestNotes, setGuestNotes] = useState('');
  const [error, setError] = useState('');

  const { data: establishment } = useQuery(['establishment', slug], async () => {
    const { data } = await api.get(`/establishments/${slug}/`);
    return data;
  });

  const roomType = establishment?.room_types?.find((r) => r.id === roomTypeId);

  const nights = checkIn && checkOut
    ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)))
    : 1;

  const pricePerNight = roomType ? Number(roomType.base_price_per_night) : 0;
  const subtotal = pricePerNight * nights;
  const platformFee = Math.round(subtotal * 0.15);
  const total = subtotal + platformFee;

  const bookingMutation = useMutation(
    async () => {
      const { data } = await api.post('/bookings/', {
        room_type_id: roomTypeId,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guest_count_adults: parseInt(guests),
        guest_count_children: 0,
        guest_notes: guestNotes,
      });
      return data;
    },
    {
      onSuccess: (data) => {
        navigate(`/confirmation/${data.booking_number}`);
      },
      onError: (err) => {
        setError(err.response?.data?.detail || err.response?.data?.dates || 'Erreur lors de la réservation.');
      },
    }
  );

  const handleConfirm = () => {
    setError('');
    bookingMutation.mutate();
  };

  if (!roomType) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-4 text-gray-500">Type de chambre non trouvé ou indisponible.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Finaliser votre réservation</h1>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Votre séjour</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                <Calendar className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="text-xs text-gray-500">Arrivée</p>
                  <p className="text-sm font-medium">{checkIn}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                <Calendar className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="text-xs text-gray-500">Départ</p>
                  <p className="text-sm font-medium">{checkOut}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                <Users className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="text-xs text-gray-500">Voyageurs</p>
                  <p className="text-sm font-medium">{guests} adulte(s)</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Moyen de paiement</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { id: 'wave', label: 'Wave', icon: Smartphone },
                { id: 'orange_money', label: 'Orange Money', icon: Smartphone },
                { id: 'mtn_money', label: 'MTN Mobile Money', icon: Smartphone },
                { id: 'moov_money', label: 'Moov Money', icon: Smartphone },
                { id: 'card', label: 'Carte Bancaire', icon: CreditCard },
                { id: 'bank_transfer', label: 'Virement Bancaire', icon: Banknote },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${
                    paymentMethod === method.id
                      ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <method.icon className={`h-5 w-5 ${paymentMethod === method.id ? 'text-primary-600' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium text-gray-900">{method.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Notes spéciales</h2>
            <textarea
              rows={3}
              className="mt-3 w-full rounded-lg border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="Demande particulière (étage, lit bébé, heure d'arrivée...)"
              value={guestNotes}
              onChange={(e) => setGuestNotes(e.target.value)}
            />
          </section>
        </div>

        {/* Right: Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border bg-white p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-900">Récapitulatif</h3>
            <div className="mt-4 space-y-2 border-b pb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{roomType.name}</span>
                <span className="font-medium">{pricePerNight.toLocaleString()} FCFA x {nights} nuit(s)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sous-total</span>
                <span className="font-medium">{subtotal.toLocaleString()} FCFA</span>
              </div>
            </div>
            <div className="mt-4 space-y-2 border-b pb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Frais de service Reservation (15%)</span>
                <span className="font-medium">{platformFee.toLocaleString()} FCFA</span>
              </div>
            </div>
            <div className="mt-4 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{total.toLocaleString()} FCFA</span>
            </div>

            <button
              onClick={handleConfirm}
              disabled={bookingMutation.isLoading}
              className="btn-primary mt-6 w-full py-3"
            >
              {bookingMutation.isLoading ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              {bookingMutation.isLoading ? 'Traitement...' : 'Confirmer et payer'}
            </button>

            <p className="mt-3 text-center text-xs text-gray-500">
              Politique d'annulation : {establishment?.cancellation_policy}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
