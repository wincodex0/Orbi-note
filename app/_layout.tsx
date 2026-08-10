import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from '../src/navigation/RootNavigator';
import linking from '../src/navigation/linking';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { ThemeProvider } from '../src/theme/ThemeContext';
import { initializeDatabase } from '../src/db/database';
import LoadingIndicator from '../src/components/ui/LoadingIndicator';
import ErrorBanner from '../src/components/ui/ErrorBanner';
import { useStore } from '../src/store';

export default function AppLayout() {
  const [loading, setLoading] = useState(true);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const setFatalMessage = useStore((state) => state.setFatalMessage);

  useEffect(() => {
    async function init() {
      try {
        await initializeDatabase();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown database failure';
        setDatabaseError(message);
        setFatalMessage(message);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [setFatalMessage]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider>
        <NavigationContainer linking={linking}>
          <SafeAreaView style={styles.container}>
            <RootNavigator />
            <StatusBar style="light" />
            {loading && <LoadingIndicator />}
            {databaseError ? <ErrorBanner message={databaseError} /> : null}
          </SafeAreaView>
        </NavigationContainer>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05060F'
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05060F'
  }
});
