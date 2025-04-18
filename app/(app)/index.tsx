import { Image, StyleSheet, Platform, Text, View, ActivityIndicator, Alert, Button } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import React, { useState, useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';



export default function HomeScreen() {
  const {logout, user} = useAuth() //logout function from context


  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome {user?.name}! </ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView>
        <Text>Go to settings to connect your Mollie Account.</Text>
      </ThemedView>
      <View style={styles.buttonContainer}>
        <Button title="Logout" onPress={logout} />
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  loadingContainer: {
    flex: 1,
    padding: 20, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center', // Center button
},
});
