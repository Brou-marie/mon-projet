import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../api/client';
import { Calendar, MapPin, Star, Loader, AlertCircle, ArrowRight } from 'lucide-react';

export default function MyBookings() {
  const { data, isLoading, error } = useQuery('myBookings', async () => {
    const { data } = await api.get('/bookings/');
    return data;
  });

  const bookings = data?.results || [];

  const getStatusLabel = (status) => {
    const labels = {
      cart: 'Panier',
      confirmed: 'Confirmée',
      in_progress: 'En cours',
      completed: 'Terminée',
      cancelled_by_guest: 'Annulée',
      cancelled_by_host: 'Annulée par hôte',
      dispute: 'Litige',
      no_show: 'Non présenté',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    if (['confirmed', 'in_progress'].includes(status)) return 'bg-green-50 text-green-700';
    if (['completed'].includes(status)) return 'bg-blue-50 text-blue-700';
    if (['cancelled_by_guest', 'cancelled_by_host', 'no_show'].includes(status)) return 'bg-red-50 text-red-700';
    if (['cart'].includes(status)) return 'bg-yellow-50 text-yellow-700';
    return 'bg-gray-50 text-gray-700';
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Mes réservations</h1>

      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5" />
          Impossible de charger vos réservations.
        </div>
      )}

      {!isLoading && bookings.length === 0 && (
        <div className="mt-8 rounded-xl border bg-white p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Aucune réservation</h3>
          <p className="mt-1 text-gray-500">Vous n'avez pas encore de réservation.</p>
          <Link to="/" className="btn-primary mt-4 inline-block">Découvrir les hébergements</Link>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {bookings.map((b) => (
          <div key={b.id} className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="h-24 w-32 overflow-hidden rounded-lg bg-gray-200">
              {b.primary_image ? (
                <img src={b.primary_image} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400 text-xs">Photo</div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">{b.establishment_name}</h3>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(b.status)}`}>
                  {getStatusLabel(b.status)}
                </span>
              </div>
              <p className="text-sm text-gray-500">{b.room_type_name}</p>
              <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {b.check_in_date} → {b.check_out_date}</span>
                <span>{b.total_nights} nuit(s)</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">{Number(b.total_amount).toLocaleString()} FCFA</p>
              <Link to={`/bookings/${b.booking_number}`} className="mt-1 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
                Voir détail <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
