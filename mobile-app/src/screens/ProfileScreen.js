import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../store/authContext';
import { COLORS, FONTS } from '../constants/theme';

const ProfileScreen = ({ navigation }) => {
    const { user, logout } = useAuth();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </Text>
                    </View>
                    <Text style={styles.name}>{user?.name || 'User'}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{user?.role?.toUpperCase() || 'USER'}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Settings</Text>
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuItemText}>Edit Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuItemText}>Change Password</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuItemText}>Notifications</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>App Settings</Text>
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuItemText}>Help & Support</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuItemText}>Privacy Policy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuItemText}>About SafeSign</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Version 1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: 20,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: COLORS.white,
        borderRadius: 15,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarText: {
        fontSize: 32,
        color: COLORS.white,
        fontWeight: 'bold',
    },
    name: {
        ...FONTS.h2,
        color: COLORS.text,
    },
    email: {
        ...FONTS.body3,
        color: COLORS.textSecondary,
        marginTop: 5,
    },
    badge: {
        marginTop: 10,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: COLORS.primaryLight,
    },
    badgeText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    section: {
        backgroundColor: COLORS.white,
        borderRadius: 15,
        marginBottom: 20,
        padding: 10,
        elevation: 2,
    },
    sectionTitle: {
        ...FONTS.h3,
        color: COLORS.text,
        marginLeft: 10,
        marginTop: 10,
        marginBottom: 15,
    },
    menuItem: {
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    menuItemText: {
        ...FONTS.body3,
        color: COLORS.text,
    },
    logoutButton: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.error,
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    logoutButtonText: {
        color: COLORS.error,
        ...FONTS.h3,
        fontWeight: 'bold',
    },
    versionText: {
        textAlign: 'center',
        marginTop: 30,
        color: COLORS.textSecondary,
        fontSize: 12,
    },
});

export default ProfileScreen;
