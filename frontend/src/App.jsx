import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/ContexteAuth';
import MiseEnPage from './components/MiseEnPage';
import RouteProtegee from './components/RouteProtegee';

import Accueil from './pages/Accueil';
import ResultatsRecherche from './pages/ResultatsRecherche';
import DetailHebergement from './pages/DetailHebergement';
import Reservation from './pages/Reservation';
import Confirmation from './pages/Confirmation';
import Connexion from './pages/Connexion';
import Inscription from './pages/Inscription';
import Profil from './pages/Profil';
import MesReservations from './pages/MesReservations';
import TableauDeBordHote from './pages/TableauDeBordHote';
import HebergementsHote from './pages/HebergementsHote';
import ReservationsHote from './pages/ReservationsHote';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<MiseEnPage />}>
          {/* Pages publiques */}
          <Route index element={<Accueil />} />
          <Route path="recherche" element={<ResultatsRecherche />} />
          <Route path="hebergements/:slug" element={<DetailHebergement />} />
          <Route path="connexion" element={<Connexion />} />
          <Route path="inscription" element={<Inscription />} />

          {/* Pages voyageur uniquement */}
          <Route path="reservation/:slug" element={
            <RouteProtegee roleRequis="guest"><Reservation /></RouteProtegee>
          } />
          <Route path="confirmation/:bookingNumber" element={
            <RouteProtegee roleRequis="guest"><Confirmation /></RouteProtegee>
          } />
          <Route path="mes-reservations" element={
            <RouteProtegee roleRequis="guest"><MesReservations /></RouteProtegee>
          } />

          {/* Pages communes (connecté) */}
          <Route path="profil" element={
            <RouteProtegee><Profil /></RouteProtegee>
          } />

          {/* Pages hôte uniquement */}
          <Route path="hote/tableau-de-bord" element={
            <RouteProtegee roleRequis="host"><TableauDeBordHote /></RouteProtegee>
          } />
          <Route path="hote/hebergements" element={
            <RouteProtegee roleRequis="host"><HebergementsHote /></RouteProtegee>
          } />
          <Route path="hote/reservations" element={
            <RouteProtegee roleRequis="host"><ReservationsHote /></RouteProtegee>
          } />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
