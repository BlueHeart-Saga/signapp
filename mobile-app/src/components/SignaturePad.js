import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';
import { COLORS, FONTS } from '../constants/theme';

const SignaturePad = ({ onOK, onClear, onEnd, descriptionText = "Sign here" }) => {
    const ref = useRef();
    const [isReady, setIsReady] = useState(false);

    const handleSignature = (signature) => {
        onOK(signature);
    };

    const handleClear = () => {
        if (!isReady) return;
        ref.current.clearSignature();
        if (onClear) onClear();
    };

    const handleConfirm = () => {
        if (!isReady) return;
        ref.current.readSignature();
    };

    const handleLoad = () => {
        setIsReady(true);
    };

    const style = `.m-signature-pad--footer {display: none; margin: 0px;} body,html {height: 100%;}`;

    return (
        <View style={styles.container}>
            <View style={styles.signatureContainer}>
                <SignatureScreen
                    ref={ref}
                    onEnd={onEnd}
                    onOK={handleSignature}
                    onEmpty={() => console.log("Empty")}
                    onLoad={handleLoad}
                    descriptionText={descriptionText}
                    webStyle={style}
                    autoClear={true}
                    imageType="image/png"
                    androidHardwareAccelerationDisabled={false}
                />
                {!isReady && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                )}
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.clearButton, !isReady && styles.disabledButton]}
                    onPress={handleClear}
                    disabled={!isReady}
                >
                    <Text style={[styles.clearButtonText, !isReady && styles.disabledText]}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.confirmButton, !isReady && styles.disabledButton]}
                    onPress={handleConfirm}
                    disabled={!isReady}
                >
                    <Text style={[styles.confirmButtonText, !isReady && styles.disabledText]}>Confirm</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
    signatureContainer: {
        flex: 1,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    button: {
        flex: 1,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
    },
    clearButton: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    confirmButton: {
        backgroundColor: COLORS.primary,
    },
    clearButtonText: {
        color: COLORS.primary,
        ...FONTS.body3,
        fontWeight: 'bold',
    },
    confirmButtonText: {
        color: COLORS.white,
        ...FONTS.body3,
        fontWeight: 'bold',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.5,
        borderColor: COLORS.border,
    },
    disabledText: {
        color: COLORS.textSecondary,
    },
});

export default SignaturePad;
