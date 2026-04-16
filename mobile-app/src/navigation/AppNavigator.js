import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../store/authContext';
import { COLORS } from '../constants/theme';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import DocumentViewerScreen from '../screens/DocumentViewerScreen';
import SigningScreen from '../screens/SigningScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();

const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
);

const MainStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: {
                backgroundColor: COLORS.primary,
            },
            headerTintColor: COLORS.white,
            headerTitleStyle: {
                fontWeight: 'bold',
            },
        }}
    >
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="DocumentViewer" component={DocumentViewerScreen} options={{ title: 'Document Details' }} />
        <Stack.Screen name="Signing" component={SigningScreen} options={{ title: 'Sign Document' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
);

const AppNavigator = () => {
    const { isLoading, userToken } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {userToken == null ? <AuthStack /> : <MainStack />}
        </NavigationContainer>
    );
};

export default AppNavigator;
