import { MAX_PLANETS } from '../constants/limits';

export interface SettingsState {
  simpleViewEnabled: boolean;
  aiSearchEnabled: boolean;
  onboardingComplete: boolean;
  quotaExceeded: boolean;
  maxPlanets: number;
  setSimpleViewEnabled: (value: boolean) => void;
  setAiSearchEnabled: (value: boolean) => void;
  setOnboardingComplete: (value: boolean) => void;
  setQuotaExceeded: (value: boolean) => void;
}

export const createSettingsSlice = () => ({
  simpleViewEnabled: false,
  aiSearchEnabled: true,
  onboardingComplete: false,
  quotaExceeded: false,
  maxPlanets: MAX_PLANETS,
  setSimpleViewEnabled: (value: boolean) => ({ simpleViewEnabled: value }),
  setAiSearchEnabled: (value: boolean) => ({ aiSearchEnabled: value }),
  setOnboardingComplete: (value: boolean) => ({ onboardingComplete: value }),
  setQuotaExceeded: (value: boolean) => ({ quotaExceeded: value })
});
