import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SolarSystemScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Solar System</Text>
      <Text style={styles.subtitle}>Select a system to explore your notes.</Text>
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
