import { StyleSheet, Image, Platform, View, Button, ActivityIndicator, Alert, Text } from 'react-native'; // Added Text, useEffect
import React, { useState, useEffect } from 'react'; // ADDED useEffect
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/context/AuthContext';
import * as WebBrowser from 'expo-web-browser';

// ADDED: Define the possible connection status states
type ConnectionStatus = 'loading' | 'connected' | 'not_connected' | 'error';

// ADDED: URLs for backend functions - REPLACE WITH YOUR ACTUAL URLs
const GET_AUTH_URL_FUNCTION = 'https://getmollieoauthurl-2uhr4aw26q-uc.a.run.app'; 
const CHECK_STATUS_FUNCTION_URL = 'https://us-central1-molliepartnersim.cloudfunctions.net/getMollieConnectionStatus'; 
const MOLLIE_REDIRECT_URI = 'https://us-central1-molliepartnersim.cloudfunctions.net/handleMollieOAuthCallback';

export default function SettingsScreen() { // Renamed component function for clarity
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false); // State for the "Connect" button action

  // ADDED: State variables for connection status check
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('loading'); 
  const [statusError, setStatusError] = useState<string | null>(null); 

  // ADDED: Effect to check connection status on load or when user changes
  useEffect(() => {
    const checkStatus = async () => {
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
    };

    checkStatus();
  }, [user]); // Re-run this effect if the user object changes


  // --- Keep your handleConnectMollie function exactly as it was ---
  const handleConnectMollie = async () => {
    if (!user?.userId) {
      Alert.alert('Error', 'User ID is missing');
      return;
    }
    setIsLoading(true);
    console.log(`Initiating connection for user ID: ${user.userId}`);

    try {
      const response = await fetch(GET_AUTH_URL_FUNCTION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.userId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get auth URL: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      // Check if error message exists in response data
      if (!data.success || !data.authorizeUrl) {
         // Use data.message if available, otherwise provide a default error
         throw new Error(data.message || "Failed to get valid auth URL from backend.");
      }


      const authorizeUrl = data.authorizeUrl;
      console.log(`Received authorize URL: ${authorizeUrl}`);
      console.log(`Using redirect URL for session close detection: ${MOLLIE_REDIRECT_URI}`); 

      // Using openAuthSessionAsync as you had it
      const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, MOLLIE_REDIRECT_URI);

      console.log(`WebBrowser result: ${JSON.stringify(result)}`);
      
      // ADDED: After the browser closes (or flow completes), re-check the status
      // Need to re-trigger the useEffect logic. A simple way is to temporarily
      // set status to loading again, forcing the useEffect to run (if user was stable)
      // A better way might be a dedicated refresh function. For now:
       setConnectionStatus('loading'); 
      // This will cause the useEffect to run checkStatus() again.

    } catch (error: any) {
      console.error('Error connecting to Mollie:', error);
      Alert.alert('Error', `Failed to connect to Mollie: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  // --- End of handleConnectMollie ---


  // ADDED: Helper function to render content based on status
  const renderConnectionInfo = () => {
    switch (connectionStatus) {
      case 'loading':
        return <ActivityIndicator size="large" color="#007AFF" />; // Use app's tint color?
      case 'error':
        return <Text style={{ color: 'red' }}>Error checking status: {statusError}</Text>;
      case 'connected':
        return (
          <View style={styles.centered}>
            <ThemedText style={{ color: 'green', marginBottom: 15 }}>Mollie Account Connected!</ThemedText>
            {/* Placeholder for Balance Button/Display */}
            <Button title="Fetch Mollie Balance (TODO)" onPress={() => Alert.alert("TODO", "Implement balance fetch")} />
            {/* Maybe add a Disconnect button later */}
          </View>
        );
      case 'not_connected':
      default:
        // Show loader if the connect action is happening, otherwise the button
        return isLoading ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <Button 
              title="Connect your Mollie account"
              onPress={handleConnectMollie}
              // Button only shown when not connected, disable handled by isLoading check
            />
          );
    }
  };


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
      
      {/* MODIFIED: Render dynamic content using the helper function */}
      <View style={styles.connectionStatusContainer}>
          {renderConnectionInfo()}
      </View>

    </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  // titleContainer was maybe from index.tsx? Removed if not used here.
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
   centered: { // Helper style from suggestion
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
  connectionStatusContainer: { // Style from suggestion
    marginTop: 15,
    minHeight: 50, // Ensure space for content
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%', // Give it some width
},
});