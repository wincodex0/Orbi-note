import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useStore } from '../store';

export default function SettingsScreen() {
  const simpleViewEnabled = useStore((state) => state.simpleViewEnabled);
  const aiSearchEnabled = useStore((state) => state.aiSearchEnabled);
  const setSimpleViewEnabled = useStore((state) => state.setSimpleViewEnabled);
  const setAiSearchEnabled = useStore((state) => state.setAiSearchEnabled);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.optionRow}>
        <View style={styles.optionText}>
          <Text style={styles.optionLabel}>Simple/List View</Text>
          <Text style={styles.optionDescription}>Use a flat, accessible list instead of the galaxy view.</Text>
        </View>
        <Switch
          trackColor={{ false: '#2A2F46', true: '#4FD8FF' }}
          thumbColor={simpleViewEnabled ? '#05060F' : '#F4F4F5'}
          onValueChange={setSimpleViewEnabled}
          value={simpleViewEnabled}
        />
      </View>
      <View style={styles.optionRow}>
        <View style={styles.optionText}>
          <Text style={styles.optionLabel}>AI Search</Text>
          <Text style={styles.optionDescription}>Enable semantic search and AI explanations.</Text>
        </View>
        <Switch
          trackColor={{ false: '#2A2F46', true: '#4FD8FF' }}
          thumbColor={aiSearchEnabled ? '#05060F' : '#F4F4F5'}
          onValueChange={setAiSearchEnabled}
          value={aiSearchEnabled}
        />
      </View>
      <Text style={styles.note}>Some options will be available once the note database is populated.</Text>
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
    color: '#8A6CFF',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 24
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#091020',
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
    borderColor: '#223145',
    borderWidth: 1
  },
  optionText: {
    flex: 1,
    paddingRight: 12
  },
  optionLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700'
  },
  optionDescription: {
    color: '#B0B8E8',
    fontSize: 14,
    marginTop: 4
  },
  note: {
    color: '#8A8FB3',
    marginTop: 24,
    fontSize: 14,
    lineHeight: 20
  }
});
