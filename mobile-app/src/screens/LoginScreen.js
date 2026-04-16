import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { useAuth } from '../store/authContext';
import { login } from '../services/authService';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { login: authLogin } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await login(email, password);
            authLogin(data.access_token, data.user);
        } catch (err) {
            console.log(err);
            const msg = err.response?.data?.detail?.message ||
                err.response?.data?.message ||
                'Invalid email or password';
            setError(msg);
            Alert.alert('Login Failed', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.headerSection}>
                        <View style={styles.logoContainer}>
                            <Text style={styles.logoText}>SafeSign</Text>
                        </View>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Sign in to your account to continue</Text>
                    </View>

                    <View style={styles.formSection}>
                        <InputField
                            label="Email Address"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            error={error && !email ? 'Email is required' : null}
                        />

                        <InputField
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            error={error && !password ? 'Password is required' : null}
                        />

                        {error && <Text style={styles.errorBanner}>{error}</Text>}

                        <Button
                            title="Sign In"
                            onPress={handleLogin}
                            loading={loading}
                            style={{ marginTop: 20 }}
                        />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>New to SafeSign? </Text>
                            <Text style={styles.registerLink}>Create Account</Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    scrollContent: {
        flexGrow: 1,
        padding: SIZES.padding,
        justifyContent: 'center',
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        backgroundColor: COLORS.secondary,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoText: {
        ...FONTS.h2,
        color: COLORS.primary,
    },
    title: {
        ...FONTS.h1,
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        ...FONTS.body2,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    formSection: {
        width: '100%',
    },
    errorBanner: {
        ...FONTS.body3,
        color: COLORS.error,
        textAlign: 'center',
        marginTop: 10,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    footerText: {
        ...FONTS.body2,
        color: COLORS.textSecondary,
    },
    registerLink: {
        ...FONTS.body2,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
});

export default LoginScreen;
