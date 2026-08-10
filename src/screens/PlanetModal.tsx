import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PlanetModal() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Planet Note</Text>
      <Text style={styles.subtitle}>Edit your note content here.</Text>
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
