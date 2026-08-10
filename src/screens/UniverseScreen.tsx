import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import { getSolarSystemsByUniverse, getUniverses } from '../db/repository';
import { Universe } from '../types/entities';

export default function UniverseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUniverses() {
      try {
        const items = await getUniverses();
        setUniverses(items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load universes');
      } finally {
        setLoading(false);
      }
    }

    loadUniverses();
  }, []);

  const exploreUniverse = async (universeId: string) => {
    try {
      const systems = await getSolarSystemsByUniverse(universeId);
      if (systems.length > 0) {
        navigation.navigate('SolarSystem', { solarSystemId: systems[0].id });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load solar systems');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Orbinote</Text>
      <Text style={styles.subtitle}>Your notes, in orbit.</Text>
      {loading ? (
        <Text style={styles.status}>Loading your galaxy...</Text>
      ) : error ? (
        <Text style={styles.status}>{error}</Text>
      ) : universes.length === 0 ? (
        <Text style={styles.status}>No universes found. The database is empty.</Text>
      ) : (
        <FlatList
          data={universes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.universeCard}>
              <View style={styles.universeText}>
                <Text style={styles.universeName}>{item.name}</Text>
                <Text style={styles.universeMeta}>Theme: {item.themeId}</Text>
              </View>
              <Pressable style={styles.exploreButton} onPress={() => exploreUniverse(item.id)}>
                <Text style={styles.exploreButtonText}>Explore</Text>
              </Pressable>
            </View>
          )}
        />
      )}
      <View style={styles.footerButtons}>
        <Pressable style={styles.button} onPress={() => navigation.navigate('Search')}>
          <Text style={styles.buttonText}>Search Notes</Text>
        </Pressable>
        <Pressable style={styles.buttonSecondary} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.buttonTextSecondary}>Settings</Text>
        </Pressable>
      </View>
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
    color: '#4FD8FF',
    fontSize: 36,
    fontWeight: '700'
  },
  subtitle: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 18,
    textAlign: 'center'
  },
  button: {
    marginTop: 24,
    backgroundColor: '#4FD8FF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999
  },
  buttonText: {
    color: '#05060F',
    fontSize: 16,
    fontWeight: '700'
  },
  buttonSecondary: {
    marginTop: 14,
    borderColor: '#4FD8FF',
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999
  },
  buttonTextSecondary: {
    color: '#4FD8FF',
    fontSize: 16,
    fontWeight: '700'
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05060F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  title: {
    color: '#4FD8FF',
    fontSize: 36,
    fontWeight: '700'
  },
  subtitle: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 18,
    textAlign: 'center'
  }
});
