import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ErrorBannerProps {
  message: string;
}

export default function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 90, 90, 0.95)',
    borderRadius: 12,
    padding: 12,
    zIndex: 10
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center'
  }
});
