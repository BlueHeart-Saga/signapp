import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { getCurrentUser, getToken, logout as authLogout } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const [user, setUser] = useState(null);

    const login = async (token, userData) => {
        setUserToken(token);
        setUser(userData);
        setIsLoading(false);
    };

    const logout = async () => {
        setIsLoading(true);
        await authLogout();
        setUserToken(null);
        setUser(null);
        setIsLoading(false);
    };

    const isLoggedIn = async () => {
        try {
            const token = await getToken();
            const userData = await getCurrentUser();
            if (token) {
                setUserToken(token);
                setUser(userData);
            }
        } catch (e) {
            console.log(`isLoggedIn error: ${e}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    return (
        <AuthContext.Provider value={{ login, logout, isLoading, userToken, user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
