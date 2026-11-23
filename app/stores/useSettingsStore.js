/**
 * Settings Store — user preferences with localStorage persistence.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSettingsStore = create(
  persist(
    (set) => ({
      /** HOTAS device the user picked in Settings (a catalogue value, not a capability). */
      selectedHotasDevice: null,

      setSelectedHotasDevice: (device) => set({ selectedHotasDevice: device }),
      resetSettings: () => set({ selectedHotasDevice: null }),
    }),
    { name: 'uni-hotas-settings' }
  )
);

export default useSettingsStore;
