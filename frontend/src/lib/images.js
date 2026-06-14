/**
 * Images Unsplash de qualité pour les hébergements NoamHome.
 * Toutes libres de droits (Unsplash License).
 * Source : https://unsplash.com
 */

// Images par type d'hébergement
export const IMAGES_HEBERGEMENT = {
  hotel: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
  ],
  villa: [
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
    'https://images.unsplash.com/photo-1601918774946-25832a4be0d6?w=800&q=80',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
  ],
  apartment: [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
  ],
  residence: [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  ],
  guesthouse: [
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&q=80',
  ],
  hostel: [
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
  ],
}

// Images de chambres
export const IMAGES_CHAMBRE = {
  standard: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
  deluxe: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80',
  suite: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=600&q=80',
  twin: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&q=80',
  studio: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80',
  familiale: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80',
}

// Images destinations Côte d'Ivoire
export const IMAGES_DESTINATIONS = {
  'Abidjan': 'https://images.unsplash.com/photo-1617469767824-68d17c81e0a1?w=400&q=80',
  'Yamoussoukro': 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80',
  'Bouaké': 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=400&q=80',
  'Grand-Bassam': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80',
  'default': 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80',
}

// Image hero de la landing page
export const IMAGE_HERO = 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=85'

/**
 * Retourne une image par défaut selon le type d'hébergement.
 */
export function getImageHebergement(type, index = 0) {
  const liste = IMAGES_HEBERGEMENT[type] || IMAGES_HEBERGEMENT.hotel
  return liste[index % liste.length]
}

/**
 * Retourne une image de chambre selon le nom.
 */
export function getImageChambre(nom = '') {
  const n = nom.toLowerCase()
  if (n.includes('suite')) return IMAGES_CHAMBRE.suite
  if (n.includes('deluxe') || n.includes('supérieure')) return IMAGES_CHAMBRE.deluxe
  if (n.includes('twin') || n.includes('lits')) return IMAGES_CHAMBRE.twin
  if (n.includes('studio')) return IMAGES_CHAMBRE.studio
  if (n.includes('famil')) return IMAGES_CHAMBRE.familiale
  return IMAGES_CHAMBRE.standard
}

/**
 * Retourne l'image d'une destination.
 */
export function getImageDestination(ville) {
  return IMAGES_DESTINATIONS[ville] || IMAGES_DESTINATIONS.default
}
