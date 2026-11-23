import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import DemoModeBanner from './DemoModeBanner';
import { trackAppView } from '../platform-core';

export default function MainLayout() {
  const location = useLocation();

  console.log('[Uni-HOTAS] MainLayout rendered for path:', location.pathname);

  useEffect(() => {
    const path = `${location.pathname}${location.search || ''}`;
    trackAppView(path);
  }, [location.pathname, location.search]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--oc-space-deep)', position: 'relative' }}>
      {/* Sticky Header. `data-app-chrome` marks the persistent app chrome so page-level
          input capture (see HOTASConfigMainPage keyboard capture) never swallows a click
          meant for the menu or the game selector. */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100 }} data-app-chrome>
        <AppHeader />
        <DemoModeBanner />
      </div>

      {/* Permanent gradient overlay — positioned below the header, scrolls with content */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '60px',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          background: 'linear-gradient(160deg, rgba(0,4,15,0.60) 0%, rgba(0,4,15,0.80) 100%)',
          pointerEvents: 'none',
          transition: 'background 0.5s ease',
        }}
      />

      {/* Main Content */}
      <div className="oc-page-enter" style={{ padding: '2rem 3%', position: 'relative', zIndex: 1, maxWidth: '100%' }}>
        <Outlet />
      </div>

      {/* Footer */}
      <AppFooter />

      {/* Made By The Community badge */}
      <img
        src={`${import.meta.env.BASE_URL}assets/branding/MadeByTheCommunity_White.png`}
        alt="Made by the Community"
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          width: 100,
          opacity: 0.4,
          pointerEvents: 'none',
          zIndex: 50,
        }}
      />
    </div>
  );
}
