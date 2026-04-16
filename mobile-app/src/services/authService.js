import api from './api';
import * as SecureStore from 'expo-secure-store';

export const login = async (email, password) => {
    try {
        const formData = new URLSearchParams();
        formData.append('username', email.trim().toLowerCase());
        formData.append('password', password.trim());

        const response = await api.post('/auth/login', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (response.data.access_token) {
            await SecureStore.setItemAsync('userToken', response.data.access_token);
            await SecureStore.setItemAsync('user', JSON.stringify(response.data.user));
        }

        return response.data;
    } catch (error) {
        throw error;
    }
};

export const logout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('user');
};

export const getCurrentUser = async () => {
    const userStr = await SecureStore.getItemAsync('user');
    return userStr ? JSON.parse(userStr) : null;
};

export const getToken = async () => {
    return await SecureStore.getItemAsync('userToken');
};
