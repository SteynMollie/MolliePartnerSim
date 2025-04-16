import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { TextInput } from 'react-native-gesture-handler';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() { 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // const router = useRouter(); // use this constant later for navigation
    const { login } = useAuth(); // Get login function from context

    const handleLoginPress = async () => {
        setIsLoading(true);
        // --- TODO: Add actual login logic here ---
        // Simulate a login request

        console.log("login button pressed")
        try {
            login();
        }
        catch (error : any) {
            console.error('Login error:', error);
            Alert.alert('Login failed', error.message || 'Please check your credentials and try again.');
            setIsLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sub-merchant Login</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            
            <Button
                title={isLoading ? 'Logging in...' : 'Login'}
                onPress={handleLoginPress}
                disabled={isLoading}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      justifyContent: 'center', // Center vertically
      alignItems: 'center', // Center horizontally
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 30,
    },
    input: {
      width: '90%',
      height: 45,
      borderColor: 'gray',
      borderWidth: 1,
      borderRadius: 5,
      marginBottom: 15,
      paddingHorizontal: 10,
      fontSize: 16,
    },
  });
