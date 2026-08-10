import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';

export default function UniverseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Orbinote</Text>
      <Text style={styles.subtitle}>Your notes, in orbit.</Text>
      <Pressable style={styles.button} onPress={() => navigation.navigate('Search')}>
        <Text style={styles.buttonText}>Search Notes</Text>
      </Pressable>
      <Pressable style={styles.buttonSecondary} onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.buttonTextSecondary}>Settings</Text>
      </Pressable>
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
