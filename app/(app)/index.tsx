import { Image, StyleSheet, Platform, Text, View, ActivityIndicator, Alert } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import React, { useState, useEffect } from 'react';


const FUNCTION_URL =  'https://us-central1-molliepartnersim.cloudfunctions.net/helloWorld';


export default function HomeScreen() {
  const [loading, setLoading] = useState(true); //start loading
  const [responseData, setResponseData] = useState<string | null>(null); //assumming text response
  const [error, setError] = useState<string | null>(null); //error message

  useEffect(() => {
    const fetchData = async () => {
      setError(null); //reset error
      setResponseData(null); //reset response

      try{
        console.log(`Calling function at: ${FUNCTION_URL}`);
        const response = await fetch(FUNCTION_URL)
        console.log('Response:', response);
        if (!response.ok) {
          throw new Error(`Network response was not ok:{response.status}`);
        }

        const textResponse = await response.text();
        console.log(`Response text:`, textResponse);
        setResponseData(textResponse);

      }catch (error:any) {
        console.error('Error fetching data:', error);
        setError(error.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading data from backend...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

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
        <ThemedText type="title">Testing the backend</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">It should display a welcoming message</ThemedText>
        <ThemedText>
          {responseData}
        </ThemedText>
      </ThemedView>
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
});
