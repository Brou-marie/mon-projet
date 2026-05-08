# AfriStay — Plateforme de Réservation d'Hôtels et de Résidences en Ligne

## Document Produit — Vision, Architecture et Stratégie

---

# PARTIE 1 — ÉTAT DES LIEUX DE L'EXISTANT (AfriHome CI)

## 1.1 Qu'est-ce qui existe aujourd'hui ?

Tu possèdes une application web fonctionnelle nommée **AfriHome CI**. C'est une plateforme de mise en relation entre propriétaires de biens immobiliers et personnes cherchant à louer un logement (locataires), ciblant spécifiquement le marché ivoirien.

### Le cœur du système

L'application repose sur trois piliers :

- **Un annuaire de biens immobiliers** : Appartements, studios, villas, chambres, bureaux et maisons. Chaque bien possède un titre, une description, un prix mensuel en FCFA, une localisation (ville et quartier), des photos, des équipements, un nombre de chambres et de salles de bain, ainsi qu'un type de cible (étudiant, famille, professionnel).
- **Un système de comptes utilisateurs** : Quatre rôles distincts coexistent. Le visiteur non connecté peut consulter les annonces. Le locataire connecté peut contacter les propriétaires, sauvegarder des favoris et gérer son profil. Le propriétaire peut publier ses biens, les modifier, suivre les demandes de contact et consulter des statistiques sur ses annonces. L'administrateur modère l'ensemble de la plateforme, valide les comptes et les annonces, et accède aux statistiques globales.
- **Un moteur de recherche filtré** : Les visiteurs et locataires peuvent rechercher des biens par ville, quartier, fourchette de prix, type de bien et profil de locataire visé.

### Les flux métier existants

**Flux locataire** : Un utilisateur arrive sur la page d'accueil, utilise la barre de recherche, consulte la liste des résultats, clique sur un bien pour voir le détail, et peut décider de contacter le propriétaire. Pour contacter le propriétaire, un système de paiement de frais de contact existe : le locataire paie un montant calculé selon le prix du bien (via Wave, Mobile Money ou virement bancaire), et une fois le paiement validé par l'administrateur, il obtient accès au formulaire de message. Le locataire peut aussi ajouter des biens à ses favoris et consulter son historique de visites.

**Flux propriétaire** : Après connexion, le propriétaire accède à un tableau de bord personnel qui lui montre un résumé de son activité (nombre de biens publiés, biens disponibles, biens loués, revenus mensuels estimés). Il peut ajouter un nouveau bien via un formulaire détaillé (titre, description, prix, localisation, photos, équipements). Il reçoit les demandes de contact de locataires intéressés et peut y répondre. Des statistiques par bien (nombre de vues, nombre de favoris) l'aident à évaluer la performance de ses annonces.

**Flux administrateur** : L'admin dispose d'une vue consolidée de l'ensemble de la plateforme. Il peut gérer les utilisateurs (créer, modifier, suspendre), modérer les biens (valider, supprimer), gérer les paiements de contact en attente de validation, et consulter des statistiques globales (nombre d'utilisateurs par rôle, biens disponibles vs loués, demandes en cours, prix moyen).

### Les données stockées

La base de données contient huit tables principales interconnectées : les utilisateurs, les biens immobiliers, les demandes de contact, les favoris, l'historique des visites, les notifications, les paramètres système et les journaux d'activité. Des mécanismes d'automatisation existent déjà sous forme de déclencheurs (triggers) qui mettent à jour automatiquement les compteurs de vues et de favoris, et créent des notifications lors de nouveaux contacts.

### Le modèle de revenu actuel

Le seul modèle de monétisation en place est le **paiement de contact**. Le locataire paie pour débloquer l'accès aux coordonnées du propriétaire. Les tarifs sont progressifs : plus le bien est cher, plus le frais de contact est élevé (de 200 FCFA à plus de 2 000 FCFA selon les tranches).

### Les forces de l'existant

- Système de rôles et de permissions clair
- Moteur de recherche fonctionnel avec filtres
- Système de monétisation par contact déjà implémenté
- Tableaux de bord pour propriétaires et administrateurs
- Gestion des photos et des équipements
- Journal d'activité et traçabilité des actions

### Les limites actuelles

- **Absence de calendrier et de disponibilité** : On ne sait pas si un bien est libre du 15 au 22 août. Le statut est binaire (disponible / loué) sans notion de dates.
- **Pas de réservation en ligne** : Le contact aboutit à un échange manuel. Il n'y a pas de blocage de dates, de confirmation automatique, ni de gestion de séjour.
- **Pas de système de notation et d'avis** : Aucun mécanisme de réputation entre locataires et propriétaires.
- **Interface monolithique** : Le rendu est fait côté serveur (PHP). L'expérience utilisateur n'est pas une application interactive moderne.
- **Pas de gestion des paiements de séjour** : Le paiement ne couvre que le "droit de contact", pas le séjour lui-même.
- **Cible uniquement la location longue durée** : L'architecture est pensée pour des baux mensuels, pas pour des nuitées ou des séjours de courte durée.

---

# PARTIE 2 — VISION PRODUIT : D'AFRHOME CI À AFRISTAY

## 2.1 Le pivot stratégique

Tu ne veux plus simplement "mettre en relation". Tu veux **orchestrer le séjour complet**. Le produit devient une plateforme de réservation d'hôtels et de résidences en ligne, où le voyageur peut consulter, comparer, réserver et payer son hébergement en quelques clics, et où l'hébergeur (hôtelier ou propriétaire de résidence) gère ses disponibilités, ses tarifs, ses réservations et ses clients dans un même espace.

### Différence fondamentale

| Aspect | AfriHome CI (location) | AfriStay (réservation) |
|--------|--------------------------|------------------------|
| Unité de temps | Mois (loyer mensuel) | Nuitée (tarif par nuit) |
| Calendrier | Absent | Cœur du système |
| Transaction | Paiement de contact (one-shot) | Paiement du séjour (intégré) |
| Confirmation | Manuelle (échange téléphonique) | Automatique (si politique le permet) |
| Disponibilité | Statique (disponible / loué) | Dynamique (calendrier temps réel) |
| Cible | Résidents locaux (Côte d'Ivoire) | Voyageurs locaux et internationaux |

---

# PARTIE 3 — APPLICATION DE LA THÉORIE DE JEVONS

## 3.1 Qu'est-ce que le paradoxe de Jevons ?

Le paradoxe de Jevons (énoncé par l'économiste William Stanley Jevons en 1865) observe que lorsqu'une technologie rend l'utilisation d'une ressource plus efficace, la consommation totale de cette ressource augmente paradoxalement, et non diminue. Jevons l'avait constaté avec le charbon : les machines plus efficaces ont fait baisser le coût de l'énergie charbon, ce qui a stimulé une demande bien supérieure à l'économie réalisée.

## 3.2 Comment cela s'applique à ta plateforme ?

**La ressource ici n'est pas le charbon, c'est le "temps de séjour" et le "parcours de réservation".**

Si tu rends la réservation d'un hôtel ou d'une residence extrêmement fluide, rapide et efficace (recherche en 3 clics, paiement instantané, confirmation immédiate, QR code d'enregistrement), tu ne diminueras pas le nombre de réservations. Au contraire, **tu vas démultiplier la demande totale** pour trois raisons :

1. **Effet d'accessibilité** : Des voyageurs qui renonçaient parce que le processus était fastidieux (appeler, négocier, se déplacer pour visiter, payer en espèces) vont désormais réserver. La friction supprimée attire une nouvelle clientèle.
2. **Effet de substitution élargi** : Un voyageur d'affaires qui réservait un hôtel traditionnel va désormais aussi considérer les résidences meublées. Un étudiant qui restait chez un cousin va préférer une chambre d'hôtel abordable. Plus l'offre est facilement comparable et réservable, plus les usages se diversifient.
3. **Effet de fréquence** : Un client satisfait d'une expérience de réservation sans friction réserve plus souvent. La barrière psychologique à la consommation s'effondre.

## 3.3 Les implications produit du paradoxe de Jevons

Ce n'est pas une menace, c'est une opportunité — mais il faut l'anticiper dans la conception :

- **Scalabilité dès le départ** : L'architecture doit supporter un volume de réservations bien supérieur à celui des contacts actuels. Le calendrier et le moteur de disponibilité doivent être conçus pour de hautes fréquences de lecture/écriture.
- **Incitation à l'offre** : Si la demande explose grâce à l'efficacité, il faut que l'offre (hôteliers, propriétaires de résidences) suive. La plateforme doit donc proposer des outils de gestion si efficaces que les hébergeurs gagnent du temps et de l'argent en s'y connectant — c'est la contrepartie Jevons côté fournisseur.
- **Optimisation du taux de conversion** : Chaque seconde gagnée sur le parcours de réservation ne diminue pas le temps total passé sur la plateforme ; il augmente le nombre de réservations réalisées. Il faut donc investir massivement dans la fluidité du parcours (fewer clicks, paiement one-page, autofill).
- **Tarification dynamique** : Plus la réservation est facile, plus les prix peuvent être ajustés en temps réel selon la demande, maximisant le revenu par chambre disponible.

---

# PARTIE 4 — MÉTHODE BMAIC APPLIQUÉE AU PRODUIT

## 4.1 Présentation de la méthode

BMAIC est une méthode itérative d'innovation de business model et de développement produit. Elle s'inspire du Lean Startup et de l'amélioration continue. Les cinq phases sont :

- **B — Build (Concevoir)** : Formuler l'hypothèse de valeur, cartographier le business model cible et définir le périmètre fonctionnel du MVP.
- **M — Measure (Mesurer)** : Identifier les métriques clés (North Star Metric, indicateurs de rétention, taux de conversion) et instrumenter le produit pour les collecter.
- **A — Analyze (Analyser)** : Étudier les comportements utilisateurs, identifier les goulots d'étranglement, comprendre les écarts entre hypothèses et réalité.
- **I — Improve (Améliorer)** : Itérer sur les fonctionnalités, le parcours, le modèle de prix et l'expérience utilisateur en fonction des données collectées.
- **C — Control (Contrôler et scaler)** : Standardiser les processus qui fonctionnent, automatiser la qualité, et préparer l'infrastructure au passage à l'échelle.

## 4.2 Application de BMAIC à AfriStay

### Phase B — Build

**Hypothèse centrale** : Les voyageurs en Côte d'Ivoire (et bientôt en Afrique de l'Ouest) préféreront réserver leurs hébergements sur une plateforme locale qui propose à la fois des hôtels classiques et des résidences meublées, avec un paiement adapté aux moyens locaux (Mobile Money, Wave, cartes bancaires), plutôt que sur des acteurs globaux dont l'offre locale est pauvre et le paiement non adapté.

**Business Model visé** :
- Commission sur chaque réservation réalisée (modèle marketplace)
- Abonnement mensuel pour les hôteliers et gestionnaires de résidences souhaitant apparaître en priorité (modèle SaaS léger)
- Commission réduite en phase de lancement pour créer l'effet Jevons côté offre

**Périmètre MVP** :
- Recherche par destination et dates
- Fiches détaillées avec photos, équipements, avis
- Calendrier de disponibilité temps réel
- Panier et réservation avec paiement intégré
- Espace hébergeur avec gestion des disponibilités et des réservations
- Espace voyageur avec historique et notifications

### Phase M — Measure

**North Star Metric** : Nombre de nuitées réservées et honorées par mois.

**Métriques principales** :
- Taux de conversion recherche → fiche produit → panier → paiement
- Temps moyen pour compléter une réservation
- Taux d'annulation et motifs d'annulation
- Nombre de nouveaux hébergeurs inscrits par semaine
- Revenu moyen par réservation (ARPU)
- Score de satisfaction voyageur et hébergeur (NPS)
- Taux de remplissage moyen des établissements actifs

### Phase A — Analyze

Les questions clés à investiguer en continu :
- À quelle étape du funnel abandonnent les voyageurs ? (recherche, fiche, dates, paiement ?)
- Quels types d'hébergements convertissent le mieux ? (hôtels vs résidences, standing élevé vs économique)
- Quels moyens de paiement sont les plus utilisés et les plus sujets à échec ?
- Les hébergeurs mettent-ils à jour leurs disponibilités régulièrement ou laissent-ils des dates bloquées inutilement ?
- Quelle est la saisonnalité de la demande par ville ? (Abidjan vs Bouaké vs bord de mer)

### Phase I — Improve

Les leviers d'amélioration continus :
- **Personnalisation** : Proposer des recommandations basées sur l'historique de recherche et les réservations passées.
- **Dynamic pricing helper** : Aider les hébergeurs à fixer des tarifs compétitifs selon la demande locale.
- **Réduction de la friction** : Paiement en un clic pour les voyageurs réguliers, autofill des documents d'identité, check-in digital (QR code).
- **Programme de fidélité** : Nuitées offertes après X réservations, accès à des tarifs négociés.
- **Expérience hébergeur** : Tableau de bord simplifié, alertes SMS lors d'une nouvelle réservation, synchronisation avec d'autres canaux de distribution.

### Phase C — Control et Scaler

- **Automatisation de la qualité** : Détection automatique des annonces suspectes (photos floues, prix anormaux, descriptions vides). Vérification d'identité des hébergeurs avant publication.
- **Contrôle des flux financiers** : Reconciliation automatique des paiements, gestion des remboursements selon les politiques d'annulation, reporting fiscal pour les hébergeurs professionnels.
- **Scalabilité géographique** : Répliquer le modèle dans d'autres capitales de la sous-région (Lomé, Accra, Dakar) en gardant l'adaptation locale des moyens de paiement.
- **Gouvernance produit** : Comité de revue mensuel basé sur les métriques BMAIC, feuille de route trimestrielle ajustée en fonction des données.

---

# PARTIE 5 — ACTEURS ET PARCOURS UTILISATEURS

## 5.1 Les quatre acteurs du système

### Le Voyageur (Guest)

Personne physique (locale ou internationale) recherchant un hébergement pour une ou plusieurs nuitées. Il veut trouver rapidement, comparer sereinement, payer en confiance et recevoir une confirmation immédiate.

### L'Hébergeur (Host / Partner)

Deux sous-catégories :
- **Hôtelier professionnel** : Gère plusieurs chambres, a besoin d'un outil de yield management (tarification et disponibilité), de reporting et d'une intégration simple dans son workflow existant.
- **Propriétaire de résidence** : Loue un appartement meublé ou une villa pour de courte durée. Veut un outil simple, avec un calendrier visuel et des notifications directes.

### Le Modérateur / Support

Agent de la plateforme chargé de vérifier les nouvelles inscriptions d'hébergeurs, modérer les avis litigieux, gérer les litiges voyageur-hébergeur et superviser les remboursements.

### Le Super Administrateur

Vision stratégique de la plateforme : statistiques financières globales, gestion des commissions et abonnements, paramètres système, audit de sécurité.

## 5.2 Les parcours critiques (Happy Paths)

### Parcours 1 : Le Voyageur réserve un séjour

1. **Découverte** : Le voyageur arrive sur la page d'accueil et voit une barre de recherche centrale : destination, dates d'arrivée et de départ, nombre de voyageurs.
2. **Exploration** : Il consulte les résultats sous forme de grille ou de carte. Il affine avec des filtres (prix par nuit, type d'hébergement, équipements, note minimale).
3. **Sélection** : Il clique sur une fiche. Il voit un carrousel de photos, la description, la liste des équipements, un mini-calendrier de disponibilité, les avis vérifiés d'autres voyageurs, et le prix total pour ses dates.
4. **Réservation** : Il choisit ses dates sur le calendrier interactif. Le système vérifie la disponibilité en temps réel. Il clique sur "Réserver". Un récapitulatif s'affiche avec le détail du prix (nuitées x tarif, frais de service de la plateforme, taxes locales éventuelles).
5. **Paiement** : Il choisit son moyen de paiement (Wave, Mobile Money Orange/MTN/Moov, carte bancaire). Il saisit ses informations. Le système initie le paiement via un prestataire sécurisé.
6. **Confirmation** : Le paiement validé, le voyageur reçoit une confirmation immédiate par email et SMS avec un numéro de réservation. Un QR code de check-in est généré. La période est bloquée sur le calendrier de l'hébergement.
7. **Séjour** : Le jour J, le voyageur présente son QR code ou son numéro de réservation. Après le séjour, il reçoit une invitation à laisser un avis.

### Parcours 2 : L'Hébergeur gère son établissement

1. **Inscription** : L'hébergeur crée un compte partenaire, renseigne son type (hôtel / résidence), sa localisation, ses coordonnées bancaires pour les virements de commission.
2. **Création de l'offre** : Il crée un hébergement (ou plusieurs chambres dans un hôtel). Pour chaque unité, il upload des photos, rédige une description, coche les équipements, définit le tarif de base par nuit, et configure une politique d'annulation (flexible, modérée, stricte).
3. **Gestion du calendrier** : Il consulte un calendrier mensuel par unité. Il bloque les dates où l'unité est indisponible. Il peut aussi ajuster le tarif à la hausse ou à la baisse pour des périodes spécifiques (événements locaux, haute saison).
4. **Réception des réservations** : Lorsqu'un voyageur réserve, l'hébergeur reçoit une notification instantanée (email, SMS, notification push). Le détail de la réservation s'affiche dans son tableau de bord (dates, nom du voyageur, nombre de voyageurs, montant perçu, commission de la plateforme).
5. **Gestion du séjour** : L'hébergeur peut voir les réservations à venir, en cours et passées. Il peut communiquer avec le voyageur via une messagerie intégrée.
6. **Encaissement** : À la fin du mois (ou selon la fréquence choisie), l'hébergeur reçoit un virement correspondant au total des séjours honorés, moins la commission de la plateforme. Un reçu fiscal est généré automatiquement.

---

# PARTIE 6 — ÉCRANS ET INTERFACES (DESCRIPTION FONCTIONNELLE)

## 6.1 Front-office — Espace Voyageur (React)

### Écran Accueil

- Barre de recherche héroïque : destination (autocomplete sur villes/quartiers), sélecteur de dates (check-in / check-out), sélecteur de voyageurs (adultes, enfants, chambres).
- Sections promotionnelles : destinations tendance, hébergements coup de cœur, offres de dernière minute.
- Barre de navigation : logo, recherche, compte utilisateur, langue.
- Pied de page : liens institutionnels, support, téléchargement app mobile.

### Écran Résultats de Recherche

- Vue double : grille de cartes d'hébergement à gauche, carte interactive (Google Maps ou OpenStreetMap) à droite.
- Carte produit : photo principale, note moyenne, titre, localisation courte, prix par nuit, badge "Disponible pour vos dates".
- Panneau de filtres latéral : fourchette de prix (slider), type d'hébergement (hôtel, résidence, villa, appartement), équipements (WiFi, piscine, parking, climatisation, petit-déjeuner), catégorie de standing, politique d'annulation.
- Tri : prix croissant/décroissant, note, pertinence.

### Écran Fiche Détaillée d'un Hébergement

- Carrousel photo haute résolution avec galerie plein écran.
- En-tête : titre, adresse complète, note moyenne avec nombre d'avis.
- Onglets ou sections : Description, Équipements (liste icône + texte), Disponibilité (calendrier interactif), Avis (liste commentaires avec photo et date), Règlement intérieur.
- Encart de réservation sticky (desktop) ou bottom sheet (mobile) : dates pré-remplies depuis la recherche, nombre de voyageurs, prix détaillé (nuitées x tarif, frais de service, total), bouton "Réserver".
- Informations hébergeur : photo, nom, date d'inscription sur la plateforme, taux de réponse.

### Écran Panier / Récapitulatif de Réservation

- Récapitulatif des dates, du nombre de voyageurs, du choix de l'hébergement.
- Détail du prix : sous-total des nuitées, frais de service de la plateforme, taxe de séjour (si applicable), total TTC.
- Champ code promo avec vérification.
- Politique d'annulation rappelée.

### Écran Paiement

- Formulaire sécurisé : choix du moyen de paiement (carte bancaire, Wave, Mobile Money).
- Pour Mobile Money : saisie du numéro de téléphone, envoi d'une demande de validation USSD/push.
- Pour Wave : redirection vers l'application Wave ou affichage du QR code à scanner.
- Indicateur de sécurité : badges de conformité PCI-DSS, mention du chiffrement.
- Bouton final "Payer et confirmer ma réservation".

### Écran Confirmation

- Animation de succès. Numéro de réservation généré.
- Récapitulatif complet envoyé par email/SMS.
- QR code de check-in affiché et téléchargeable.
- Boutons d'action : ajouter au calendrier, télécharger le reçu, voir mes réservations.

### Écran Mon Compte (Espace Voyageur)

- Tableau de bord : prochain voyage, nombre de réservations passées.
- Onglet "Mes Réservations" : liste chronologique avec statut (à venir, en cours, terminée, annulée). Pour chaque réservation : photo, titre, dates, montant, statut, actions (voir détail, annuler selon politique, contacter l'hébergeur, laisser un avis si terminée).
- Onglet "Mes Avis" : avis laissés et en attente.
- Onglet "Profil" : photo, nom, email, téléphone, documents d'identité (optionnel pour check-in rapide), préférences.
- Onglet "Paiements" : moyens de paiement enregistrés (tokenisés), historique des transactions.
- Onglet "Notifications" : centre de notifications (nouvelle réservation, rappel de séjour, avis à laisser, promo).

## 6.2 Front-office — Espace Hébergeur (React)

### Écran Tableau de Bord Hébergeur

- KPI cards : revenus du mois en cours, taux d'occupation, nombre de réservations en cours, nouveaux avis.
- Graphique : évolution des revenus sur les 6 derniers mois.
- Liste des prochaines arrivées (check-in aujourd'hui et demain).
- Alertes : réservations en attente de confirmation (si mode manuel), avis non répondus.

### Écran Gestion des Hébergements

- Liste des hébergements / chambres avec photo miniature, statut (actif / inactif / en révision), tarif de base.
- Bouton "Ajouter un hébergement".
- Pour chaque unité : actions rapides (modifier, dupliquer, mettre en pause, supprimer).

### Écran Édition d'un Hébergement

- Formulaire multi-étapes : Informations générales, Photos, Équipements et services, Tarification et disponibilité, Politiques.
- Section Tarification : tarif de base par nuit, tarifs spéciaux par période (Noël, Ramadan, festivals), tarif weekend, tarif long séjour (réduction à partir de X nuits).
- Section Disponibilité : calendrier visuel mensuel avec possibilité de bloquer/débloquer des dates en masse.
- Section Politiques : heure d'arrivée et de départ, politique d'annulation choisie parmi trois profils, règles spécifiques (non-fumeur, animaux acceptés ou non).

### Écran Calendrier et Réservations

- Vue calendrier mensuel par unité. Les dates réservées apparaissent en rouge, les dates bloquées manuellement en gris, les dates disponibles en vert.
- Vue liste des réservations : numéro, nom du voyageur, dates, montant total, commission, statut (confirmée, en cours, terminée, annulée).
- Action par réservation : voir le détail (coordonnées du voyageur, notes), contacter via messagerie, marquer comme honorée.

### Écran Messagerie

- Interface type chat : conversations par réservation. Historique des messages. Envoi de texte, photos (ex : indications d'accès).
- Templates de messages rapides ("Bienvenue, voici les instructions d'accès...").

### Écran Finances

- Tableau des transactions : date, numéro de réservation, montant brut, commission de la plateforme, montant net, statut de transfert (en attente / effectué).
- Bouton "Demander un virement" (si seuil minimum atteint).
- Export CSV / PDF des relevés mensuels.

## 6.3 Back-office — Administration (React)

### Écran Dashboard Administrateur

- KPI globaux : nombre total d'hébergements actifs, nombre de voyageurs inscrits, volume de réservations du mois, revenus de commission, taux d'occupation moyen.
- Graphiques : réservations par ville, évolution des inscriptions hébergeurs, répartition des moyens de paiement.
- Tableau des alertes : nouveaux hébergeurs en attente de validation, réservations litigieuses, avis signalés.

### Écran Gestion des Hébergements

- Table de tous les hébergements avec filtres (ville, statut, type, note).
- Actions : approuver, suspendre, supprimer, voir la fiche.
- Détails : photos uploadées, historique des modifications, statistiques de vues et réservations.

### Écran Gestion des Réservations

- Table de toutes les réservations avec recherche par numéro, nom, ou dates.
- Filtres par statut (confirmée, annulée, en litige, remboursée).
- Action : voir le détail complet, initier un remboursement partiel ou total, contacter voyageur ou hébergeur.

### Écran Gestion des Utilisateurs

- Table des voyageurs et hébergeurs. Recherche par nom, email, téléphone.
- Actions : voir le profil, suspendre le compte, réinitialiser un mot de passe, voir l'historique d'activité.

### Écran Gestion des Avis

- Liste des avis avec note, contenu, statut (publié, signalé, masqué).
- Action : modérer (approuver, masquer, répondre au nom de l'hébergeur si absence prolongée).

### Écran Configuration Financière

- Paramètres des commissions : pourcentage par défaut, réduction pour hébergeurs premium.
- Configuration des moyens de paiement : activer/désactiver, configurer les clés API des prestataires.
- Tarifs et taxes : configuration de la taxe de séjour par ville.

### Écran Support et Litiges

- Liste des tickets de support ouverts par voyageurs ou hébergeurs.
- Workflow de résolution : attribution à un agent, statut (ouvert, en cours, résolu), notes internes.
- Gestion des remboursements avec historique.

---

# PARTIE 7 — LOGIQUE MÉTIER ET RÈGLES DU SYSTÈME

## 7.1 Gestion des disponibilités et du calendrier

**Règle fondamentale** : Une unité d'hébergement (chambre, appartement, villa) ne peut faire l'objet que d'une seule réservation confirmée pour une même nuit. Le calendrier est la source de vérité.

**Logique de blocage** :
- Quand un voyageur sélectionne des dates et clique sur "Réserver", les dates sont **temporairement bloquées** pendant 15 minutes (panier actif) pour éviter la double réservation concurrente.
- Si le paiement est validé dans ces 15 minutes, les dates passent en **bloqué confirmé**.
- Si le paiement échoue ou expire, les dates sont **débloquées automatiquement**.
- L'hébergeur peut manuellement bloquer des dates via son calendrier (ex : travaux, usage personnel).

**Logique de tarification** :
- Chaque unité a un **tarif de base par nuit**.
- L'hébergeur peut définir des **tarifs spéciaux** pour des plages de dates (période de fête, événement sportif).
- Un **tarif weekend** peut s'appliquer automatiquement les vendredis et samedis.
- Une **réduction long séjour** s'applique automatiquement si le nombre de nuits dépasse un seuil configuré par l'hébergeur.
- Le prix total affiché au voyageur est calculé comme suit : `(somme des tarifs par nuit pour les dates choisies) + frais de service de la plateforme + taxes optionnelles`.

## 7.2 Cycle de vie d'une réservation

**État initial** : `panier` — dates temporairement réservées, paiement en cours.
**Transition 1** : Paiement validé → `confirmée` — le voyageur reçoit sa confirmation, l'hébergeur est notifié.
**Transition 2** : Date d'arrivée atteinte → `en_cours` — le voyageur a effectué son check-in.
**Transition 3** : Date de départ passée → `terminée` — le séjour est clos, le voyageur reçoit une invitation à aviser.
**Transition alternative A** : Demande d'annulation par le voyageur avant arrivée → selon la politique d'annulation de l'hébergeur et le délai, la réservation passe en `annulée` (remboursement total, partiel, ou aucun).
**Transition alternative B** : Demande d'annulation par l'hébergeur (cas de force majeure) → `annulée_par_hote` — remboursement total obligatoire du voyageur, pénalité pour l'hébergeur.
**Transition alternative C** : Litige (non-honoration, surbooking) → `litige` — intervention du support, blocage des paiements en attendant résolution.

## 7.3 Politiques d'annulation

Trois profils prédéfinis que l'hébergeur choisit à la création de son offre :

- **Flexible** : Annulation gratuite jusqu'à 24 heures avant l'arrivée. Remboursement intégral.
- **Modérée** : Annulation gratuite jusqu'à 5 jours avant l'arrivée. Entre 5 jours et 24h, remboursement de 50 %. Moins de 24h, aucun remboursement.
- **Stricte** : Annulation gratuite jusqu'à 14 jours avant l'arrivée. Entre 14 et 7 jours, remboursement de 50 %. Moins de 7 jours, aucun remboursement.

Le système applique automatiquement le calcul de remboursement en fonction de la date de demande d'annulation et de la politique choisie.

## 7.4 Modèle de monétisation et commissions

**Commission standard** : La plateforme prélève un pourcentage sur chaque réservation honorée. Ce pourcentage est configurable par le Super Admin. Hypothèse de départ : 10 à 15 %.

**Répartition** :
- Le voyageur paie le montant total (hébergement + frais) au moment de la réservation.
- La plateforme conserve sa commission.
- Le solde est transféré à l'hébergeur selon la fréquence configurée (hebdomadaire ou mensuelle).

**Abonnement hébergeur (optionnel, phase ultérieure)** : Un hébergeur peut souscrire à un abonnement mensuel "Premium" qui réduit sa commission de 5 % et donne un badge "Partenaire Vérifié" visible sur ses fiches.

## 7.5 Système d'avis et de réputation

**Déclenchement** : 24 heures après la date de départ, le voyageur reçoit un email l'invitant à laisser un avis. L'hébergeur reçoit simultanément une invitation à évaluer le voyageur.

**Contenu de l'avis voyageur** :
- Note globale sur 5 étoiles.
- Notes détaillées : propreté, communication, emplacement, rapport qualité-prix.
- Commentaire textuel libre.
- Possibilité d'upload de photos.

**Contenu de l'avis hébergeur** :
- Note du voyageur sur 5 étoiles.
- Commentaire optionnel.

**Règles de modération** :
- Un avis est publié immédiatement sauf si contenant des mots signalés (modération a posteriori).
- L'hébergeur dispose de 48 heures pour répondre à un avis.
- Un avis signalé par l'hébergeur ou un tiers passe en revue manuelle avant publication ou retrait.

## 7.6 Notifications et communication

**Canaux** : Email, SMS, notification push (application mobile future), notification in-app.

**Événements déclencheurs** :
- Nouvelle réservation confirmée (hébergeur + voyageur)
- Demande d'annulation (hébergeur + voyageur + support)
- Rappel de séjour (voyageur, J-1)
- Demande de check-in (hébergeur, le jour J)
- Invitation à aviser (voyageur, J+1)
- Virement effectué (hébergeur)
- Nouveau message dans la messagerie

## 7.7 Gestion des comptes et sécurité

**Inscription voyageur** : Email, mot de passe fort, numéro de téléphone. Vérification par code SMS.
**Inscription hébergeur** : Email, mot de passe, numéro de téléphone, pièce d'identité, coordonnées bancaires. Validation manuelle par un modérateur avant activation du compte et publication des annonces.
**Authentification** : JWT (JSON Web Token) avec refresh token. Durée de session limitée pour les actions sensibles (modification de mot de passe, ajout de moyen de paiement).
**Paiement** : Tokenisation des cartes bancaires via un prestataire PCI-DSS compliant (Stripe, PayDunya, ou solution locale). Les numéros de cartes ne transitinguent jamais par les serveurs de la plateforme.

---

# PARTIE 8 — ARCHITECTURE TECHNIQUE CONCEPTUELLE (React + Django)

## 8.1 Séparation des responsabilités

**React (Frontend)** : Application Single Page Application (SPA) ou Progressive Web App (PWA). Responsable de l'interface utilisateur, de la réactivité, de la gestion d'état locale (React Query / Redux Toolkit), et de la communication avec le backend via API REST.

**Django (Backend)** : Framework Python responsable de la logique métier, de l'authentification, de la gestion des transactions, du calcul des disponibilités, et de l'accès aux données. Expose une API REST propre (Django REST Framework).

**Base de données** : PostgreSQL (recommandé pour la robustesse transactionnelle et les types de données avancés comme les plages de dates et le JSONB pour les équipements).

**Services annexes** :
- **Redis** : Cache pour les recherches fréquentes et les sessions actives. Stockage des paniers temporaires (15 minutes).
- **Celery + broker (Redis/RabbitMQ)** : Traitement asynchrone des tâches lourdes (envoi d'emails, génération de rapports, traitement des images uploadées, virements programmés).
- **Stockage objet (AWS S3 ou MinIO)** : Photos des hébergements et avatars.

## 8.2 Points d'accès principaux (API REST)

Les endpoints suivent une structure RESTful claire. Voici les ressources et leurs opérations essentielles :

- **Authentification** : inscription, connexion, déconnexion, renouvellement de token, réinitialisation de mot de passe, vérification téléphone.
- **Profils** : lecture et mise à jour du profil voyageur ou hébergeur, upload de documents.
- **Hébergements (publics)** : liste avec filtres et pagination, détail d'un hébergement, vérification de disponibilité pour des dates données, récupération des avis.
- **Hébergements (hébergeur)** : création, modification, suppression, gestion du calendrier (bloquer/débloquer), définition des tarifs spéciaux.
- **Réservations** : création (avec vérification de disponibilité atomique), lecture du détail, liste par utilisateur, demande d'annulation.
- **Paiements** : initialisation d'une transaction, vérification du statut, webhook de confirmation par le prestataire, historique des transactions.
- **Avis** : création (si éligible), lecture par hébergement, réponse de l'hébergeur, signalement.
- **Messagerie** : liste des conversations, envoi de message, lecture, marquer comme lu.
- **Notifications** : liste, marquer comme lue, préférences de canaux.
- **Tableau de bord hébergeur** : KPIs (revenus, taux d'occupation), prochaines réservations.
- **Administration** : gestion des utilisateurs, modération des hébergements et avis, gestion des réservations et litiges, configuration des tarifs et commissions, statistiques globales.

## 8.3 Migration depuis l'existant

**Données utilisables** :
- La table `users` peut être migrée pour créer les comptes de base (avec réinitialisation de mot de passe obligatoire pour la nouvelle authentification JWT).
- La table `biens` peut alimenter une première vague d'hébergements (les propriétaires existants devront compléter les nouveaux champs : tarif par nuit, politique d'annulation, calendrier).
- Les photos existantes dans `uploads/` peuvent être transférées vers le stockage objet.

**Données à ne pas migrer telles quelles** :
- La table `contacts` (demandes de contact manuelles) n'a pas d'équivalent direct dans le modèle de réservation en ligne.
- La table `visites` peut servir de données historiques pour les statistiques, mais le nouveau système de tracking sera différent.
- Le système de paiement de contact est obsolète et sera remplacé par le paiement de séjour intégré.

---

# PARTIE 9 — DIFFÉRENCIATION CONCURRENTIELLE ET POSITIONNEMENT

## 9.1 Le marché actuel en Côte d'Ivoire

Les acteurs internationaux (Booking, Airbnb) couvrent partiellement le marché ivoirien avec une offre hôtelière souvent incomplète et des résidences mal référencées. Les moyens de paiement ne sont pas toujours adaptés (carte bancaire requise, pas de Mobile Money). Les acteurs locaux existent mais sont souvent des agences physiques ou des sites vitrines sans fonctionnalité de réservation en ligne.

## 9.2 Le positionnement d'AfriStay

**Valeur unique** : La plateforme de référence pour réserver des hébergements en Côte d'Ivoire (puis en Afrique de l'Ouest) en payant comme on paie au quotidien : Wave, Orange Money, MTN Mobile Money, Moov Money, et carte bancaire.

**Différenciation** :
- **Double offre** : Hôtels classiques + Résidences meublées dans un même moteur de recherche.
- **Paiement local** : Intégration native des wallets mobiles africains.
- **Tarification transparente** : Le voyageur voit le prix total (nuitées + frais) avant de payer. Pas de surprises.
- **Support local** : Service client francophone, compréhension des spécificités locales (événements, saisonnalité, accès aux quartiers).
- **Outils hébergeur** : Interface simple pour les petits propriétaires, outils avancés (yield management) pour les hôteliers.

---

# PARTIE 10 — FEUILLE DE ROUTE PRODUIT

## Phase 1 — Fondations (Mois 1-2)
- Mise en place de l'architecture Django + React + PostgreSQL + Redis.
- Authentification complète (inscription, connexion, JWT, vérification SMS).
- CRUD hébergements côté hébergeur avec upload de photos.
- Calendrier de base (disponibilité, blocage manuel).
- Moteur de recherche public avec filtres.

## Phase 2 — Transaction (Mois 3)
- Intégration du panier et du récapitulatif de réservation.
- Connexion au prestataire de paiement (Wave + Mobile Money + carte bancaire).
- Cycle de vie complet d'une réservation (panier → confirmée → terminée).
- Tableau de bord hébergeur v1 (réservations, calendrier).
- Notifications email et SMS.

## Phase 3 — Fidélisation et Réputation (Mois 4)
- Système d'avis voyageur/hébergeur.
- Messagerie intégrée.
- Programme de fidélité (points par nuitée).
- Application mobile PWA.

## Phase 4 — Optimisation et Scale (Mois 5-6)
- Tarification dynamique et outils de yield management pour les hôteliers.
- Tableau de bord admin complet avec statistiques avancées.
- API publique pour partenaires (intégration dans d'autres sites).
- Expansion géographique vers Lomé et Accra.

---

*Document produit rédigé pour le projet de transformation d'AfriHome CI en AfriStay.*
*Approche : pensée produit, application du paradoxe de Jevons, méthode BMAIC, stack React + Django.*