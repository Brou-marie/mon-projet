# NoamHome

Plateforme de réservation d'hôtels et de résidences premium en ligne — Côte d'Ivoire et Afrique de l'Ouest.

## Architecture

- **Backend** : Django 5 + Django REST Framework + JWT + PostgreSQL + Redis
- **Frontend** : Vue.js + Vite + CSS moderne (PWA-ready)
- **Communication** : API REST JSON
- **PWA** : Progressive Web App avec service worker et manifest

## Structure du projet

```
mon-projet/
├── backend/          # Projet Django
│   ├── NoamHome/     # Configuration projet
│   ├── apps/
│   │   ├── accounts/       # Authentification & profils
│   │   ├── establishments/ # Hébergements, chambres, disponibilités
│   │   ├── bookings/       # Réservations & cycle de vie
│   │   ├── payments/       # Paiements, virements, commissions, factures
│   │   ├── reviews/        # Avis & réponses
│   │   ├── notifications/  # Notifications (email, SMS, push)
│   │   ├── disputes/       # Gestion des litiges
│   │   ├── public/         # API publique pour visiteurs
│   │   ├── client/         # API dashboard client
│   │   ├── owner/          # API dashboard propriétaire
│   │   └── admin_api/      # API dashboard admin
│   ├── manage.py
│   └── requirements.txt
├── frontend/         # Application Vue.js PWA
│   ├── src/
│   │   ├── views/          # Toutes les vues (search, listing, booking, dashboards)
│   │   ├── services/       # Services API et session
│   │   ├── utils.js        # Utilitaires
│   │   ├── styles.css      # Design system moderne
│   │   ├── app.js          # Application Vue
│   │   └── main.js         # Point d'entrée
│   ├── public/
│   │   ├── manifest.json    # Manifest PWA
│   │   └── sw.js           # Service Worker
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Prérequis

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (ou SQLite pour dev rapide)
- Redis (optionnel, pour Celery et cache)

---

## Installation Backend (Django)

### 1. Créer un environnement virtuel

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 2. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 3. Configurer la base de données

Copier le fichier `.env.example` en `.env` et adapter :

```bash
cp .env.example .env
```

**Pour du développement rapide avec SQLite**, modifier `.env` :

```env
DEBUG=True
SECRET_KEY=dev-secret-key-change-me
DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379/0
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

**Pour PostgreSQL en production** :

```env
DATABASE_URL=postgres://user:password@localhost:5432/afristay
```

### 4. Créer la base de données et le super utilisateur

```bash
python manage.py migrate
python manage.py createsuperuser
```

### 5. Lancer le serveur

```bash
python manage.py runserver
```

Le backend est accessible sur `http://localhost:8000`

- API Root : `http://localhost:8000/api/`
- Admin : `http://localhost:8000/admin/`

---

## Installation Frontend (React)

### 1. Installer les dépendances

```bash
cd frontend
npm install
```

### 2. Lancer le serveur de développement

```bash
npm run dev
```

Le frontend est accessible sur `http://localhost:5173`

Le proxy Vite redirige automatiquement les appels `/api` vers le backend Django.

---

## Endpoints API principaux

### Authentification
| Ressource | Endpoint |
|-----------|----------|
| Login JWT | `POST /api/auth/login/` |
| Refresh JWT | `POST /api/auth/refresh/` |
| Inscription | `POST /api/accounts/register/` |
| Profil | `GET/PUT /api/accounts/me/` |

### Public (Visiteurs)
| Ressource | Endpoint |
|-----------|----------|
| Hébergements en vedette | `GET /api/public/featured/` |
| Destinations populaires | `GET /api/public/locations/` |
| Recherche | `GET /api/public/listings/` |
| Détail hébergement | `GET /api/public/listings/{slug}/` |
| Avis | `GET /api/public/listings/{slug}/reviews/` |
| Disponibilités | `POST /api/public/listings/availability/` |

### Client
| Ressource | Endpoint |
|-----------|----------|
| Dashboard | `GET /api/client/dashboard/` |
| Mes réservations | `GET /api/client/bookings/` |
| Annuler réservation | `POST /api/client/bookings/{id}/cancel/` |
| Mes avis | `GET /api/client/reviews/` |

### Propriétaire
| Ressource | Endpoint |
|-----------|----------|
| Dashboard | `GET /api/owner/dashboard/` |
| Mes établissements | `GET /api/owner/establishments/` |
| Mes chambres | `GET /api/owner/rooms/` |
| Disponibilités | `POST /api/owner/availability/bulk_update/` |
| Réservations reçues | `GET /api/owner/bookings/` |

### Admin
| Ressource | Endpoint |
|-----------|----------|
| Dashboard | `GET /api/admin/dashboard/` |
| Utilisateurs | `GET /api/admin/users/` |
| Établissements | `GET /api/admin/establishments/` |
| Litiges | `GET /api/admin/disputes/` |
| Paiements | `GET /api/admin/payments/` |
| Avis | `GET /api/admin/reviews/` |

### Systèmes transverses
| Ressource | Endpoint |
|-----------|----------|
| Réservations | `POST /api/bookings/` |
| Paiements | `POST /api/payments/payments/` |
| Notifications | `GET /api/notifications/` |
| Litiges | `GET /api/disputes/` |

---

## Rôles utilisateurs

| Rôle | Description |
|------|-------------|
| `guest` | Voyageur : recherche, réserve, paie, avise |
| `host` | Hébergeur : gère établissements, calendrier, réservations |
| `moderator` | Modérateur : valide hébergeurs, modère avis, gère litiges |
| `superadmin` | Super admin : KPIs globaux, finances, configuration |

---

## Fonctionnalités implémentées

### Voyageur
- Recherche par destination, dates, voyageurs
- Filtres avancés (type, prix, équipements, politique d'annulation)
- Fiche détaillée avec photos, équipements, avis
- Réservation en ligne avec calcul de prix (nuitées + commission)
- Paiement (Wave, Orange Money, MTN Mobile Money, Carte)
- Génération automatique de factures
- Confirmation avec numéro de réservation
- Historique des réservations
- Programme de fidélité (points, niveaux, réductions)
- Profil utilisateur

### Hébergeur
- Tableau de bord (KPI : revenus, taux d'occupation, réservations)
- CRUD établissements
- Gestion du calendrier et des disponibilités
- Tarification par nuit avec prix spéciaux
- Visualisation des réservations reçues
- Approbation/rejet des réservations
- Gestion des versements
- Configuration des commissions

### Admin
- Tableau de bord avec KPIs globaux
- Gestion des utilisateurs (suspendre/activer)
- Gestion des établissements (approuver/rejeter)
- Gestion des litiges (résoudre, escalader)
- Supervision des paiements
- Modération des avis
- Configuration des commissions

### Systèmes transverses
- **Système de notifications complet** : Email, SMS, Push notifications
- **Système de paiement robuste** : Intégration Wave, Orange Money, MTN
- **Facturation automatique** : Génération de factures PDF
- **Commission automatique** : Calcul automatique des commissions
- **Programme de fidélité** : Points, niveaux (Bronze, Silver, Gold, Platinum), réductions
- **Gestion des litiges** : Système complet de gestion des conflits
- **Sécurité avancée** : CSRF, cookies sécurisés, headers de sécurité

---

## Stack technique détaillée

### Backend
- Django 5.0
- Django REST Framework + SimpleJWT
- PostgreSQL (ou SQLite pour dev)
- django-cors-headers
- django-filter
- Pillow (images)
- python-dotenv
- Celery + Redis (tâches asynchrones)
- Whitenoise (fichiers statiques)
- Unfold (interface admin moderne)

### Frontend
- Vue.js 3 + Vite
- Design system moderne CSS (mobile-first)
- PWA (Progressive Web App)
- Service Worker pour cache offline
- Manifest PWA pour installation
- Axios (HTTP client)
- Support PWA complet

---

## Notes de développement

- Le système de paiement est simulé en MVP. Intégrer Wave, Orange Money, Stripe via webhooks en production.
- Les disponibilités utilisent un verrou temporaire de 15 minutes sur le panier pour éviter le surbooking.
- Les commissions sont calculées automatiquement lors de la création d'une réservation.
- Les avis ne sont accessibles qu'après un séjour terminé.

---

*Produit pensé selon le paradoxe de Jevons et la méthode BMAIC.*

## Support

Pour toute question ou problème, contactez l'équipe de développement.
