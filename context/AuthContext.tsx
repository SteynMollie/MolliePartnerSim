import React, { createContext, useContext, useState, ReactNode} from 'react';
import { useRouter } from 'expo-router';

// Defining the shape of the context data 
interface AuthContextData {
    isAuthenticated: boolean;
    login: () => void; //Simple login simulation for now
    logout: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextData>(null!)

//Create custom hook to access AuthContext easily
export function useAuth() {
    return useContext(AuthContext);
}

// Create the provider component
interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    const login = () => {
        console.log('AuthContext: Simulating login...');
        setIsAuthenticated(true);
        //navigate to the main app screen after status update
        router.replace('/'); //navigate to root, which resolves to app/(app)/index.tsx
    };

    const logout = () => {
        console.log('AuthContext: Simulating logout...');
        setIsAuthenticated(false);
        router.replace('/login'); //navigate to login screen
    };

    const value = {
        isAuthenticated,
        login,
        logout, 
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}


