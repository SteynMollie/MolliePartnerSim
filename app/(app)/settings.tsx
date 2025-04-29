import { StyleSheet, View, Button, ActivityIndicator, Alert, Text } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/context/AuthContext';
import * as AuthSession from 'expo-auth-session';
import jwtDecode from 'jwt-decode';
import { useAuthRequest, ResponseType, makeRedirectUri } from 'expo-auth-session'; 
import { Redirect } from 'expo-router';

// Define the possible connection status states
type ConnectionStatus = 'loading' | 'connected' | 'not_connected' | 'error';

// URLs for backend functions
// Removed: const GET_AUTH_URL_FUNCTION = '...'; // Not needed anymore
const CHECK_STATUS_FUNCTION_URL = 'https://us-central1-molliepartnersim.cloudfunctions.net/getMollieConnectionStatus';





export default function SettingsScreen() {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('loading');
  const [statusError, setStatusError] = useState<string | null>(null);

  const redirectUri = AuthSession.makeRedirectUri({
  });

  useEffect(() => {
    console.log(redirectUri);
  }, [redirectUri]);

  const discovery = {
    authorizationEndpoint: 'https://mollie.com/oauth2/authorize',
    tokenEndpoint: 'https://api.mollie.com/oauth2/tokens',
  }

  // Define scopes needed
  const scopes = [
  'payments.read', 'payments.write', 'refunds.read', 'refunds.write',
  'customers.read', 'customers.write', 'mandates.read', 'mandates.write',
  'subscriptions.read', 'subscriptions.write', 'profiles.read', 'profiles.write',
  'invoices.read', 'settlements.read', 'orders.read', 'orders.write',
  'shipments.read', 'shipments.write', 'organizations.read', 'organizations.write',
  'onboarding.read', 'onboarding.write',
  'payment-links.read', 'payment-links.write', 'balances.read',
  'terminals.read', 'terminals.write', 'external-accounts.read', 'external-accounts.write',
  'persons.read', 'persons.write'
];


  // --- Configure useAuthRequest Hook ---
  const [request, result, promptAsync] = useAuthRequest(
    {
      clientId: 'app_Mi27iCRwRcyUwpdkXAdLck99', // Your Mollie Client ID
      redirectUri: redirectUri, // Use direct HTTPS redirect
      scopes: scopes,
      responseType: ResponseType.Code, // Request an authorization code
      usePKCE: true,
    },
    discovery
  );
  // --- End useAuthRequest Hook ---
  

  // Define checkStatus using useCallback to stabilize its reference if needed elsewhere
  const checkStatus = useCallback(async () => {
    // Reset state before check
    setConnectionStatus('loading');
    setStatusError(null);

    if (!user?.userId) {
      console.warn("Settings screen: No user ID available to check status.");
      setConnectionStatus('error');
      setStatusError('User not identified.');
      return; // Exit if no user ID
    }

    console.log(`Checking Mollie connection status for userId: ${user.userId}`);

    try {
      // Construct URL with query parameter
      const statusUrl = `${CHECK_STATUS_FUNCTION_URL}?userId=${encodeURIComponent(user.userId)}`;
      const response = await fetch(statusUrl); // Using GET by default

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to check status: ${response.status} ${errorBody}`);
      }
      const data = await response.json();
      console.log("Connection status response:", data);
      if (data.isConnected) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('not_connected');
      }
    } catch (error: any) {
      console.error("Error checking Mollie status:", error);
      setConnectionStatus('error');
      setStatusError(error.message || "Could not check status.");
    }
  }, [user]); // Dependency: checkStatus needs user


  // Effect to check status on initial load or when user changes
  useEffect(() => {
    checkStatus();
  }, [user, checkStatus]); // Include checkStatus in dependency array


  // --- Effect to handle AuthSession Result ---
  useEffect(() => {
    if (result) {
      console.log("AuthSession Result:", JSON.stringify(result));
      if (result.type === 'success') {
        // Success type means the browser flow completed and detected the redirect.
        // The backend (handleMollieOAuthCallback) should have handled the code exchange.
        console.log("AuthSession Success: Browser flow completed successfully.");
        // Trigger a status check to update the UI based on the new backend state.
        checkStatus();

      } else if (result.type === 'error') {
        console.error("AuthSession Error:", result.error);
        Alert.alert('Authentication Error', result.error?.message || 'Authentication failed');
        setConnectionStatus('not_connected'); // Reset UI state
      } else if (result.type === 'cancel') {
        console.log("AuthSession Canceled by user");
        // User cancelled, connection didn't complete.
        setConnectionStatus('not_connected'); // Reset UI state
      }
    }
  }, [result, checkStatus]); // Include checkStatus dependency
  // --- End AuthSession Result Effect ---


  // --- Revised handleConnectMollie Function ---
  const handleConnectMollie = () => {
    // Check if the AuthRequest config is loaded
    if (!request) {
      console.error("AuthRequest is not ready yet.");
      Alert.alert("Error", "Authentication service not ready, please wait.")
      return;
    }
    console.log("Prompting user for Mollie authentication (using direct redirect)...");
    // Trigger the authentication flow
    promptAsync(); // No proxy needed as we use the direct redirectUri
  };
  // --- End Revised handleConnectMollie ---


  // --- Revised renderConnectionInfo Function ---
  const renderConnectionInfo = () => {
    switch (connectionStatus) {
      case 'loading':
        return <ActivityIndicator size="large" color="#007AFF" />;
      case 'error':
        return <Text style={{ color: 'red' }}>Error checking status: {statusError}</Text>;
      case 'connected':
        return (
          <View style={styles.centered}>
            <ThemedText style={{ color: 'green', marginBottom: 15 }}>Mollie Account Connected!</ThemedText>
            <Button title="Fetch Mollie Balance (TODO)" onPress={() => Alert.alert("TODO", "Implement balance fetch")} />
          </View>
        );
      case 'not_connected':
      default:
        // Disable button if AuthSession request object isn't ready
        return (
            <Button
              title="Connect your Mollie account"
              disabled={!request} // Disable button if request is not loaded
              onPress={handleConnectMollie}
            />
          );
    }
  };
  // --- End Revised renderConnectionInfo ---


  // --- Return Statement (JSX) ---
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.container}>
      <ThemedText type="title">Settings</ThemedText>
      <ThemedText style={styles.userInfo}>Logged in as: {user?.name} ({user?.email})</ThemedText>

      <View style={styles.separator} />

      <ThemedText type="subtitle">Mollie Connection</ThemedText>

      <View style={styles.connectionStatusContainer}>
          {renderConnectionInfo()}
      </View>

    </ThemedView>
    </ParallaxScrollView>
  );
  // --- End Return Statement ---
}

// --- Styles ---
const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
   centered: {
     alignItems: 'center',
     justifyContent: 'center',
   },
  userInfo: {
    marginTop: 5,
    marginBottom: 20,
    fontSize: 14,
    color: 'grey',
  },
  separator: {
      marginVertical: 20,
      height: 1,
      width: '80%',
      backgroundColor: '#eee',
  },
  connectionStatusContainer: {
    marginTop: 15,
    minHeight: 50, // Ensure space for content
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%', // Give it some width
},
});