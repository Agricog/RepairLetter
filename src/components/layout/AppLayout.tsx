import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { FileText, LayoutDashboard, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../ui/LanguageSelector';

export function AppLayout() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      {/* Top bar */}
      <header className="bg-navy text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
          aria-label={t('nav.dashboard')}
        >
          <FileText className="h-5 w-5 text-shield-mid" />
          <span className="font-bold text-base tracking-tight">
            Repair<span className="text-shield-mid">Letter</span>
          </span>
        </button>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'h-8 w-8',
              },
            }}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Bottom nav — mobile */}
      <nav
        className="bg-white border-t border-border px-6 py-2 flex items-center justify-around sticky bottom-0 z-40 pb-[env(safe-area-inset-bottom)]"
        aria-label="Main navigation"
      >
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-3 text-xs font-medium transition-colors ${
              isActive ? 'text-shield' : 'text-slate hover:text-navy'
            }`
          }
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>{t('nav.cases')}</span>
        </NavLink>
        <NavLink
          to="/report"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-3 text-xs font-medium transition-colors ${
              isActive ? 'text-shield' : 'text-slate hover:text-navy'
            }`
          }
        >
          <AlertTriangle className="h-5 w-5" />
          <span>{t('nav.report')}</span>
        </NavLink>
      </nav>
    </div>
  );
}
