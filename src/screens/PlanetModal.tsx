import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import { getPlanetById, savePlanetNote } from '../db/repository';
import { Planet } from '../types/entities';

export default function PlanetModal() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute();
  const { planetId } = route.params as { planetId: string };
  const [planet, setPlanet] = useState<Planet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlanet() {
      try {
        const result = await getPlanetById(planetId);
        if (result) {
          setPlanet(result);
        } else {
          setError('Planet note not found.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load note.');
      } finally {
        setLoading(false);
      }
    }

    loadPlanet();
  }, [planetId]);

  const saveNote = async () => {
    if (!planet) {
      return;
    }

    setSaving(true);
    try {
      await savePlanetNote(planet);
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save note.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{planet?.name ?? 'Planet Note'}</Text>
      {loading ? (
        <Text style={styles.status}>Loading note...</Text>
      ) : error ? (
        <Text style={styles.status}>{error}</Text>
      ) : planet ? (
        <>
          <Text style={styles.label}>Title</Text>
          <TextInput style={styles.input} value={planet.name} onChangeText={(value) => setPlanet({ ...planet, name: value })} />
          <Text style={styles.label}>Subject</Text>
          <TextInput style={styles.input} value={planet.subject} onChangeText={(value) => setPlanet({ ...planet, subject: value })} />
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={planet.description}
            onChangeText={(value) => setPlanet({ ...planet, description: value })}
            multiline
          />
          <Text style={styles.label}>Tags</Text>
          <TextInput
            style={styles.input}
            value={planet.tags.join(', ')}
            onChangeText={(value) => setPlanet({ ...planet, tags: value.split(',').map((tag) => tag.trim()).filter(Boolean) })}
          />
          <Pressable style={styles.button} onPress={saveNote} disabled={saving}>
            <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Note'}</Text>
          </Pressable>
        </>
      ) : null}
    </ScrollView>
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
    color: '#8A6CFF',
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
