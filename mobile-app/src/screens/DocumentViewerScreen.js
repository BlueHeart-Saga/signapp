import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
    TouchableOpacity,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { COLORS, FONTS } from '../constants/theme';
import api from '../services/api';

const DocumentViewerScreen = ({ route, navigation }) => {
    const { documentId, filename } = route.params;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Use the signed-download endpoint to see the latest version with signatures
    const pdfUrl = `${api.defaults.baseURL}/documents/${documentId}/signed-download`;

    // On Android, WebView cannot render PDF directly, need a viewer or use iOS-style if on iOS
    const viewerUrl = Platform.OS === 'ios'
        ? pdfUrl
        : `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`;

    const source = {
        uri: viewerUrl,
        headers: {
            Authorization: api.defaults.headers.common['Authorization'],
        },
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.title} numberOfLines={1}>{filename}</Text>
                <View style={{ width: 60 }} />
            </View>

            <View style={styles.content}>
                {loading && (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loaderText}>Loading PDF...</Text>
                    </View>
                )}

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => {
                                setError(null);
                                setLoading(true);
                            }}
                        >
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <WebView
                    source={source}
                    onLoad={() => setLoading(false)}
                    onError={(err) => {
                        console.error('WebView error:', err);
                        setError('Failed to load document preview.');
                        setLoading(false);
                    }}
                    style={styles.pdf}
                    originWhitelist={['*']}
                    scalesPageToFit={true}
                />
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.signButton}
                    onPress={() => navigation.navigate('Signing', { documentId, filename })}
                >
                    <Text style={styles.signButtonText}>Sign Document</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: 10,
    },
    backButtonText: {
        ...FONTS.body3,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    title: {
        ...FONTS.h3,
        color: COLORS.text,
        flex: 1,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        position: 'relative',
    },
    pdf: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        backgroundColor: COLORS.background,
    },
    loaderContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    loaderText: {
        marginTop: 10,
        ...FONTS.body3,
        color: COLORS.textSecondary,
    },
    errorContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
        padding: 20,
    },
    errorText: {
        ...FONTS.body3,
        color: COLORS.error,
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryText: {
        color: COLORS.white,
        ...FONTS.body3,
        fontWeight: 'bold',
    },
    footer: {
        padding: 20,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    signButton: {
        backgroundColor: COLORS.primary,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    signButtonText: {
        color: COLORS.white,
        ...FONTS.h3,
        fontWeight: 'bold',
    },
});

export default DocumentViewerScreen;
