import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../api/client';
import { CheckCircle, Calendar, MapPin, Hotel, Download, QrCode, ArrowLeft } from 'lucide-react';

export default function ConfirmationPage() {
  const { bookingNumber } = useParams();

  const { data: booking, isLoading } = useQuery(['booking', bookingNumber], async () => {
    const { data } = await api.get(`/bookings/${bookingNumber}/`);
    return data;
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-gray-500">Réservation non trouvée.</p>
        <Link to="/" className="btn-primary mt-4 inline-block">Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-xl border bg-white p-8 shadow-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Réservation confirmée !</h1>
        <p className="mt-1 text-gray-500">
          Votre numéro de réservation est <span className="font-mono font-bold text-primary-700">{booking.booking_number}</span>
        </p>

        <div className="mt-6 rounded-lg bg-gray-50 p-4 text-left">
          <div className="flex items-center gap-3 border-b pb-3">
            <Hotel className="h-5 w-5 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">{booking.establishment_name}</p>
              <p className="text-xs text-gray-500">{booking.room_type_name}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="h-4 w-4 text-gray-400" />
              Arrivée : {booking.check_in_date}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="h-4 w-4 text-gray-400" />
              Départ : {booking.check_out_date}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin className="h-4 w-4 text-gray-400" />
              {booking.total_nights} nuit(s)
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              Total : {Number(booking.total_amount).toLocaleString()} FCFA
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="rounded-lg bg-gray-100 p-4">
            <QrCode className="h-32 w-32 text-gray-400" />
            <p className="mt-2 text-xs text-gray-500">QR Code de check-in</p>
          </div>

          <div className="flex w-full gap-3">
            <Link to="/my-bookings" className="btn-outline flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Mes réservations
            </Link>
            <button className="btn-primary flex-1">
              <Download className="mr-2 h-4 w-4" />
              Télécharger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
