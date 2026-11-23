/**
 * Dev Tag Registry — Single source of truth for all developer reference tags.
 *
 * Tags are short identifiers shown in headers/sections when Dev Mode is enabled.
 * They allow quick cross-referencing between code, docs, and conversation.
 *
 * Convention:
 *   - Page-level tags:  PREFIX + number        e.g. DEV01, HC01, AB01
 *   - Section-level:    PREFIX + number.number  e.g. DEV01.1, HC01.2
 *
 * Usage:
 *   import { DevTag } from '../components/DevTag';
 *   <DevTag tag="DEV01" />
 *
 * To add a new tag: add an entry here, then use <DevTag> in the component.
 */

const devTags = {
  // ── Developer & Admin ──────────────────────────
  DEV01:     { label: 'Developer Tools',        path: '/developer',             file: 'pages/DeveloperPage.jsx' },
  'DEV01.1': { label: 'Admin Tools (section)',   path: '/developer',             file: 'pages/DeveloperPage.jsx' },
  DEV02:     { label: 'Developer Context Index', path: '/developer/context',     file: 'pages/DeveloperContextIndexPage.jsx' },
  DEV04:     { label: 'Error Log',               path: '/developer/errors',      file: 'pages/ErrorLogPage.jsx' },
  DEV05:     { label: 'Changes',                 path: '/developer/changes',     file: 'pages/ChangesPage.jsx' },

  // ── Admin & Tools ─────────────────────────────
  ADM01:     { label: 'Settings',                path: '/settings',              file: 'pages/SettingsPage.jsx' },
  ADM05:     { label: 'About',                   path: '/about',                 file: 'pages/AboutPage.jsx' },

  // ── Main App ──────────────────────────────────
  APP01:     { label: 'Main Dashboard',          path: '/',                      file: 'pages/DashboardPage.jsx' },
  GAME01:    { label: 'Games & Extra Support',    path: '/games',                file: 'pages/GamesPage.jsx' },

  // ── Admin History ─────────────────────────────
  ADM08:     { label: 'Field History',            path: '/admin/history',              file: 'pages/HistoryPage.jsx' },

  // ── HOTAS / Theme Lab ─────────────────────────
  HC05:      { label: 'Peripheral Configuration',       path: '/hotas-config',               file: 'pages/HOTASConfigMainPage.jsx' },
  HC07:      { label: 'HOTAS Live Input Page',   path: '/hotas-live-input',           file: 'pages/HOTASLiveInputPage.jsx' },
  HC08:      { label: 'HOTAS Overlay Demo',      path: '/hotas-overlay',              file: 'pages/HOTASOverlayPage.jsx' },
  HC09:      { label: 'Overlay Save Test',       path: '/hotas-overlay-save-test',    file: 'pages/HOTASOverlaySaveTestPage.jsx' },
  HC10:      { label: 'HOTAS Community Testing', path: '/hotas-testing-routine',      file: 'pages/HOTASCommunityTestingPage.jsx' },
  'HC-TEST': { label: 'HOTAS Input Test Lab',    path: '/settings/hotas',             file: 'pages/settings/HOTASTestPage.jsx' },
};

export default devTags;

/** Get tag metadata by ID */
export const getTag = (id) => devTags[id] || null;

/** Get all tags as entries */
export const getAllTags = () => Object.entries(devTags);

/** Get tags filtered by prefix */
export const getTagsByPrefix = (prefix) =>
  Object.entries(devTags).filter(([id]) => id.startsWith(prefix));
