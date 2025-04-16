import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { TextInput } from 'react-native-gesture-handler';
import { useAuth } from '@/context/AuthContext';

const CHECK_LOGIN_FUNCTION_URL = 'https://us-central1-molliepartnersim.cloudfunctions.net/checkLogin';


export default function LoginScreen() { 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // const router = useRouter(); // use this constant later for navigation
    const { login } = useAuth(); // Get login function from context

    const handleLoginPress = async () => {
        
        // --- TODO: Add actual login logic here ---
        // Simulate a login request

        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }
        
        setIsLoading(true);
        console.log("login button pressed")



        try {
        // --- Start of fetch logic ---
        const response = await fetch(CHECK_LOGIN_FUNCTION_URL, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
            email: email,      // Use email state variable
            password: password // Use password state variable
            }), 
        });

        console.log('Backend Response Status:', response.status);

        if (!response.ok) {
            // Try to get error message from backend if provided
            let errorMessage = `Login failed (Status: ${response.status})`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage; 
            } catch (e) { /* Ignore if response wasn't JSON */ }
            throw new Error(errorMessage); // Throw error if response not OK
        }

        // Parse the JSON response from the backend
        const data = await response.json(); 
        console.log('Backend Response Data:', data);

        // Check the 'success' field in the response data
        if (data.success === true && data.userData) { // Check for userData too
            // If backend confirms success, call the context login function
            // *** PASSING the received userData ***
            login(data.userData); 
            return; 
        } else {
            // If backend returns success: false, or userData is missing
            throw new Error(data.message || 'Invalid credentials or missing user data');
        }
        

    } catch (error : any) {
        // This existing catch block is good!
        console.error('Login error:', error);
        Alert.alert('Login failed', error.message || 'Please check your credentials and try again.');
        setIsLoading(false); // Make sure loading stops on error
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
