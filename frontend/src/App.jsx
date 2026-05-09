import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import EstablishmentDetail from './pages/EstablishmentDetail';
import BookingPage from './pages/BookingPage';
import ConfirmationPage from './pages/ConfirmationPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import MyBookings from './pages/MyBookings';
import HostDashboard from './pages/HostDashboard';
import HostEstablishments from './pages/HostEstablishments';
import HostBookings from './pages/HostBookings';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Pages publiques */}
          <Route index element={<Home />} />
          <Route path="search" element={<SearchResults />} />
          <Route path="establishments/:slug" element={<EstablishmentDetail />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          {/* Pages voyageur uniquement */}
          <Route path="booking/:slug" element={
            <ProtectedRoute requiredRole="guest"><BookingPage /></ProtectedRoute>
          } />
          <Route path="confirmation/:bookingNumber" element={
            <ProtectedRoute requiredRole="guest"><ConfirmationPage /></ProtectedRoute>
          } />
          <Route path="my-bookings" element={
            <ProtectedRoute requiredRole="guest"><MyBookings /></ProtectedRoute>
          } />

          {/* Pages communes (connecté) */}
          <Route path="profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />

          {/* Pages hébergeur uniquement */}
          <Route path="host/dashboard" element={
            <ProtectedRoute requiredRole="host"><HostDashboard /></ProtectedRoute>
          } />
          <Route path="host/establishments" element={
            <ProtectedRoute requiredRole="host"><HostEstablishments /></ProtectedRoute>
          } />
          <Route path="host/bookings" element={
            <ProtectedRoute requiredRole="host"><HostBookings /></ProtectedRoute>
          } />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
