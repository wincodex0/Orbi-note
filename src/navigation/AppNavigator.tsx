import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UniverseScreen from '../screens/UniverseScreen';
import SolarSystemScreen from '../screens/SolarSystemScreen';
import PlanetModal from '../screens/PlanetModal';
import SunModal from '../screens/SunModal';
import SearchModal from '../screens/SearchModal';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export type AppStackParamList = {
  Universe: undefined;
  SolarSystem: { solarSystemId: string };
  Planet: { planetId: string };
  Sun: { solarSystemId: string };
  Search: undefined;
  Settings: undefined;
};

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Universe" component={UniverseScreen} />
      <Stack.Screen name="SolarSystem" component={SolarSystemScreen} />
      <Stack.Screen name="Planet" component={PlanetModal} />
      <Stack.Screen name="Sun" component={SunModal} />
      <Stack.Screen name="Search" component={SearchModal} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
