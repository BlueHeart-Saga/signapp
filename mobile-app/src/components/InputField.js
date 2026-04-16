import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const InputField = ({ label, error, secureTextEntry, ...props }) => {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[styles.inputContainer, error && styles.errorInput]}>
                <TextInput
                    style={styles.input}
                    placeholderTextColor={COLORS.textSecondary}
                    secureTextEntry={secureTextEntry}
                    autoCapitalize="none"
                    {...props}
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 10,
    },
    label: {
        ...FONTS.label,
        color: COLORS.text,
        marginBottom: 5,
    },
    inputContainer: {
        height: 50,
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
    },
    input: {
        ...FONTS.body2,
        color: COLORS.text,
        width: '100%',
    },
    errorInput: {
        borderColor: COLORS.error,
    },
    errorText: {
        ...FONTS.body3,
        color: COLORS.error,
        marginTop: 5,
    },
});

export default InputField;
