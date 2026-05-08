1. Description de l'existant  AfriHome CI
Qu'est-ce que c'est ?
AfriHome CI est une place de marché immobilière de location longue durée, pensée pour la Côte d'Ivoire. C'est un site web qui met en relation trois acteurs :

Le locataire : cherche un logement (appartement, studio, villa, chambre).
Le propriétaire : publie son bien, reçoit des demandes de contact.
L'administrateur : modère les annonces, valide des paiements, surveille l'activité.
Ce que le produit permet aujourd'hui (flux métier)
Pour un visiteur (non connecté)
Il arrive sur une page d'accueil qui présente les biens disponibles.
Il peut faire une recherche par ville, prix maximum, type de bien (Appartement, Villa, Studio…), et cible (étudiant, famille, professionnel).
Il peut consulter la fiche détaillée d'un bien (photos, description, prix mensuel en FCFA, équipements, localisation).
Il peut s'inscrire pour devenir locataire ou propriétaire.
Pour un locataire (connecté)
Recherche avancée avec filtres plus précis (superficie, nombre de chambres, équipements).
Met des biens en favoris pour les retrouver plus tard.
Consulte son historique de visites (les biens qu'il a déjà regardés).
Pour contacter un propriétaire, il doit passer par un système de paiement : il paie un tarif (calculé selon le prix du bien) via Wave, Mobile Money ou virement bancaire. Une fois le paiement validé par l'admin, il peut envoyer un message au propriétaire.
Gère son profil (nom, email, téléphone, avatar).
Pour un propriétaire (connecté)
Accède à un tableau de bord personnel qui résume son activité.
Peut publier une annonce : titre, description, photos, ville, quartier, prix mensuel, superficie, nombre de chambres et salles de bain, équipements, et un téléphone de contact.
Peut modifier ou supprimer ses biens.
Peut changer le statut d'un bien : disponible, loué, en maintenance, suspendu.
Voir les demandes de contact reçues de la part des locataires.
Consulter des statistiques : nombre de vues de ses annonces, nombre de favoris, revenus mensuels estimés, répartition par ville et par type de bien.
Pour l'administrateur
Tableau de bord global avec les statistiques de la plateforme (nombre d'utilisateurs, de biens, de contacts en attente).
Gestion des utilisateurs : ajouter, modifier, suspendre un compte.
Modération des biens : supprimer une annonce inappropriée.
Gestion des paiements de contact : valider ou refuser un paiement manuellement.
Configuration des tarifs de contact (grille tarifaire selon le prix du bien).
Consultation des logs d'activité.
Le modèle économique actuel
Freemium restreint : la consultation est gratuite, mais le contact est payant.
La plateforme prend une commission à chaque fois qu'un locataire veut obtenir les coordonnées d'un propriétaire.
Il n'y a pas de système de réservation en ligne, ni de paiement de loyer, ni de calendrier de disponibilité. C'est un modèle "annuaire payant".
2. Vision produit TO-BE : Plateforme de Réservation d'Hôtels et de Résidences
Le changement de paradigme
On passe d'un modèle immobilier longue durée (loyer mensuel, contrat de location) à un modèle hôtellerie et résidences courte durée (séjour de nuitées, chambre d'hôtel, appart-hôtel, résidence meublée).

Pourquoi ce pivot ?
Un locataire cherche un toit pour des années ; un voyageur cherche un toit pour des nuits.
Le flux de réservation courte durée exige du temps réel : disponibilité instantanée, prix par nuit, calendrier bloqué, confirmation immédiate ou quasi-immédiate.
Le paiement n'est plus un simple "droit de contact", c'est un engagement financier (acompte ou paiement total du séjour).
3. Application du Paradoxe de Jevons
La théorie (rappel)
William Stanley Jevons a observé que lorsqu'une technologie rend l'utilisation d'une ressource plus efficace, la consommation totale de cette ressource augmente souvent, et non l'inverse. Exemple historique : les machines à vapeur plus efficaces ont entraîné une consommation totale de charbon plus élevée.

Application produit
Dans notre plateforme de réservation :

La ressource = les nuitées d'hébergement et la capacité hôtelière.
L'efficacité = la facilité de recherche (filtres intelligents, carte interactive), la rapidité de réservation (3 clics), la confiance (avis vérifiés, photos 360°, chat intégré), et les paiements mobiles instantanés.
Conséquence produit (le paradoxe) : Rendre la réservation ultra-fluide et accessible ne réduira pas la demande d'hébergement. Au contraire, elle augmentera le volume total de nuitées réservées car :

Des voyageurs occasionnels deviendront des voyageurs fréquents (friction réduite).
Des segments nouveaux (jeunes, professionnels du jour) accéderont au marché.
Les résidences meublées seront réservées pour des durées intermédiaires (semaines), créant un nouveau marché.
Décision produit déduite : Il ne faut pas construire pour le volume d'aujourd'hui. Il faut architecturer la plateforme pour absorber une croissance massive de la consommation d'hébergement. Cela implique :

Un moteur de recherche très performant (indexation rapide, filtres géospatiaux).
Un système de disponibilité en temps réel (pas de surbooking).
Une infrastructure de paiement scalable.
Un algorithme de recommandation qui augmente la découverte (plus de choix = plus de consommation).
4. Application du Business Model Canvas (BMC / BMAIC)
J'interprète ta demande "BMAIC" comme une approche Business Model Analyse-Innovation-Création, structurée autour du Business Model Canvas d'Alexander Osterwalder, adaptée à notre pivot.

Bloc BMC	Avant (AfriHome Location)	Après (AfriHome Booking Hôtels & Résidences)
Partenaires clés	Propriétaires privés, agences immobilières locales	Chaînes hôtelières, résidences meublées, conciergeries, prestataires de paiement mobile (Wave, MTN MoMo, Orange Money), assureurs voyage
Activités clés	Publication d'annonces, modération manuelle, validation de paiements de contact	Gestion du stock de chambres en temps réel, traitement des réservations instantanées, service client 24h, marketing digital ciblé
Ressources clés	Base de données de biens, équipe de modération	API de disponibilité (channel manager), algorithme de pricing dynamique, photos professionnelles, données d'avis clients
Proposition de valeur	Trouver un logement à louer au mois en Côte d'Ivoire	Réserver une chambre d'hôtel ou une résidence en ligne, en quelques clics, avec confirmation immédiate et paiement mobile
Relation client	Formulaire de contact, email, validation manuelle par admin	Chatbot d'aide à la réservation, notifications push de confirmation, programme de fidélité, assistance en ligne
Canaux	Site web responsive, bouche-à-oreille	Site web React, application mobile future, réseaux sociaux, partenariats B2B (entreprises pour déplacements professionnels)
Segments clients	Locataires locaux, propriétaires ivoiriens	Voyageurs nationaux, diaspora (réservation depuis l'étranger), entreprises (déplacements pro), touristes régionaux
Structure de coûts	Hébergement serveur, modération humaine, marketing local	Hébergement cloud scalable, commissions aux partenaires photo/content, acquisition client (ads), licences de channel manager
Flux de revenus	Commission sur le paiement de contact (accès aux coordonnées)	Commission par nuitée réservée (15-25 %), frais de service voyageur, abonnement mensuel pour hôteliers (premium visibility), upsell (petit-déjeuner, navette)
5. Les Écrans, Endpoints et Logique
A. Les nouveaux rôles utilisateurs
Rôle	Description
Voyageur	Recherche, compare, réserve, paie, laisse un avis.
Hôtelier / Gérant de résidence	Gère son établissement (chambres, tarifs, disponibilités), consulte ses réservations, répond aux avis.
Administrateur plateforme	Modère, gère les litiges, accède aux statistiques globales, configure la commission.
Agent de conciergerie (optionnel futur)	Gère le check-in/check-out physique pour les résidences.
B. Les écrans (expérience utilisateur)
Espace Voyageur (React)
Accueil : moteur de recherche central (destination, dates d'arrivée/départ, nombre de voyageurs), carrousels de promotions, destinations tendance.
Résultats de recherche : carte interactive + liste de cartes d'établissements, filtres (prix par nuit, catégorie, équipements, note, politique d'annulation).
Fiche Établissement : galerie photos, description, carte géographique, calendrier de disponibilité, sélection du type de chambre, avis clients détaillés.
Réservation : récapitulatif du séjour, choix des options (petit-déjeuner, navette), saisie des voyageurs, paiement sécurisé.
Mes Réservations : liste des séjours à venir, passés, annulés. Téléchargement de la confirmation.
Mon Compte : profil, documents de voyage, moyens de paiement enregistrés, préférences.
Messagerie : chat avec l'hôtelier avant ou après la réservation.
Espace Hôtelier / Résidence (React)
Tableau de bord : taux d'occupation, revenus du jour, réservations à venir, alertes.
Gestion des Chambres : CRUD des types de chambres, capacité, photos, description.
Calendrier de Disponibilité : vue mensuelle/hebdomadaire, blocage de dates, gestion des prix par nuit (tarification manuelle ou dynamique).
Réservations : liste des réservations, détails du client, statut (confirmée, en attente, annulée, terminée).
Avis : répondre aux avis des voyageurs.
Tarifs et Promotions : créer des offres spéciales (early bird, last minute).
Espace Admin (React)
Dashboard global : KPI (nombre de réservations, GMV — volume d'affaires brut, taux d'annulation, acquisition).
Gestion des Établissements : validation des nouveaux hôteliers, suspension.
Gestion des Utilisateurs : voyageurs et hôteliers.
Modération : avis signalés, litiges réservation.
Finances : suivi des commissions encaissées, paiements à reverser aux hôteliers, rapports comptables.
Configuration : taux de commission, politiques d'annulation par défaut, catégories d'établissements.
C. Les endpoints logiques (ce que le backend Django doit exposer)
Authentification & Utilisateurs
POST /auth/register — Inscription voyageur ou hôtelier (vérification email/téléphone).
POST /auth/login — Connexion (JWT).
POST /auth/refresh — Rafraîchissement du token.
GET /auth/me — Profil connecté.
PUT /users/me — Mise à jour du profil.
Recherche & Catalogue (lecture publique)
GET /search — Recherche par destination + dates + voyageurs. Retourne liste d'établissements avec prix minimum disponible.
GET /establishments/{id} — Détail d'un établissement + types de chambres disponibles pour les dates demandées.
GET /establishments/{id}/reviews — Avis clients paginés.
GET /establishments/{id}/availability — Calendrier de disponibilité pour un type de chambre.
Réservations (logique cœur)
POST /bookings — Création d'une réservation (verrou temporaire de la chambre pendant 15 min).
POST /bookings/{id}/payment — Initiation du paiement (intégration Wave/MoMo).
POST /bookings/{id}/payment/confirm — Confirmation webhook du prestataire de paiement.
GET /bookings — Liste des réservations du voyageur.
GET /bookings/{id} — Détail d'une réservation.
POST /bookings/{id}/cancel — Annulation selon la politique (remboursement partiel ou total).
Espace Hôtelier
GET /host/dashboard — Stats du jour.
GET /host/rooms — Types de chambres de l'hôtelier.
POST /host/rooms — Ajouter un type de chambre.
PUT /host/rooms/{id} — Modifier.
GET /host/availability — Disponibilités.
PUT /host/availability — Mettre à jour les disponibilités / prix.
GET /host/bookings — Réservations reçues.
PUT /host/bookings/{id}/status — Marquer comme honorée, no-show, etc.
POST /host/reviews/{id}/reply — Répondre à un avis.
Admin
GET /admin/stats — KPI globaux.
GET /admin/establishments — Liste à modérer.
PUT /admin/establishments/{id}/status — Valider / suspendre.
GET /admin/bookings — Toutes les réservations (filtres).
GET /admin/finance/summary — Commissions et paiements.
GET /admin/users — Gestion utilisateurs.
D. La logique métier critique (règles du jeu)
1. Disponibilité et surbooking
Une chambre a un stock (ex: 5 chambres "Standard Double").
Une réservation réduit le stock disponible pour les nuits concernées.
Un verrou pessimiste de 15 minutes est posé lorsqu'un voyageur initie une réservation (panier). Si le paiement n'est pas confirmé, le stock est libéré.
2. Tarification dynamique
Prix de base par nuit défini par l'hôtelier.
Possibilité de prix différents selon le jour de la semaine ou la saison.
La plateforme peut appliquer un markup (commission incluse dans le prix affiché au voyageur).
3. Politique d'annulation
Définie par catégorie (flexible, modérée, stricte).
Calcul automatique du montant remboursé en fonction du délai avant l'arrivée.
4. Commission
Le voyageur paie le prix affiché.
À la fin du séjour (ou à la confirmation), la plateforme conserve X% (ex: 15 %) et reverse le reste à l'hôtelier.
L'hôtelier voit son solde dans son dashboard.
5. Notifications
Email/SMS de confirmation de réservation.
Rappel 24h avant l'arrivée.
Notification à l'hôtelier pour chaque nouvelle réservation.
Notification de paiement reçu / à reverser.
6. Synthèse avant de coder
Tu possèdes aujourd'hui un MVP de place de marché immobilière fonctionnel mais qui a atteint ses limites conceptuelles (pas de temps réel, pas de transaction de réservation, modération lourde).

La direction produit recommandée est un pivot complet vers la réservation courte durée, en exploitant le paradoxe de Jevons : plus la plateforme sera fluide et efficace, plus elle générera de volume. Il faut donc construire scalable dès le départ avec une architecture moderne (React + Django REST) capable de gérer :

La disponibilité en temps réel.
Les paiements instantanés.
La découverte algorithmique (recommandations).
Prochaine étape : dis-moi si cette vision produit te convient, si tu veux ajuster les rôles, les commissions, ou les canaux de paiement, et je commencerai la création du projet Django + React avec la base de données et les endpoints.