import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../store/authContext';
import documentService from '../services/documentService';
import DocumentCard from '../components/DocumentCard';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const DashboardScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchDocuments = useCallback(async (isRefreshing = false) => {
        if (!isRefreshing) setLoading(true);
        setError(null);
        try {
            const data = await documentService.getDocuments();
            setDocuments(data);
        } catch (err) {
            setError('Failed to load documents. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDocuments(true);
    };

    const handleDocumentPress = (document) => {
        navigation.navigate('DocumentViewer', { documentId: document.id, filename: document.filename });
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                    source={require('../../assets/logo/logo.png')}
                    style={styles.headerLogo}
                    resizeMode="contain"
                />
                <View style={{ marginLeft: 12 }}>
                    <Text style={styles.welcomeText}>Welcome back,</Text>
                    <Text style={styles.userName}>{user?.name || 'User'}</Text>
                </View>
            </View>
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No documents found</Text>
            <TouchableOpacity
                style={styles.retryButton}
                onPress={() => fetchDocuments()}
            >
                <Text style={styles.retryButtonText}>Refresh</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {renderHeader()}
            <View style={styles.content}>
                <Text style={styles.sectionTitle}>Your Documents</Text>
                <FlatList
                    data={documents}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <DocumentCard
                            document={item}
                            onPress={() => handleDocumentPress(item)}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                    }
                    ListEmptyComponent={renderEmpty}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerLogo: {
        width: 40,
        height: 40,
    },
    welcomeText: {
        ...FONTS.body4,
        color: COLORS.textSecondary,
    },
    userName: {
        ...FONTS.h2,
        color: COLORS.text,
    },
    logoutButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: COLORS.error + '15',
    },
    logoutText: {
        ...FONTS.body4,
        color: COLORS.error,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    sectionTitle: {
        ...FONTS.h3,
        marginBottom: 15,
        color: COLORS.text,
    },
    listContent: {
        paddingBottom: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        ...FONTS.body3,
        color: COLORS.textSecondary,
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: SIZES.radius,
    },
    retryButtonText: {
        ...FONTS.body3,
        color: COLORS.white,
        fontWeight: 'bold',
    },
});

export default DashboardScreen;
