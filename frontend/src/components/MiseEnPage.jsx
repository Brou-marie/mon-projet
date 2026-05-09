import { Outlet } from 'react-router-dom';
import BarreNavigation from './BarreNavigation';
import PiedDePage from './PiedDePage';

export default function MiseEnPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <BarreNavigation />
      <main className="flex-1">
        <Outlet />
      </main>
      <PiedDePage />
    </div>
  );
}
