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

//Import the authorisation
import { AuthProvider, useAuth } from '@/context/AuthContext';


// Initialize Firebase
try {
  initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully!");
} catch (e) {
  console.error("Firebase initialization error:", e);
}

// Prevent splash screen auto-hide
SplashScreen.preventAutoHideAsync();


// Inner component that uses the auth context for checks/redirects
function AppLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const router = useRouter();
  const { isAuthenticated } = useAuth(); // Get auth state from context

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Authentication Check Effect using context value
  useEffect(() => {
    if (!loaded) return; 
    console.log("Auth Check Effect: isAuthenticated =", isAuthenticated);
    if (!isAuthenticated) {
      console.log("Redirecting to /login...");
      // Use replace to prevent going back to auth screens
      router.replace('/login');
    } else {
       // If authenticated and somehow on login route, redirect to home
       // This needs careful handling of router state, may not be needed
       // depending on exact router setup. Let's keep it simple for now.
       console.log("User is authenticated.");
    }
  }, [isAuthenticated, loaded, router]); 

  // Return null while fonts are loading
  if (!loaded) {
    return null;
  }

  // Render the main Stack navigator structure
  // The correct screen (login or app) will be shown based on the redirect effect
  console.log("AppLayout rendering Stack navigator...");
  return (
    <Stack>
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
} // End of AppLayout component


// Main RootLayout component wraps everything with providers
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    // Wrap with AuthProvider first
    <AuthProvider> 
      <GestureHandlerRootView style={{ flex: 1 }}> 
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          {/* Render the inner layout component which handles auth checks */}
          <AppLayout /> 
          <StatusBar style="auto" />
        </ThemeProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}