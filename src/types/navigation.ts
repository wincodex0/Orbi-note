export type RootStackParamList = {
  Onboarding: undefined;
  App: undefined;
};

export type AppStackParamList = {
  Universe: undefined;
  SolarSystem: { solarSystemId: string };
  Planet: { planetId: string };
  Sun: { solarSystemId: string };
  Search: undefined;
  Settings: undefined;
};
