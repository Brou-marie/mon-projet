# AFRISTAY : Plateforme de Réservation d'Hébergements
## Résumé pour Mémoire de Soutenance

---

## 1. CONTEXTE ET PROBLÉMATIQUE

### Contexte
AfriStay est une **plateforme numérique de réservation d'hôtels et de résidences** destinée à la **Côte d'Ivoire et à l'Afrique de l'Ouest**. Elle répondà la nécessité croissante de digitaliser le secteur touristique et hôtelier en Afrique francophone.

### Problématique
- Absence de **plateforme unifiée** de réservation d'hébergements touristiques en Afrique de l'Ouest
- Difficultés pour les **voyageurs** à identifier et réserver des hébergements fiables
- Manque de **visibilité numérique** pour les petits et moyens établissements hôteliers
- **Friction dans les paiements** avec les méthodes locales (Orange Money, Wave, Moov Money)
- Absence d'**infrastructure de gestion** pour les hébergeurs

### Objectifs
1. Créer une **plateforme web moderne** et intuitive
2. **Connecter voyageurs et hébergeurs** dans un écosystème numérique
3. **Faciliter les paiements** locaux et internationaux
4. Offrir un **système de gestion** pour les hébergeurs (calendrier, tarification, KPIs)
5. Mettre en place un **système de notation** et d'avis pour la confiance

---

## 2. SOLUTION PROPOSÉE

### Architecture Générale
AfriStay repose sur une **architecture microservices** moderne séparant **Frontend** et **Backend** :

```
Frontend (React)  ←→  API REST JSON  ←→  Backend (Django)
```

### Principes Architecturaux
- **API-First** : Communication entièrement par API REST
- **JWT Authentication** : Sécurité par tokens numériques
- **Scalabilité** : Prête pour la croissance (Redis, Celery)
- **Modularité** : Chaque fonctionnalité isolée dans une application Django

---

## 3. BACKEND (DJANGO REST FRAMEWORK)

### Technologie
- **Framework** : Django 5.0
- **API** : Django REST Framework (DRF)
- **Authentification** : JWT (Json Web Tokens) via django-rest-framework-simplejwt
- **Base de données** : PostgreSQL (production) / SQLite (développement)
- **Cache & Tâches asynchrones** : Redis + Celery
- **Fichiers statiques** : WhiteNoise

### Architecture en Applications Django

#### 1️⃣ **accounts** (Authentification & Profils)
- Modèle `User` personnalisé (UUID, email unique, rôles)
- Endpoint `/api/accounts/register/` : Inscription
- Endpoint `/api/accounts/me/` : Profil utilisateur
- Gestion des **4 rôles** : 
  - `guest` : Voyageur
  - `host` : Hébergeur
  - `moderator` : Modérateur
  - `superadmin` : Super administrateur
- Vérification email/téléphone

#### 2️⃣ **establishments** (Hébergements)
- Modèle `Establishment` : Hôtels, résidences, auberges
- Modèle `Room` : Chambres avec tarification dynamique
- Modèle `Availability` : Calendrier des disponibilités
- Modèle `Amenity` : Équipements (WiFi, AC, Piscine...)
- Endpoints :
  - `GET /api/establishments/` : Liste avec filtres (prix, équipements, destination)
  - `GET /api/establishments/{slug}/` : Détail complet
  - `GET /api/establishments/{slug}/availability/` : Disponibilités
  - `POST /api/establishments/` (host only) : Création d'un établissement
- Recherche par : **destination, dates, nombre de voyageurs**
- Filtrage intelligent par : **type, prix, équipements, politique d'annulation**

#### 3️⃣ **bookings** (Réservations)
- Modèle `Booking` : Réservation avec cycle de vie complet
- États de réservation : `pending` → `confirmed` → `completed` / `cancelled`
- Verrou temporaire (15 min) pour éviter le surbooking
- Calcul automatique du prix :
  - Nuitées × Tarif par nuit
  - + Commissions (intégrateur : 15%, plateforme : 5%)
  - = Montant total
- Endpoints :
  - `POST /api/bookings/` : Créer une réservation
  - `GET /api/bookings/` : Mes réservations
  - `POST /api/bookings/{id}/cancel/` : Annuler

#### 4️⃣ **payments** (Paiements)
- Modèle `Payment` : Transactions sécurisées
- Intégration prête pour : **Wave, Orange Money, Stripe, Mobile Money**
- Simulation de paiement en MVP (prête pour webhooks)
- Gestion des **remboursements** et **virements**
- Suivi des **commissions** (15% intégrateur + 5% plateforme)
- Endpoint `POST /api/payments/payments/` : Créer paiement

#### 5️⃣ **reviews** (Avis & Notations)
- Modèle `Review` : Avis utilisateur (1-5 étoiles)
- Modèle `ReviewResponse` : Réponse de l'hébergeur
- Accessibilité : **Seulement après séjour terminé** (sécurité)
- Calcul de note moyenne par établissement
- Endpoints :
  - `GET /api/reviews/` : Liste des avis
  - `POST /api/reviews/` : Poster un avis

#### 6️⃣ **notifications** (Notifications)
- Modèle `Notification` : Alertes utilisateur
- Types : Réservation confirmée, paiement reçu, nouvel avis...
- Intégration SMS/Email prête (Twilio, SendGrid)
- Endpoint `GET /api/notifications/` : Récupérer notifications

### Base de Données (Schéma)
```
User (UUID) 
  ├── Establishment (Hébergeur → Établissements)
  │   ├── Room (Chambres)
  │   │   └── Availability (Calendrier)
  │   └── Amenity (Équipements)
  │
  ├── Booking (Voyageur → Réservations)
  │   ├── Payment (Paiements)
  │   └── Review (Avis)
  │       └── ReviewResponse (Réponses)
  │
  └── Notification (Notifications)
```

### Sécurité
- **Authentification JWT** : Tokens expirables, refresh tokens
- **Token Blacklist** : Déconnexion sécurisée
- **CORS** : Contrôle d'accès cross-origin
- **Rôles & Permission** : Vérification à chaque endpoint
- **Variables d'environnement** : Secrets sécurisés (.env)
- **HTTPS prêt** : Whitenoise pour production

---

## 4. FRONTEND (REACT 18 + VITE)

### Technologie
- **Framework** : React 18
- **Bundler** : Vite (ultra-rapide)
- **Routing** : React Router DOM 6
- **HTTP Client** : Axios
- **State Management** : React Context + React Query
- **Styling** : Tailwind CSS
- **Icônes** : Lucide React
- **Dates** : date-fns

### Architecture Composants

#### Structure Hiérarchique
```
App.jsx (Racine)
├── MiseEnPage.jsx (Layout principal)
│   ├── BarreNavigation.jsx (Barre de navigation)
│   ├── Router (Pages)
│   │   ├── Page Accueil
│   │   ├── Page Connexion / Inscription
│   │   ├── Page Recherche (ResultatsRecherche)
│   │   ├── Page Détail Hébergement
│   │   ├── Page Réservation
│   │   ├── Page Confirmation
│   │   ├── Page Mes Réservations
│   │   ├── Page Profil
│   │   ├── Page Tableau de Bord Hôte (pour hosts)
│   │   ├── Page Hébergements de l'Hôte
│   │   ├── Page Réservations Reçues (pour hosts)
│   │   └── RouteProtegee.jsx (Routes sécurisées)
│   └── PiedDePage.jsx (Pied de page)
└── ContexteAuth.jsx (Gestion authentification globale)
```

#### Pages Principales (Use Cases)

**👤 Voyageur**
- `Accueil.jsx` : Recherche simple (destination, dates, voyageurs)
- `ResultatsRecherche.jsx` : Filtres avancés + liste résultats
- `DetailHebergement.jsx` : Fiche complète (photos, équipements, avis, tarifs)
- `Reservation.jsx` : Panier + formulaire réservation
- `Confirmation.jsx` : Confirmation + numéro réservation
- `MesReservations.jsx` : Historique réservations + annulation
- `Profil.jsx` : Édition profil utilisateur
- `Connexion.jsx` / `Inscription.jsx` : Auth

**🏨 Hébergeur**
- `TableauDeBordHote.jsx` : KPIs (revenus, occupation, réservations)
- `HebergementsHote.jsx` : CRUD établissements + photos
- `ReservationsHote.jsx` : Gestion des réservations reçues

#### Client API (clientApi.js)
```javascript
Module Axios centralisé :
- Headers automatiques (Authorization: Bearer token)
- Base URL dynamique
- Interception erreurs 401 (renouvelle token)
- Gestion des cookies d'authentification
```

#### Context d'Authentification (ContexteAuth.jsx)
- Gestion du token JWT
- Stockage user (localStorage)
- État de connexion global
- Refresh automatique du token

### Design UI/UX
- **Responsive** : Mobile-first avec Tailwind CSS
- **Thème** : Minimaliste, couleurs chaleureuses (Afrique)
- **Navigation** : Intuitive, breadcrumbs
- **Accessibilité** : ARIA labels, contraste texte
- **Performance** : Vite optimise le bundling

---

## 5. FONCTIONNALITÉS IMPLÉMENTÉES

### 🔐 Authentification & Autorisations
- ✅ Inscription email
- ✅ Connexion JWT
- ✅ Refresh tokens
- ✅ Déconnexion (token blacklist)
- ✅ Rôles (guest, host, moderator, superadmin)

### 🏨 Hébergements & Disponibilités
- ✅ CRUD établissements
- ✅ Gestion des chambres
- ✅ Calendrier des disponibilités
- ✅ Tarification par nuit
- ✅ Images/photos d'établissements
- ✅ Équipements/Amenities
- ✅ Politique d'annulation

### 🔍 Recherche & Filtrage
- ✅ Recherche par destination
- ✅ Filtrage par dates (check-in/check-out)
- ✅ Filtrage par nombre voyageurs
- ✅ Filtres avancés : prix, type, équipements, note
- ✅ Tri : prix asc/desc, note, popularité

### 📅 Réservations
- ✅ Système de panier (15 min de verrou)
- ✅ Calcul prix automatique
- ✅ Confirmation réservation
- ✅ Numéro de confirmation
- ✅ Annulation de réservation
- ✅ États (pending → confirmed → completed)

### 💳 Paiements
- ✅ Interface de paiement
- ✅ Support paiements simulés
- ✅ Calcul commissions (15% + 5%)
- ✅ Historique transactions
- ✅ Intégration Wave/Mobile Money (prêt)

### ⭐ Avis & Notes
- ✅ Système 5 étoiles
- ✅ Avis textuels
- ✅ Réponses des hébergeurs
- ✅ Note moyenne par établissement
- ✅ Modération (super admin)

### 📬 Notifications
- ✅ Système notifications utilisateur
- ✅ Types : réservation, paiement, avis, annulation
- ✅ Intégration email/SMS (prêt)

### 📊 Tableau de Bord Hôte
- ✅ KPIs : revenus, taux d'occupation, réservations
- ✅ Calendrier des réservations
- ✅ Gestion établissements
- ✅ Gestion chambres & tarification

### 🔧 Admin Django
- ✅ Interface admin complète
- ✅ CRUD entités
- ✅ Gestion utilisateurs
- ✅ Configuration commissions

---

## 6. FLUX MÉTIER (USER JOURNEYS)

### 🚀 Flux Voyageur
```
1. Accueil → Recherche (destination, dates, voyageurs)
2. Résultats + Filtres avancés
3. Click établissement → Détail (photos, avis, équipements)
4. Sélection chambre + Réservation
5. Panier (15 min verrou) + Vérification prix
6. Paiement (Wave, Carte, Mobile Money)
7. Confirmation + Email
8. Mes réservations → Historique
9. Après séjour : Laisser avis
```

### 🏨 Flux Hébergeur
```
1. Inscription + Vérification email
2. Tableau de bord (KPIs)
3. Créer établissement (infos, localisation, photos)
4. Ajouter chambres + Tarification
5. Gérer disponibilités/calendrier
6. Voir réservations reçues
7. Confirmer/Refuser réservations
8. Retrait argent vers compte bancaire
```

### 👨‍⚖️ Flux Modérateur
```
1. Modérer avis (valider/rejeter)
2. Vérifier établissements neufs
3. Gérer signalements utilisateurs
4. Répondre à litiges de réservations
```

---

## 7. INFRASTRUCTURE & DÉPLOIEMENT

### Environnements
- **Développement** : SQLite + Vite dev server
- **Production** : PostgreSQL + Redis + Gunicorn + Nginx

### Stack Production (Recommandé)
```
┌─────────────────────────────────────────┐
│  Frontend (React/Vite)                  │
│  Déployé sur : Vercel / Netlify / AWS S3 │
└──────────────┬──────────────────────────┘
               │ API REST /api/...
┌──────────────▼──────────────────────────┐
│  Backend (Django)                       │
│  Serveur : Heroku / PythonAnywhere / AWS │
│  - Gunicorn (WSGI)                      │
│  - PostgreSQL 14+                       │
│  - Redis (Celery)                       │
└─────────────────────────────────────────┘
```

### Variables d'Environnement (.env)
```env
DEBUG=False
SECRET_KEY=xxx
DATABASE_URL=postgres://user:pass@localhost
REDIS_URL=redis://localhost:6379
JWT_SECRET=xxx
CORS_ALLOWED_ORIGINS=https://afristay.com
```

---

## 8. ROADMAP FUTURE

### Court terme (3-6 mois)
- ✨ Intégration paiements réels (Wave, Orange Money)
- ✨ Notifications email/SMS (Twilio, SendGrid)
- ✨ Système de messages en direct
- ✨ Application mobile (React Native)

### Moyen terme (6-12 mois)
- 📱 App iOS et Android natif
- 🤖 Recommandations IA (machine learning)
- 🗺️ Carte interactive (Mapbox)
- 📈 Analytics avancées (Google Analytics 4)
- 🌍 Support multilingue (FR, EN, +autres langues africaines)

### Long terme (1-2 ans)
- 🏆 Marketplace pour services complémentaires (restauration, tours)
- 💼 API partenaires (OTAs, agences de voyage)
- 🎯 Assurance voyage intégrée
- 🌗 Intégration blockchain pour paiements crypto

---

## 9. POINTS CLÉS INNOVANTS

### 🌍 Adaptation Africaine
- **Paiements locaux** : Wave, Orange Money, MTN Money (Afrique Ouest)
- **Devise lokale** : Support CFA, Naira, etc.
- **Infrastructure locale** : PostgreSQL/Redis en data centers africains
- **Langage français** : Interface 100% francophone

### 💡 Modèle Économique
- **Commission intégrateur** : 15%
- **Commission plateforme** : 5%
- **Pricing dynamique** : Tarifs variables par saison
- **Système de révision** : Hébergeurs reçoivent ~80% du prix

### 🔒 Sécurité & Confiance
- **Vérification identité** : Email + Téléphone
- **Modération** : Avis vérifiés, établissements validés
- **Escrow** : Argent en verrou 48h après checkout-out
- **Assurance annulation** : Protection réservations

---

## 10. MÉTRIQUES & KPIs

### Métriques de Plateforme
| Métrique | Cible |
|----------|-------|
| Établissements actifs | 5000+ |
| Utilisateurs | 100k+ |
| Réservations/mois | 10k+ |
| Revenus/mois | 5M CFA+ |
| Taux annulation | <5% |
| Note moyenne | 4.5+/5 |

### KPIs Hôte (Dashboard)
- Revenus totaux & par mois
- Taux d'occupation
- Nombre réservations
- Revenu par chambre (RevPAR)
- Note établissement
- Temps réponse moyen

---

## 11. CONCLUSION

**AfriStay** est une solution **end-to-end** moderne et scalable pour digitaliser l'industrie hôtelière africaine. Elle combine :

✅ **Technologie moderne** (React, Django, JWT, PostgreSQL)
✅ **UX intuitive** pour voyageurs et hébergeurs  
✅ **Infrastructure prête pour la croissance** (Redis, Celery)  
✅ **Adaptation locale** (paiements, langue, devises)  
✅ **Modèle économique viable** (marges claires, paiements sécurisés)  

Le projet est **MVP-ready** et peut être étendu progressivement vers applications mobiles, IA, et services complémentaires.

---

**📅 Date** : Mai 2026  
**🎯 Statut** : En développement / Prêt pour pilots régionaux  
**👥 Équipe** : Développement Full-Stack (Frontend + Backend)
