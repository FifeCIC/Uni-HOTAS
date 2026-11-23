import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AdminLayout from './components/LayoutNew';
import MainLayout from './components/MainLayout';
import DevPanel from './components/DevPanel';
import { trackAppView, installGlobalErrorHandlers, startPerformanceMonitoring } from './platform-core';
import { Loader, Center } from '@mantine/core';


const CHUNK_RELOAD_KEY = 'unihotas.chunk-reload-at';

/**
 * lazyWithRetry — React.lazy plus one automatic reload when a chunk fails to load.
 *
 * A deploy replaces every hashed chunk. A browser that still holds the previous index.html
 * asks for a file that no longer exists, the dynamic import rejects, and the screen goes blank.
 * Reloading once fetches the new index; a guard stops a reload loop when the failure is real.
 */
function lazyWithRetry(factory) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      let lastAttempt = 0;
      try {
        lastAttempt = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
      } catch {
        lastAttempt = 0;
      }

      if (Date.now() - lastAttempt > 60000) {
        try {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
        } catch {
          // Storage unavailable: still worth one reload.
        }
        window.location.reload();
        return new Promise(() => {});
      }

      throw error;
    }
  });
}
const HistoryPage = lazyWithRetry(() => import('./pages/HistoryPage'));
const DashboardPage = lazyWithRetry(() => import('./pages/DashboardPage'));
const MainDashboardPage = lazyWithRetry(() => import('./pages/MainDashboardPage'));
const SettingsPage = lazyWithRetry(() => import('./pages/SettingsPage'));
const DeveloperPage = lazyWithRetry(() => import('./pages/DeveloperPage'));
const ChangesPage = lazyWithRetry(() => import('./pages/ChangesPage'));
const ErrorLogPage = lazyWithRetry(() => import('./pages/ErrorLogPage'));
const AboutPage = lazyWithRetry(() => import('./pages/AboutPage'));
const GamesPage = lazyWithRetry(() => import('./pages/GamesPage'));
const ScreenshotsPage = lazyWithRetry(() => import('./pages/ScreenshotsPage'));
const HOTASConfigMainPage = lazyWithRetry(() => import('./pages/HOTASConfigMainPage'));
const DeveloperContextIndexPage = lazyWithRetry(() => import('./pages/DeveloperContextIndexPage'));
const HOTASDiagramPage = lazyWithRetry(() => import('./pages/HOTASDiagramPage'));
const HOTASOverlayPage = lazyWithRetry(() => import('./pages/HOTASOverlayPage'));
const HOTASOverlaySaveTestPage = lazyWithRetry(() => import('./pages/HOTASOverlaySaveTestPage'));
const HOTASCommunityTestingPage = lazyWithRetry(() => import('./pages/HOTASCommunityTestingPage'));
const DeveloperHotasDataFlowPage = lazyWithRetry(() => import('./pages/DeveloperHotasDataFlowPage'));

const HOTASTestPage = lazyWithRetry(() => import('./pages/settings/HOTASTestPage'));

function LazyFallback() {
  return <Center h={200}><Loader color="cyan" type="dots" /></Center>;
}

function Lazy({ Component, componentProps }) {
  return <Suspense fallback={<LazyFallback />}><Component {...(componentProps || {})} /></Suspense>;
}

function RuntimeObservers() {
  const location = useLocation();

  useEffect(() => {
    installGlobalErrorHandlers();
    startPerformanceMonitoring();
  }, []);

  useEffect(() => {
    const path = `${location.pathname}${location.search || ''}`;
    trackAppView(path);
  }, [location.hash, location.pathname, location.search]);

  return null;
}

function App() {
  console.log('[Uni-HOTAS] App.jsx rendering');

  return (
    <>
      <DevPanel />
      <RuntimeObservers />
      <Routes>
        {/* Main User-Facing Dashboard & Feature Pages (with MainLayout) */}
        <Route element={<MainLayout />}>
          <Route index element={<Lazy Component={MainDashboardPage} />} />
          <Route path="hotas-config" element={<Lazy Component={HOTASConfigMainPage} />} />
          <Route path="hotas-testing-routine" element={<Lazy Component={HOTASCommunityTestingPage} />} />
          <Route path="settings" element={<Lazy Component={SettingsPage} />} />
          <Route path="settings/hotas" element={<Lazy Component={HOTASTestPage} />} />
          <Route path="about" element={<Lazy Component={AboutPage} />} />
          <Route path="games" element={<Lazy Component={GamesPage} />} />
          <Route path="screenshots" element={<Lazy Component={ScreenshotsPage} />} />
          <Route path="hotas-diagram" element={<Lazy Component={HOTASDiagramPage} />} />

          {/* Retired non-HOTAS surfaces - keep old links working */}
          <Route path="ship-database" element={<Navigate to="/" replace />} />
          <Route path="game-settings" element={<Navigate to="/" replace />} />
          <Route path="economy-tracker" element={<Navigate to="/" replace />} />
          <Route path="location-guide" element={<Navigate to="/" replace />} />
          <Route path="aerobook" element={<Navigate to="/" replace />} />
          <Route path="loadout-builder" element={<Navigate to="/" replace />} />
          <Route path="new-player-guide" element={<Navigate to="/" replace />} />
          {/* Academy and Theme Lab are deleted; old links land on the dashboard. */}
          <Route path="academy" element={<Navigate to="/" replace />} />
          <Route path="academy/*" element={<Navigate to="/" replace />} />
          <Route path="theme" element={<Navigate to="/" replace />} />
          <Route path="theme/*" element={<Navigate to="/" replace />} />
          <Route path="onboarding" element={<Navigate to="/" replace />} />
        </Route>

        {/* Admin/Backend/Developer Area (with AdminLayout - Sidebar layout) */}
        <Route element={<AdminLayout />}>
          <Route path="dashboard-old" element={<Lazy Component={DashboardPage} />} />

          <Route path="admin/history" element={<Lazy Component={HistoryPage} />} />
          <Route path="developer" element={<Lazy Component={DeveloperPage} />} />
          <Route path="developer/context" element={<Lazy Component={DeveloperContextIndexPage} />} />
          <Route path="developer/errors" element={<Lazy Component={ErrorLogPage} />} />
          <Route path="developer/changes" element={<Lazy Component={ChangesPage} />} />
          <Route path="developer/hotas-overlay-save-test" element={<Lazy Component={HOTASOverlaySaveTestPage} />} />
          <Route path="developer/hotas-data-flow" element={<Lazy Component={DeveloperHotasDataFlowPage} />} />
        </Route>

        {/* Fallback: unknown routes return to the dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
