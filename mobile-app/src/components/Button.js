import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const Button = ({ title, onPress, loading, style, textStyle, variant = 'primary' }) => {
    const isPrimary = variant === 'primary';

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={loading}
            activeOpacity={0.7}
            style={[
                styles.container,
                isPrimary ? styles.primary : styles.secondary,
                style,
                loading && styles.disabled,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={isPrimary ? COLORS.white : COLORS.primary} />
            ) : (
                <Text
                    style={[
                        styles.text,
                        isPrimary ? styles.primaryText : styles.secondaryText,
                        textStyle,
                    ]}
                >
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 50,
        borderRadius: SIZES.radius,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginVertical: 10,
    },
    primary: {
        backgroundColor: COLORS.primary,
    },
    secondary: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    text: {
        ...FONTS.body1,
        fontWeight: '600',
    },
    primaryText: {
        color: COLORS.white,
    },
    secondaryText: {
        color: COLORS.primary,
    },
    disabled: {
        opacity: 0.6,
    },
});

export default Button;
