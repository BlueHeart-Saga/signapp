import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const DocumentCard = ({ document, onPress }) => {
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'finalized':
                return COLORS.success;
            case 'sent':
            case 'in_progress':
                return COLORS.primary;
            case 'declined':
            case 'expired':
            case 'voided':
                return COLORS.error;
            case 'draft':
                return COLORS.warning || '#FFC107';
            default:
                return COLORS.textSecondary;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            style={styles.container}
            onPress={onPress}
        >
            <View style={styles.header}>
                <Text style={styles.title} numberOfLines={1}>
                    {document.filename || 'Untitled Document'}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(document.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(document.status) }]}>
                        {document.status || 'Draft'}
                    </Text>
                </View>
            </View>

            <Text style={styles.date}>
                Created: {formatDate(document.uploaded_at)}
            </Text>

            {document.signing_progress && (
                <View style={styles.footer}>
                    <View style={styles.progressRow}>
                        <Text style={styles.progressLabel}>Progress</Text>
                        <Text style={styles.progressValue}>
                            {document.signing_progress.signed}/{document.signing_progress.total}
                        </Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                        <View
                            style={[
                                styles.progressBar,
                                { width: `${document.signing_progress.percentage}%` }
                            ]}
                        />
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: SIZES.radius,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 2,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        ...FONTS.h3,
        color: COLORS.text,
        flex: 1,
        marginRight: 10,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        ...FONTS.body3,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    date: {
        ...FONTS.body3,
        color: COLORS.textSecondary,
        marginBottom: 10,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 10,
        marginTop: 5,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabel: {
        ...FONTS.body4,
        color: COLORS.textSecondary,
    },
    progressValue: {
        ...FONTS.body4,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    progressBarContainer: {
        height: 6,
        backgroundColor: COLORS.border,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 3,
    },
});

export default DocumentCard;
