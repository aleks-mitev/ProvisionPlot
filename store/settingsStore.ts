import { create } from 'zustand';
import { getAllSettings, updateSetting } from '../db/settings';

export interface SettingsState {
  settings: Record<string, string>;
  loadSettings: () => Promise<void>;
  setSetting: (key: string, value: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {},
  loadSettings: async () => {
    const data = await getAllSettings();
    set({ settings: data });
  },
  setSetting: async (key, value) => {
    await updateSetting(key, value);
    await get().loadSettings();
  }
}));
