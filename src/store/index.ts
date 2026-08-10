import create from 'zustand';
import { createSettingsSlice, SettingsState } from './settingsSlice';
import { createErrorSlice, ErrorState } from './errorSlice';

export type StoreState = SettingsState & ErrorState;

export const useStore = create<StoreState>()((set) => ({
  ...createSettingsSlice(),
  ...createErrorSlice(),
  setSimpleViewEnabled: (value: boolean) => set({ simpleViewEnabled: value }),
  setAiSearchEnabled: (value: boolean) => set({ aiSearchEnabled: value }),
  setOnboardingComplete: (value: boolean) => set({ onboardingComplete: value }),
  setQuotaExceeded: (value: boolean) => set({ quotaExceeded: value }),
  setBannerMessage: (message: string | null) => set({ bannerMessage: message }),
  setFatalMessage: (message: string | null) => set({ fatalMessage: message })
}));
