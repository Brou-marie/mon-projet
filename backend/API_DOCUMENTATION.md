# NoamHome API Documentation

## Base URL
- **Development:** `http://127.0.0.1:8000/api/`
- **Production:** `https://api.noamhome.ci/api/`

## Authentication
Toutes les requêtes API nécessitent un JWT token dans le header `Authorization`:
```
Authorization: Bearer <access_token>
```

## Endpoints

### Authentication

#### POST /auth/login/
Connexion utilisateur
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "guest"
  }
}
```

#### POST /auth/register/
Inscription utilisateur
```json
{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+2250700000000",
  "role": "guest"
}
```

#### POST /auth/refresh/
Rafraîchir le token d'accès
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### POST /auth/logout/
Déconnexion
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Public (Visiteur)

#### GET /public/hebergements/vedettes/
Hébergements en vedette
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "name": "Hôtel Abidjan",
      "slug": "hotel-abidjan",
      "city": "Abidjan",
      "establishment_type": "hotel",
      "avg_rating": 4.5,
      "review_count": 150,
      "primary_image": "http://...",
      "lowest_price": 25000
    }
  ]
}
```

#### GET /public/destinations/populaires/
Destinations populaires
```json
{
  "results": [
    {
      "city": "Abidjan",
      "count": 45,
      "avg_price": 35000
    }
  ]
}
```

#### GET /public/hebergements/
Liste des hébergements avec filtres
```
Query params: city, price_min, price_max, date_start, date_end, type
```

#### GET /public/hebergements/<slug>/
Détail d'un hébergement

#### GET /public/hebergements/<slug>/avis/
Avis d'un hébergement

#### GET /public/hebergements/disponibilite/
Vérifier la disponibilité
```json
{
  "room_type_id": "uuid",
  "check_in_date": "2024-07-15",
  "check_out_date": "2024-07-17"
}
```

### Client

#### GET /client/dashboard/
Dashboard client

#### GET /client/reservations/
Liste des réservations du client

#### GET /client/reservations/<id>/
Détail d'une réservation

#### POST /client/avis/
Créer un avis
```json
{
  "booking": "uuid",
  "establishment": "uuid",
  "rating_overall": 5,
  "rating_cleanliness": 5,
  "rating_communication": 5,
  "rating_location": 5,
  "rating_value": 5,
  "comment": "Excellent séjour!"
}
```

#### PUT /client/reservations/<id>/cancel/
Annuler une réservation

### Propriétaire

#### GET /owner/dashboard/
Dashboard propriétaire

#### GET /owner/etablissements/
Liste des établissements du propriétaire

#### POST /owner/etablissements/
Créer un établissement

#### PUT /owner/etablissements/<id>/
Modifier un établissement

#### GET /owner/chambres/
Liste des types de chambres

#### POST /owner/chambres/
Créer un type de chambre

#### GET /owner/disponibilites/
Liste des disponibilités

#### POST /owner/disponibilites/
Créer une disponibilité

#### PUT /owner/disponibilites/<id>/
Modifier une disponibilité

#### GET /owner/reservations/
Liste des réservations

#### PUT /owner/reservations/<id>/approuver/
Approuver une réservation

#### PUT /owner/reservations/<id>/rejeter/
Rejeter une réservation

### Admin

#### GET /admin/dashboard/
Dashboard admin

#### GET /admin/utilisateurs/
Liste des utilisateurs

#### PUT /admin/utilisateurs/<id>/suspendre/
Suspendre un utilisateur

#### GET /admin/etablissements/
Liste de tous les établissements

#### PUT /admin/etablissements/<id>/approuver/
Approuver un établissement

#### DELETE /admin/etablissements/<id>/
Supprimer un établissement

#### GET /admin/avis/
Liste de tous les avis

#### DELETE /admin/avis/<id>/
Supprimer un avis

#### GET /admin/paiements/
Liste de tous les paiements

#### GET /admin/transactions/
Liste de toutes les transactions

#### GET /admin/litiges/
Liste de tous les litiges

#### POST /admin/litiges/resoudre/
Résoudre un litige

### Systèmes Transverses

#### POST /notifications/envoyer/
Envoyer une notification

#### GET /notifications/user/
Notifications de l'utilisateur

#### POST /notifications/push/subscribe/
S'abonner aux notifications push

#### POST /notifications/push/unsubscribe/
Se désabonner des notifications push

#### POST /paiements/init/
Initialiser un paiement
```json
{
  "booking": "uuid",
  "amount": 50000,
  "payment_method": "wave"
}
```

#### POST /paiements/confirmer/
Confirmer un paiement

#### POST /litiges/
Créer un litige
```json
{
  "booking": "uuid",
  "dispute_type": "cancellation",
  "subject": "Annulation",
  "description": "Motif du litige"
}
```

## Codes d'Erreur

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 500 | Server Error |

## Rate Limiting
- 100 requêtes par minute par IP
- 1000 requêtes par heure par utilisateur

## Pagination
Les listes paginées retournent:
- `count`: nombre total d'éléments
- `next`: URL de la page suivante
- `previous`: URL de la page précédente
- `results`: liste des éléments

## Filtres
Les filtres sont passés comme query parameters:
```
?city=Abidjan&price_min=10000&price_max=50000
```

## Tri
Le tri est passé via le paramètre `ordering`:
```
?ordering=-created_at (décroissant)
?ordering=price (croissant)
```
