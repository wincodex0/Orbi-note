import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import { getPlanetById, getPlanetsBySolarSystemId, getSolarSystemById, getSunBySolarSystemId } from '../db/repository';
import { Planet, SolarSystem, Sun } from '../types/entities';

export default function SolarSystemScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute();
  const { solarSystemId } = route.params as { solarSystemId: string };
  const [solarSystem, setSolarSystem] = useState<SolarSystem | null>(null);
  const [sun, setSun] = useState<Sun | null>(null);
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSystem() {
      try {
        const [system, systemSun, systemPlanets] = await Promise.all([
          getSolarSystemById(solarSystemId),
          getSunBySolarSystemId(solarSystemId),
          getPlanetsBySolarSystemId(solarSystemId)
        ]);

        setSolarSystem(system);
        setSun(systemSun);
        setPlanets(systemPlanets);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load system data');
      } finally {
        setLoading(false);
      }
    }

    loadSystem();
  }, [solarSystemId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{solarSystem?.name ?? 'Solar System'}</Text>
      <Text style={styles.subtitle}>{solarSystem ? `Explore ${solarSystem.name}` : 'Select a system to explore your notes.'}</Text>
      {loading ? (
        <Text style={styles.status}>Loading system...</Text>
      ) : error ? (
        <Text style={styles.status}>{error}</Text>
      ) : (
        <>
          {sun ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sun</Text>
              <Text style={styles.sectionBody}>{sun.title}</Text>
              <Text style={styles.sectionNote}>{sun.description}</Text>
            </View>
          ) : null}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Planets</Text>
            <FlatList
              data={planets}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable style={styles.planetRow} onPress={() => navigation.navigate('Planet', { planetId: item.id })}>
                  <View>
                    <Text style={styles.planetName}>{item.name}</Text>
                    <Text style={styles.planetSubject}>{item.subject}</Text>
                  </View>
                  <Text style={styles.planetAction}>Edit</Text>
                </Pressable>
              )}
              ListEmptyComponent={<Text style={styles.status}>No planets found in this system.</Text>}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05060F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  title: {
    color: '#FF9A3C',
    fontSize: 32,
    fontWeight: '700'
  },
  subtitle: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 18,
    textAlign: 'center'
  }
});
