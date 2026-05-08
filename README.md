# AfriStay

Plateforme de réservation d'hôtels et de résidences en ligne — Côte d'Ivoire et Afrique de l'Ouest.

## Architecture

- **Backend** : Django 5 + Django REST Framework + JWT + PostgreSQL + Redis
- **Frontend** : React 18 + Vite + Tailwind CSS + React Query
- **Communication** : API REST JSON

## Structure du projet

```
mon-projet/
├── backend/          # Projet Django
│   ├── afristay/     # Configuration projet
│   ├── apps/
│   │   ├── accounts/       # Authentification & profils
│   │   ├── establishments/ # Hébergements, chambres, disponibilités
│   │   ├── bookings/       # Réservations & cycle de vie
│   │   ├── payments/       # Paiements, virements, commissions
│   │   ├── reviews/        # Avis & réponses
│   │   └── notifications/  # Notifications utilisateur
│   ├── manage.py
│   └── requirements.txt
├── frontend/         # Application React
│   ├── src/
│   │   ├── api/            # Client Axios
│   │   ├── components/     # Layout, Navbar, Footer, ProtectedRoute
│   │   ├── context/        # AuthContext
│   │   └── pages/          # Toutes les pages
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

| Ressource | Endpoint |
|-----------|----------|
| Login JWT | `POST /api/auth/login/` |
| Refresh JWT | `POST /api/auth/refresh/` |
| Inscription | `POST /api/accounts/register/` |
| Profil | `GET/PUT /api/accounts/me/` |
| Hébergements | `GET /api/establishments/` |
| Détail hébergement | `GET /api/establishments/{slug}/` |
| Disponibilités | `GET /api/establishments/{slug}/availability/` |
| Réservations | `POST /api/bookings/` |
| Mes réservations | `GET /api/bookings/` |
| Annuler réservation | `POST /api/bookings/{id}/cancel/` |
| Paiements | `POST /api/payments/payments/` |
| Avis | `GET/POST /api/reviews/` |
| Notifications | `GET /api/notifications/` |

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
- Filtres (type, prix, équipements, politique d'annulation)
- Fiche détaillée avec photos, équipements, avis
- Réservation en ligne avec calcul de prix (nuitées + commission)
- Paiement simulé (Wave, Mobile Money, Carte)
- Confirmation avec numéro de réservation
- Historique des réservations
- Profil utilisateur

### Hébergeur
- Tableau de bord (KPI : revenus, taux d'occupation, réservations)
- CRUD établissements
- Gestion du calendrier et des disponibilités
- Tarification par nuit avec prix spéciaux
- Visualisation des réservations reçues

### Admin
- Interface Django Admin complète
- Gestion des utilisateurs, établissements, réservations, paiements, avis
- Configuration des commissions

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

### Frontend
- React 18 + Vite
- React Router DOM 6
- React Query (cache & state serveur)
- Axios (HTTP client)
- Tailwind CSS
- Lucide React (icônes)
- date-fns (dates)

---

## Notes de développement

- Le système de paiement est simulé en MVP. Intégrer Wave, Orange Money, Stripe via webhooks en production.
- Les disponibilités utilisent un verrou temporaire de 15 minutes sur le panier pour éviter le surbooking.
- Les commissions sont calculées automatiquement lors de la création d'une réservation.
- Les avis ne sont accessibles qu'après un séjour terminé.

---

*Produit pensé selon le paradoxe de Jevons et la méthode BMAIC.*
