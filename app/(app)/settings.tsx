import { StyleSheet, Image, Platform } from 'react-native';
import React, { useState } from 'react';
import { Button, View, ActivityIndicator, Alert } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/context/AuthContext';
import * as WebBrowser from 'expo-web-browser';

export default function TabTwoScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const GET_AUTH_URL_FUNCTION = 'https://us-central1-molliepartnersim.cloudfunctions.net/getMollieOAuthUrl'

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
      if (!data.success || !data.authorizeUrl) {
        throw new Error(`Failed to get auth URL: ${data.error}`);
      }

      const authorizeUrl = data.authorizeUrl;
      console.log(`Received authorize URL: ${authorizeUrl}`);

      const result = await WebBrowser.openAuthSessionAsync(authorizeUrl);

      console.log(`WebBrowser result: ${JSON.stringify(result)}`);
    } catch (error: any) {
      console.error('Error connecting to Mollie:', error);
      Alert.alert('Error', `Failed to connect to Mollie: ${error.message}`);
    } finally {
      setIsLoading(false);
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
      {/* We will add logic here later to show status/balance */}

      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <Button 
          title="Connect your Mollie account"
          onPress={handleConnectMollie}
          disabled={isLoading} // Disable button while loading
        />
      )}

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
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
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
});
