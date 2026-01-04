import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  useEffect(() => {
    // Platform.OS === 'android' && NavigationBar.setBackgroundColorAsync...
    // Removed to avoid edge-to-edge warning.
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <StatusBar style="light" backgroundColor="#0F172A" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0F172A' } }}>
        <Stack.Screen name="index" />
      </Stack>
    </GestureHandlerRootView>
  );
}
