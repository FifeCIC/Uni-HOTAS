/**
 * Settings Store — user preferences with localStorage persistence.
 *
 * Replaces: manual localStorage for the custom theme.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
  persist(
    (set) => ({
      customTheme: null,
      /** HOTAS device the user picked in Settings (a catalogue value, not a capability). */
      selectedHotasDevice: null,

      setCustomTheme: (theme) => set({ customTheme: theme }),
      resetCustomTheme: () => set({ customTheme: null }),
      setSelectedHotasDevice: (device) => set({ selectedHotasDevice: device }),
      resetSettings: () => set({ customTheme: null, selectedHotasDevice: null }),
    }),
    { name: 'uni-hotas-settings' }
  )
);

export default useSettingsStore;
