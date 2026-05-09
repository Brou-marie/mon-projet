import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../api/client';
import {
  Calendar, Loader, AlertCircle, CheckCircle, Clock,
  XCircle, Users, DollarSign, Phone, Mail, ChevronDown,
  ChevronUp, BedDouble,
} from 'lucide-react';

const STATUS_CONFIG = {
  cart: { label: 'En attente de paiement', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
  confirmed: { label: 'Confirmée', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  in_progress: { label: 'En cours', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle },
  completed: { label: 'Terminée', color: 'bg-gray-50 text-gray-600 border-gray-200', icon: CheckCircle },
  cancelled_by_guest: { label: 'Annulée (voyageur)', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  cancelled_by_host: { label: 'Annulée (hôte)', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  no_show: { label: 'Non présenté', color: 'bg-gray-50 text-gray-500 border-gray-200', icon: XCircle },
};

const FILTERS = [
  { value: '', label: 'Toutes' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'cart', label: 'En attente' },
  { value: 'completed', label: 'Terminées' },
  { value: 'cancelled_by_guest,cancelled_by_host', label: 'Annulées' },
];

function BookingRow({ booking, onCancel, cancelling }) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.completed;
  const StatusIcon = statusCfg.icon;
  const canCancel = booking.status === 'confirmed';

  const subtotal = Number(booking.subtotal || 0);
  const commission = Number(booking.commission_amount || 0);
  const hostPayout = Number(booking.host_payout || 0);
  const total = Number(booking.total_amount || 0);

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* Ligne principale */}
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-medium text-gray-500">{booking.booking_number}</span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${statusCfg.color}`}>
              <StatusIcon className="h-3 w-3" />
              {statusCfg.label}
            </span>
          </div>
          <p className="mt-1 text-base font-semibold text-gray-900">{booking.establishment_name}</p>
          <p className="text-sm text-gray-500">{booking.room_type_name}</p>
          <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              {new Date(booking.check_in_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              {' → '}
              {new Date(booking.check_out_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-gray-400">{booking.total_nights} nuit(s)</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">{total.toLocaleString('fr-FR')} FCFA</p>
            <p className="text-xs text-green-600 font-medium">
              Votre part : {hostPayout.toLocaleString('fr-FR')} FCFA
            </p>
          </div>
          <div className="flex gap-2">
            {canCancel && (
              <button
                onClick={() => onCancel(booking.booking_number)}
                disabled={cancelling}
                className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Annuler
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Détails
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Détails étendus */}
      {expanded && (
        <div className="border-t bg-gray-50 p-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Infos voyageur */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Voyageur</h4>
            <div className="space-y-1 text-sm text-gray-700">
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
              <p className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                {booking.guest_count_adults} adulte(s)
                {booking.guest_count_children > 0 && `, ${booking.guest_count_children} enfant(s)`}
              </p>
            </div>
            {booking.guest_notes && (
              <div className="mt-2 rounded-lg bg-blue-50 p-2 text-xs text-blue-700">
                <p className="font-medium">Demandes spéciales :</p>
                <p>{booking.guest_notes}</p>
              </div>
            )}
          </div>

          {/* Détail financier */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Détail financier</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Montant hébergement</span>
                <span>{subtotal.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Commission plateforme (15%)</span>
                <span className="text-red-600">- {commission.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-semibold text-gray-900">
                <span>Votre versement net</span>
                <span className="text-green-700">{hostPayout.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Le versement est effectué après le check-out du voyageur.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HostBookings() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error } = useQuery(
    ['hostBookings', statusFilter],
    async () => {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/bookings/', { params });
      return data;
    }
  );

  const cancelMutation = useMutation(
    async (bookingNumber) => {
      await api.post(`/bookings/${bookingNumber}/cancel/`, {
        reason: 'Annulation par l\'hébergeur',
      });
    },
    {
      onSuccess: () => queryClient.invalidateQueries('hostBookings'),
    }
  );

  const handleCancel = (bookingNumber) => {
    if (confirm('Annuler cette réservation ? Le voyageur sera remboursé intégralement.')) {
      cancelMutation.mutate(bookingNumber);
    }
  };

  const bookings = data?.results || [];

  // Stats rapides
  const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
  const inProgress = bookings.filter((b) => b.status === 'in_progress').length;
  const totalRevenue = bookings
    .filter((b) => ['confirmed', 'in_progress', 'completed'].includes(b.status))
    .reduce((s, b) => s + Number(b.host_payout || 0), 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Réservations reçues</h1>
          <p className="text-sm text-gray-500">Gérez les réservations de vos hébergements</p>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Confirmées', value: confirmed, color: 'text-green-700 bg-green-50' },
          { label: 'En cours', value: inProgress, color: 'text-blue-700 bg-blue-50' },
          { label: 'Revenus nets', value: `${totalRevenue.toLocaleString('fr-FR')} FCFA`, color: 'text-orange-700 bg-orange-50' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition ${
              statusFilter === f.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="mt-6 space-y-4">
        {isLoading && (
          <div className="flex h-64 items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            Impossible de charger les réservations.
          </div>
        )}

        {!isLoading && bookings.length === 0 && (
          <div className="rounded-xl border bg-white p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Aucune réservation</h3>
            <p className="mt-1 text-gray-500">
              {statusFilter ? 'Aucune réservation pour ce filtre.' : 'Vous n\'avez pas encore reçu de réservation.'}
            </p>
          </div>
        )}

        {bookings.map((b) => (
          <BookingRow
            key={b.id}
            booking={b}
            onCancel={handleCancel}
            cancelling={cancelMutation.isLoading}
          />
        ))}
      </div>
    </div>
  );
}
