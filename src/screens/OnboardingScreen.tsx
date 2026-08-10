import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store';

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const setOnboardingComplete = useStore((state) => state.setOnboardingComplete);

  const finishOnboarding = () => {
    setOnboardingComplete(true);
    navigation.getParent()?.replace('App');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Orbinote</Text>
      <Text style={styles.description}>
        Build your notes as a glowing galaxy of universes, solar systems, suns, and planets.
      </Text>
      <Pressable style={styles.button} onPress={finishOnboarding}>
        <Text style={styles.buttonText}>Get Started</Text>
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
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center'
  },
  description: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26
  },
  button: {
    marginTop: 32,
    backgroundColor: '#4FD8FF',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999
  },
  buttonText: {
    color: '#05060F',
    fontSize: 16,
    fontWeight: '700'
  }
});
