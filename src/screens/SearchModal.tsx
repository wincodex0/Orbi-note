import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import { searchPlanets } from '../db/repository';
import { SearchResult } from '../types/entities';

export default function SearchModal() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const items = await searchPlanets(query.trim());
      setResults(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const openPlanet = (planetId: string) => {
    navigation.navigate('Planet', { planetId });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search</Text>
      <Text style={styles.subtitle}>Find notes by keyword or semantic query.</Text>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Search notes..."
        placeholderTextColor="#999"
        returnKeyType="search"
        onSubmitEditing={runSearch}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={runSearch}>
        <Text style={styles.buttonText}>Search</Text>
      </Pressable>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>{loading ? 'Searching…' : 'No results yet.'}</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.resultCard} onPress={() => openPlanet(item.id)}>
            <Text style={styles.resultTitle}>{item.name}</Text>
            <Text style={styles.resultSnippet}>{item.snippet}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05060F',
    padding: 24
  },
  title: {
    color: '#4FD8FF',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12
  },
  subtitle: {
    color: '#FFFFFF',
    marginBottom: 24,
    fontSize: 18,
    textAlign: 'left'
  },
  input: {
    backgroundColor: '#0B0D1D',
    borderColor: '#4FD8FF',
    borderWidth: 1,
    borderRadius: 16,
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12
  },
  button: {
    backgroundColor: '#4FD8FF',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 18
  },
  buttonText: {
    color: '#05060F',
    fontWeight: '700',
    fontSize: 16
  },
  list: {
    flex: 1
  },
  error: {
    color: '#FF6D6D',
    marginTop: 8,
    textAlign: 'left',
    fontSize: 14
  },
  emptyText: {
    color: '#8A8FB3',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24
  },
  resultCard: {
    backgroundColor: '#091020',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderColor: '#223145',
    borderWidth: 1
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6
  },
  resultSnippet: {
    color: '#B0B8E8',
    fontSize: 14
  }
});
