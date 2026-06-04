import '../global.css';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { View, Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { initDatabase } from '../db/database';

export default function Layout() {
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    async function setupDb() {
      await initDatabase();
      setDbInitialized(true);
    }
    setupDb();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);

  // Block rendering until the tables are fully created
  if (!dbInitialized) {
    return <View className="flex-1 bg-background" />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View className="flex-1 bg-background">
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#1E1E1E' }, animation: 'none' }}>
          <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
          <Stack.Screen name="log-product" options={{ presentation: 'modal' }} />
          <Stack.Screen name="log-meal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="product-form" options={{ presentation: 'modal' }} />
          <Stack.Screen name="meal-form" options={{ presentation: 'modal' }} />
          <Stack.Screen name="product-selector" options={{ presentation: 'modal' }} />
        </Stack>
      </View>
    </SafeAreaProvider>
  );
}