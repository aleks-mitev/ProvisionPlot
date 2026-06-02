import { Tabs } from 'expo-router';
import { Calendar, ScrollText, Refrigerator, LineChart, Timer } from 'lucide-react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1E1E1E',
          borderTopColor: '#2A2A2A',
          height: 60 + (insets.bottom || 0),
          paddingBottom: insets.bottom || 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#d89b22',
        tabBarInactiveTintColor: '#cacbaf',
      }}>
      <Tabs.Screen
        name="fasting"
        options={{
          title: 'Fast',
          tabBarIcon: ({ color }) => <Timer color={color} size={24} />
        }}
      />
      <Tabs.Screen
        name="weight-tracking"
        options={{
          title: 'Weight',
          tabBarIcon: ({ color }) => <LineChart color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="daily-log"
        options={{
          title: 'Logbook',
          tabBarIcon: ({ color }) => <ScrollText color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="list-screen"
        options={{
          title: 'Food list',
          tabBarIcon: ({ color }) => <Refrigerator color={color} size={24} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('list-screen', { mode: 'database' });
          },
        })}
      />
    </Tabs>
  );
}
