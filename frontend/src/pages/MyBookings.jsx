import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Calendar, Loader, AlertCircle, ArrowRight, BedDouble,
  CheckCircle, Clock, XCircle, MapPin, DollarSign,
} from 'lucide-react';

const STATUS_CONFIG = {
  cart: { label: 'En attente de paiement', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
  confirmed: { label: 'Confirmée', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  in_progress: { label: 'En cours', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle },
  completed: { label: 'Terminée', color: 'bg-gray-50 text-gray-700 border-gray-200', icon: CheckCircle },
  cancelled_by_guest: { label: 'Annulée par vous', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  cancelled_by_host: { label: 'Annulée par l\'hôte', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  no_show: { label: 'Non présenté', color: 'bg-gray-50 text-gray-500 border-gray-200', icon: XCircle },
};

export default function MyBookings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState(null);

  const { data, isLoading, error } = useQuery('myBookings', async () => {
    const { data } = await api.get('/bookings/');
    return data;
  });

  const cancelMutation = useMutation(
    async (bookingNumber) => {
      await api.post(`/bookings/${bookingNumber}/cancel/`, { reason: 'Annulation par le voyageur' });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('myBookings');
        setCancellingId(null);
      },
    }
  );

  const bookings = data?.results || [];

  const handleCancel = (bookingNumber) => {
    if (confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      cancelMutation.mutate(bookingNumber);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes réservations</h1>
          <p className="text-sm text-gray-500">Historique et suivi de vos séjours</p>
        </div>
        <Link to="/search" className="btn-outline text-sm">
          Trouver un hébergement
        </Link>
      </div>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Impossible de charger vos réservations.
        </div>
      )}

      {!isLoading && bookings.length === 0 && (
        <div className="mt-8 rounded-xl border bg-white p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Aucune réservation</h3>
          <p className="mt-1 text-gray-500">Vous n'avez pas encore effectué de réservation.</p>
          <Link to="/" className="btn-primary mt-4 inline-block">Découvrir les hébergements</Link>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {bookings.map((b) => {
          const statusCfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.completed;
          const StatusIcon = statusCfg.icon;
          const canCancel = ['cart', 'confirmed'].includes(b.status);

          return (
            <div key={b.id} className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <div className="h-36 w-full overflow-hidden bg-gray-100 sm:h-auto sm:w-40 shrink-0">
                  {b.primary_image ? (
                    <img src={b.primary_image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">
                      <BedDouble className="h-8 w-8" />
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{b.establishment_name}</h3>
                        <p className="text-sm text-gray-500">{b.room_type_name}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusCfg.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(b.check_in_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        {' → '}
                        {new Date(b.check_out_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-gray-400">{b.total_nights} nuit(s)</span>
                    </div>

                    {/* Détail financier */}
                    <div className="mt-2 flex items-center gap-1 text-sm">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-gray-900">
                        {Number(b.total_amount).toLocaleString('fr-FR')} FCFA
                      </span>
                      <span className="text-gray-400 text-xs">
                        (dont {Math.round(Number(b.total_amount) * 0.15 / 1.15).toLocaleString('fr-FR')} FCFA de frais de service)
                      </span>
                    </div>

                    {/* Numéro de réservation */}
                    <p className="mt-1 text-xs text-gray-400">
                      Réf : <span className="font-mono font-medium text-gray-600">{b.booking_number}</span>
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      to={`/confirmation/${b.booking_number}`}
                      className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      Voir le détail <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(b.booking_number)}
                        disabled={cancelMutation.isLoading}
                        className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
