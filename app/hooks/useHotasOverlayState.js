import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useHotasOverlayState — overlay hotspot state.
 *
 * ⚠️ `setOverlays` REFUSES a non-array. `jsonc-parser.parse()` returns `undefined` (it does not
 * throw) for HTML or an error body, so a demo-mode / GitHub Pages response used to overwrite the
 * array with `undefined` and the next `overlays.map(...)` crashed the whole app.
 */
export function useHotasOverlayState(initialOverlays = []) {
  const [overlays, setOverlaysState] = useState(() => (Array.isArray(initialOverlays) ? initialOverlays : []));
  const setOverlays = useCallback((next) => {
    if (Array.isArray(next)) {
      setOverlaysState(next);
      return;
    }
    console.warn('[Uni-HOTAS] Ignored a non-array overlay payload:', typeof next);
  }, []);
  const [devEditMode, setDevEditMode] = useState(() => {
    try {
      const saved = localStorage.getItem('hotasOverlayDevEditMode');
      if (saved !== null) return saved === 'true';
    } catch (e) {}
    return true;
  });

  // Save overlays to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('hotasOverlayPositions', JSON.stringify(overlays));
    } catch (e) {}
  }, [overlays]);

  // Save devEditMode to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('hotasOverlayDevEditMode', devEditMode ? 'true' : 'false');
    } catch (e) {}
  }, [devEditMode]);

  return { overlays, setOverlays, devEditMode, setDevEditMode };
}
