export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Reservation</h3>
            <p className="mt-2 text-sm text-gray-500">
              La plateforme de référence pour réserver des hôtels et résidences en Côte d'Ivoire et en Afrique de l'Ouest.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Liens rapides</h4>
            <ul className="mt-2 space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-primary-600">Comment ça marche</a></li>
              <li><a href="#" className="hover:text-primary-600">Devenir hébergeur</a></li>
              <li><a href="#" className="hover:text-primary-600">Support</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Contact</h4>
            <ul className="mt-2 space-y-2 text-sm text-gray-500">
              <li>support@gmail.com</li>
              <li>+225 07 XX XX XX XX</li>
              <li>Abidjan, Côte d'Ivoire</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Reservation. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
