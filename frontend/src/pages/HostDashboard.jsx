import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useQuery } from 'react-query';
import api from '../api/client';
import { Hotel, Calendar, TrendingUp, Star, ArrowRight, Loader, DollarSign, Users } from 'lucide-react';

export default function HostDashboard() {
  const { user } = useContext(AuthContext);

  const { data: establishments, isLoading: loadingEst } = useQuery(
    'myEstablishments',
    async () => {
      const { data } = await api.get('/establishments/my_establishments/');
      return data;
    }
  );

  const { data: bookings, isLoading: loadingBook } = useQuery(
    'hostBookings',
    async () => {
      const { data } = await api.get('/bookings/');
      return data;
    }
  );

  const stats = {
    total_establishments: establishments?.length || 0,
    total_bookings: bookings?.results?.length || 0,
    upcoming: bookings?.results?.filter(b => ['confirmed', 'in_progress'].includes(b.status)).length || 0,
    revenue: bookings?.results?.reduce((sum, b) => sum + (b.status !== 'cancelled_by_guest' && b.status !== 'cancelled_by_host' ? Number(b.total_amount) : 0), 0) || 0,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Hébergeur</h1>
          <p className="text-sm text-gray-500">Bienvenue, {user?.first_name || user?.email}</p>
        </div>
        <Link to="/host/establishments" className="btn-primary">
          <Hotel className="mr-2 h-4 w-4" />
          Mes établissements
        </Link>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Établissements', value: stats.total_establishments, icon: Hotel, color: 'text-blue-600 bg-blue-50' },
          { label: 'Réservations', value: stats.total_bookings, icon: Calendar, color: 'text-purple-600 bg-purple-50' },
          { label: 'À venir', value: stats.upcoming, icon: Users, color: 'text-green-600 bg-green-50' },
          { label: 'Revenus estimés', value: `${stats.revenue.toLocaleString()} FCFA`, icon: DollarSign, color: 'text-brand-600 bg-orange-50' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{kpi.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{kpi.value}</p>
              </div>
              <div className={`rounded-lg p-2 ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Réservations récentes</h2>
          <Link to="/bookings" className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center">
            Voir tout <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {loadingBook ? (
          <div className="flex h-32 items-center justify-center">
            <Loader className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        ) : (
          <div className="mt-4 divide-y">
            {(bookings?.results || []).slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{b.establishment_name}</p>
                  <p className="text-xs text-gray-500">{b.check_in_date} - {b.guest_name}</p>
                </div>
                <span className="text-sm font-semibold text-gray-900">{Number(b.total_amount).toLocaleString()} FCFA</span>
              </div>
            ))}
            {(bookings?.results || []).length === 0 && (
              <p className="py-6 text-center text-sm text-gray-500">Aucune réservation pour le moment.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
