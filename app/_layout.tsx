import React, { useState, useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

// Import Gesture Handler
import { GestureHandlerRootView } from 'react-native-gesture-handler'; 

// Temp button for testing login - remove later (or keep if useful)
import { Button, View } from 'react-native'; 

import { useColorScheme } from '@/hooks/useColorScheme';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../firebaseConfig';

// Initialize Firebase
try {
  initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully!");
} catch (e) {
  console.error("Firebase initialization error:", e);
}

// Prevent splash screen auto-hide
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const router = useRouter();

  // Authentication State Simulation
  const [isAuthenticated, setIsAuthenticated] = useState(false); 

  // Simulated Login Function (used by login screen later or temp button)
  const simulateLogin = () => {
    console.log('Simulating login...');
    setIsAuthenticated(true);
    router.replace('/'); // Navigate to main app screen after login
  };

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Authentication Check Effect
  useEffect(() => {
    if (!loaded) return; 
    console.log("Auth Check Effect: isAuthenticated =", isAuthenticated);
    if (!isAuthenticated) {
      console.log("Redirecting to /login...");
      router.replace('/login');
    } else {
      console.log("User is authenticated.");
      // Optional: If somehow the user is authenticated but on the login route, redirect away
      // if (router.pathname === '/login') { // Need to check current route correctly
      //    router.replace('/');
      // }
    }
  }, [isAuthenticated, loaded, router]); 

  // Return null while fonts are loading
  if (!loaded) {
    return null;
  }

  // Render the main structure
  console.log("RootLayout rendering Stack navigator wrapped in GestureHandler...");
  return (
    // Add GestureHandlerRootView wrapper here
    <GestureHandlerRootView style={{ flex: 1 }}> 
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          {/* Ensure folder is renamed app/(app) */}
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />

        {/* TEMPORARY BUTTON TO TEST LOGIN FLOW */}
        <View style={{ position: 'absolute', bottom: 100, left: 50, zIndex: 100, backgroundColor: 'rgba(200,200,200,0.7)' }}>
           <Button title="TEMP LOGIN" onPress={simulateLogin} />
        </View>
        {/* END TEMPORARY BUTTON */}

      </ThemeProvider>
    </GestureHandlerRootView> // Close GestureHandlerRootView
  );
}