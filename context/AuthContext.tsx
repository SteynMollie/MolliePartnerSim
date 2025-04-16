import React, { createContext, useContext, useState, ReactNode} from 'react';
import { useRouter } from 'expo-router';

// Defining the shape of the context data 
interface AuthContextData {
    isAuthenticated: boolean;
    user: User | null; // Add user state
    login: (userData: User) => void; // login now accepts userData
    logout: () => void;
  }

export interface User {
    userId: string;
    name: string;
    email: string;
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
    const [user, setUser] = useState<User | null>(null); // Add state for user data
    const router = useRouter();
  
    // login now accepts userData and stores it
    const login = (userData: User) => { 
      console.log("AuthContext: Logging in user:", userData);
      setUser(userData); // Store the user data
      setIsAuthenticated(true);
      router.replace('/'); 
    };
  
    // logout now clears the user data as well
    const logout = () => { 
      console.log("AuthContext: Logging out...");
      setUser(null); // Clear user data
      setIsAuthenticated(false);
      router.replace('/login'); 
    };
  
    // Provide the updated value including the user
    const value = {
      isAuthenticated,
      user, // Provide user state
      login,
      logout,
    };
  
    return (
      <AuthContext.Provider value={value}>
        {children} 
      </AuthContext.Provider>
    );
  }