import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../api/clientApi';
import {
  CheckCircle, Calendar, MapPin, Hotel, ArrowLeft,
  Clock, Users, DollarSign, Phone, Mail, Shield,
} from 'lucide-react';

export default function ConfirmationPage() {
  const { bookingNumber } = useParams();

  const { data: booking, isLoading } = useQuery(
    ['booking', bookingNumber],
    async () => {
      const { data } = await api.get(`/bookings/${bookingNumber}/`);
      return data;
    }
  );

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-noam-600 border-t-transparent" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-gray-500">Réservation non trouvée.</p>
        <Link to="/" className="btn-primaire mt-4 inline-block">Retour à l'accueil</Link>
      </div>
    );
  }

  const subtotal = Number(booking.subtotal);
  const platformFee = Number(booking.platform_fee);
  const taxAmount = Number(booking.tax_amount);
  const total = Number(booking.total_amount);
  const hostPayout = Number(booking.host_payout);

  const isConfirmed = ['confirmed', 'in_progress', 'completed'].includes(booking.status);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* En-tête */}
      <div className="rounded-xl border bg-white p-8 shadow-lg">
        <div className="text-center">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
            isConfirmed ? 'bg-green-100' : 'bg-yellow-100'
          }`}>
            <CheckCircle className={`h-8 w-8 ${isConfirmed ? 'text-green-600' : 'text-yellow-600'}`} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            {isConfirmed ? 'Réservation confirmée !' : 'Réservation en attente'}
          </h1>
          <p className="mt-1 text-gray-500">
            Numéro de réservation :{' '}
            <span className="font-mono font-bold text-noam-700">{booking.booking_number}</span>
          </p>
        </div>

        {/* Détails du séjour */}
        <div className="mt-6 rounded-lg border bg-gray-50 p-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Détails du séjour</h2>
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-3">
              <Hotel className="h-5 w-5 text-noam-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">{booking.establishment_name}</p>
                <p className="text-xs text-gray-500">{booking.room_type_name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Arrivée</p>
                  <p className="font-medium">
                    {new Date(booking.check_in_date).toLocaleDateString('fr-FR', {
                      weekday: 'short', day: 'numeric', month: 'long'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Départ</p>
                  <p className="font-medium">
                    {new Date(booking.check_out_date).toLocaleDateString('fr-FR', {
                      weekday: 'short', day: 'numeric', month: 'long'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Durée</p>
                  <p className="font-medium">{booking.total_nights} nuit(s)</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Users className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Voyageurs</p>
                  <p className="font-medium">{booking.guest_count_adults} adulte(s)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Détail financier complet */}
        <div className="mt-4 rounded-lg border bg-gray-50 p-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Détail du paiement</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Hébergement ({booking.total_nights} nuit(s))</span>
              <span>{subtotal.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Frais de service (15%)</span>
              <span>{platformFee.toLocaleString('fr-FR')} FCFA</span>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Taxes</span>
                <span>{taxAmount.toLocaleString('fr-FR')} FCFA</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900">
              <span>Total payé</span>
              <span className="text-noam-700">{total.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
        </div>

        {/* Infos voyageur */}
        {(booking.guest_name || booking.guest_email) && (
          <div className="mt-4 rounded-lg border bg-gray-50 p-4">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Voyageur</h2>
            <div className="mt-2 space-y-1 text-sm text-gray-700">
              {booking.guest_name && (
                <p className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" /> {booking.guest_name}
                </p>
              )}
              {booking.guest_email && (
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" /> {booking.guest_email}
                </p>
              )}
              {booking.guest_phone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" /> {booking.guest_phone}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Notes du voyageur */}
        {booking.guest_notes && (
          <div className="mt-4 rounded-lg border bg-blue-50 p-3 text-sm text-blue-700">
            <p className="font-medium">Vos demandes spéciales :</p>
            <p className="mt-1">{booking.guest_notes}</p>
          </div>
        )}

        {/* Sécurité */}
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs text-green-700">
          <Shield className="h-4 w-4 shrink-0" />
          Votre paiement est sécurisé. Un email de confirmation vous a été envoyé.
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link to="/mes-reservations" className="btn-secondaire flex-1 justify-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Mes réservations
          </Link>
          <Link to="/" className="btn-primaire flex-1 justify-center">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
