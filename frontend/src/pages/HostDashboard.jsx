import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Hotel, Calendar, ArrowRight, Loader, DollarSign, Users,
  TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, Plus,
} from 'lucide-react';

const STATUS_COLORS = {
  confirmed: 'bg-green-50 text-green-700',
  in_progress: 'bg-blue-50 text-blue-700',
  completed: 'bg-gray-50 text-gray-700',
  cart: 'bg-yellow-50 text-yellow-700',
  cancelled_by_guest: 'bg-red-50 text-red-700',
  cancelled_by_host: 'bg-red-50 text-red-700',
};

const STATUS_LABELS = {
  confirmed: 'Confirmée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cart: 'En attente de paiement',
  cancelled_by_guest: 'Annulée (voyageur)',
  cancelled_by_host: 'Annulée (hôte)',
};

export default function HostDashboard() {
  const { user } = useAuth();

  const { data: establishments, isLoading: loadingEst } = useQuery(
    'myEstablishments',
    async () => {
      const { data } = await api.get('/establishments/my_establishments/');
      return data;
    }
  );

  const { data: bookingsData, isLoading: loadingBook } = useQuery(
    'hostBookings',
    async () => {
      const { data } = await api.get('/bookings/');
      return data;
    }
  );

  const bookings = bookingsData?.results || [];
  const activeBookings = bookings.filter((b) => ['confirmed', 'in_progress'].includes(b.status));
  const pendingPayment = bookings.filter((b) => b.status === 'cart');
  const revenue = bookings
    .filter((b) => ['confirmed', 'in_progress', 'completed'].includes(b.status))
    .reduce((sum, b) => sum + Number(b.total_amount), 0);

  // Revenus du mois en cours
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthRevenue = bookings
    .filter((b) => ['confirmed', 'in_progress', 'completed'].includes(b.status) && b.created_at?.startsWith(thisMonth))
    .reduce((sum, b) => sum + Number(b.total_amount), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Hébergeur</h1>
          <p className="text-sm text-gray-500">
            Bienvenue, <span className="font-medium">{user?.first_name || user?.email}</span>
          </p>
        </div>
        <Link to="/host/establishments" className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          Gérer mes établissements
        </Link>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: 'Établissements',
            value: loadingEst ? '...' : (establishments?.length || 0),
            icon: Hotel,
            color: 'text-blue-600 bg-blue-50',
            sub: `${establishments?.filter(e => e.status === 'active').length || 0} actif(s)`,
          },
          {
            label: 'Réservations actives',
            value: loadingBook ? '...' : activeBookings.length,
            icon: Calendar,
            color: 'text-green-600 bg-green-50',
            sub: `${pendingPayment.length} en attente de paiement`,
          },
          {
            label: 'Revenus totaux',
            value: loadingBook ? '...' : `${revenue.toLocaleString('fr-FR')} FCFA`,
            icon: DollarSign,
            color: 'text-orange-600 bg-orange-50',
            sub: 'Réservations confirmées',
          },
          {
            label: 'Ce mois-ci',
            value: loadingBook ? '...' : `${monthRevenue.toLocaleString('fr-FR')} FCFA`,
            icon: TrendingUp,
            color: 'text-purple-600 bg-purple-50',
            sub: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
          },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{kpi.label}</p>
                <p className="mt-1 truncate text-xl font-bold text-gray-900">{kpi.value}</p>
                <p className="mt-0.5 text-xs text-gray-400">{kpi.sub}</p>
              </div>
              <div className={`shrink-0 rounded-lg p-2 ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Réservations récentes */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Réservations récentes</h2>
            <Link to="/host/bookings" className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
              Voir tout <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {loadingBook ? (
            <div className="flex h-32 items-center justify-center">
              <Loader className="h-6 w-6 animate-spin text-primary-600" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="mt-4 rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
              Aucune réservation pour le moment.
            </div>
          ) : (
            <div className="mt-4 divide-y">
              {bookings.slice(0, 6).map((b) => (
                <div key={b.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{b.establishment_name}</p>
                    <p className="text-xs text-gray-500">
                      {b.check_in_date} → {b.check_out_date} · {b.total_nights} nuit(s)
                    </p>
                  </div>
                  <div className="ml-3 shrink-0 text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {Number(b.total_amount).toLocaleString('fr-FR')} FCFA
                    </p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[b.status] || 'bg-gray-50 text-gray-700'}`}>
                      {STATUS_LABELS[b.status] || b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mes établissements */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Mes établissements</h2>
            <Link to="/host/establishments" className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
              Gérer <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          {loadingEst ? (
            <div className="flex h-32 items-center justify-center">
              <Loader className="h-6 w-6 animate-spin text-primary-600" />
            </div>
          ) : (establishments || []).length === 0 ? (
            <div className="mt-4 rounded-lg bg-gray-50 p-6 text-center">
              <Hotel className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">Aucun établissement.</p>
              <Link to="/host/establishments" className="btn-primary mt-3 inline-block text-sm">
                Ajouter un établissement
              </Link>
            </div>
          ) : (
            <div className="mt-4 divide-y">
              {(establishments || []).map((est) => (
                <div key={est.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{est.name}</p>
                    <p className="text-xs text-gray-500">{est.city_quarter}</p>
                  </div>
                  <div className="ml-3 shrink-0 text-right">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      est.status === 'active' ? 'bg-green-50 text-green-700' :
                      est.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {est.status === 'active' ? 'Actif' : est.status === 'pending' ? 'En attente' : est.status}
                    </span>
                    {est.lowest_price && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        dès {Number(est.lowest_price).toLocaleString('fr-FR')} FCFA/nuit
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alerte établissements en attente */}
      {(establishments || []).some((e) => e.status === 'pending') && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-yellow-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Établissement(s) en attente de validation</p>
            <p className="mt-0.5 text-sm text-yellow-700">
              Notre équipe examine votre dossier. Vous recevrez une notification dès la validation.
              Les établissements en attente ne sont pas visibles par les voyageurs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
