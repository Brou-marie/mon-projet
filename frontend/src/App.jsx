import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProviderAuth } from './contextes/AuthContexte'
import { DispositionPrincipale } from './composants/mise-en-page/DispositionPrincipale'
import { DispositionTableauBord } from './composants/mise-en-page/DispositionTableauBord'
import { RoutePubliqueSeul, RouteRole } from './composants/routage/RouteProtegee'
import { PageChargement } from './composants/ui/Chargement'

// Publiques
import { PageAccueil } from './pages/publiques/Accueil'
import { PageListeHebergements } from './pages/publiques/ListeHebergements'
import { PageDetailHebergement } from './pages/publiques/DetailHebergement'

// Auth
import { PageConnexion } from './pages/auth/Connexion'
import { PageInscription } from './pages/auth/Inscription'

// Voyageur
import { PageTableauDeBordVoyageur } from './pages/voyageur/TableauDeBord'
import { PageMesReservations } from './pages/voyageur/MesReservations'
import { PageMesAvis } from './pages/voyageur/MesAvis'
import { PageProfilVoyageur } from './pages/voyageur/Profil'
import { PageReservation } from './pages/voyageur/Reservation'

// Hébergeur
import { PageTableauDeBordHebergeur } from './pages/hebergeur/TableauDeBord'
import { PageMesEtablissements } from './pages/hebergeur/MesEtablissements'
import { PageFormulaireEtablissement } from './pages/hebergeur/FormulaireEtablissement'
import { PageMesChambres } from './pages/hebergeur/MesChambres'
import { PageDisponibilites } from './pages/hebergeur/Disponibilites'
import { PageReservationsHebergeur } from './pages/hebergeur/MesReservations'
import { PageProfilHebergeur } from './pages/hebergeur/Profil'

// 404
import { PageNonTrouvee } from './pages/PageNonTrouvee'

export default function App() {
  return (
    <BrowserRouter>
      <ProviderAuth>
        <Suspense fallback={<PageChargement />}>
          <Routes>

            {/* ── Pages publiques ── */}
            <Route element={<DispositionPrincipale />}>
              <Route path="/" element={<PageAccueil />} />
              <Route path="/hebergements" element={<PageListeHebergements />} />
              <Route path="/hebergements/:slug" element={<PageDetailHebergement />} />
              <Route path="/connexion" element={<RoutePubliqueSeul><PageConnexion /></RoutePubliqueSeul>} />
              <Route path="/inscription" element={<RoutePubliqueSeul><PageInscription /></RoutePubliqueSeul>} />
              <Route path="/reservation/:slug" element={<RouteRole role="guest"><PageReservation /></RouteRole>} />
            </Route>

            {/* ── Voyageur ── */}
            <Route path="/voyageur" element={<RouteRole role="guest"><DispositionTableauBord /></RouteRole>}>
              <Route index element={<Navigate to="tableau-de-bord" replace />} />
              <Route path="tableau-de-bord" element={<PageTableauDeBordVoyageur />} />
              <Route path="reservations"    element={<PageMesReservations />} />
              <Route path="avis"            element={<PageMesAvis />} />
              <Route path="profil"          element={<PageProfilVoyageur />} />
            </Route>

            {/* ── Hébergeur ── */}
            <Route path="/hebergeur" element={<RouteRole role="host"><DispositionTableauBord /></RouteRole>}>
              <Route index element={<Navigate to="tableau-de-bord" replace />} />
              <Route path="tableau-de-bord"           element={<PageTableauDeBordHebergeur />} />
              <Route path="etablissements"            element={<PageMesEtablissements />} />
              <Route path="etablissements/nouveau"    element={<PageFormulaireEtablissement />} />
              <Route path="etablissements/:id"        element={<PageFormulaireEtablissement />} />
              <Route path="chambres"                  element={<PageMesChambres />} />
              <Route path="disponibilites"            element={<PageDisponibilites />} />
              <Route path="reservations"              element={<PageReservationsHebergeur />} />
              <Route path="profil"                    element={<PageProfilHebergeur />} />
            </Route>

            {/* ── Admin Django (hors React) ── */}
            <Route path="/admin-panel" element={<RedirectionAdmin />} />

            <Route path="*" element={<PageNonTrouvee />} />
          </Routes>
        </Suspense>
      </ProviderAuth>
    </BrowserRouter>
  )
}

function RedirectionAdmin() {
  React.useEffect(() => { window.location.href = 'http://localhost:8000/admin/' }, [])
  return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Redirection...</p></div>
}
