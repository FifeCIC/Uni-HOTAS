/**
 * Dev-mode resolution — one place, because two independent ideas share the name and they
 * used to disagree:
 *
 *  - the BUILD is a dev build (vite dev server / MODE=development). Fixed at compile time;
 *    the production bundle served by Express on :3111 always reports false.
 *  - the USER switched Dev Mode on in the Developer area (zustand, persisted).
 *
 * ⚠️ Authoring tools used to gate on the build flag alone, so in the shipped app the hotspot
 * "Enable Resize/Drag" control could never appear — there was no switch that reached it.
 * Tools must call `useDevMode()` so the user's switch actually controls them.
 */
import useAppStore from '../stores/useAppStore';

export const isDevBuild =
  import.meta.env.DEV === true ||
  import.meta.env.MODE === 'development' ||
  import.meta.env.NODE_ENV === 'development' ||
  import.meta.env.DEVELOPMENT_MODE === 'true';

export function useDevMode() {
  const devMode = useAppStore((state) => state.devMode);
  return isDevBuild || devMode;
}

export default useDevMode;
