import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../constants/theme';
import recipientService from '../services/recipientService';
import authService from '../services/authService';
import SignaturePad from '../components/SignaturePad';

const SigningScreen = ({ route, navigation }) => {
    const { documentId, filename } = route.params;
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [recipient, setRecipient] = useState(null);
    const [fields, setFields] = useState([]);
    const [currentField, setCurrentField] = useState(null);
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [showTextModal, setShowTextModal] = useState(false);
    const [textValue, setTextValue] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const user = await authService.getUser();
            const recipients = await recipientService.listRecipients(documentId);

            // Find the recipient that matches current user
            const myRecipient = recipients.find(r => r.email === user.email);

            if (!myRecipient) {
                Alert.alert('Error', 'You are not a recipient of this document.');
                navigation.goBack();
                return;
            }

            setRecipient(myRecipient);

            // Get fields for this recipient
            const allFields = await recipientService.getDocumentFields(documentId, myRecipient.id);
            setFields(allFields.filter(f => !f.is_completed));

        } catch (error) {
            console.error('Load data error:', error);
            Alert.alert('Error', 'Failed to load signing data.');
        } finally {
            setLoading(false);
        }
    };

    const handleFieldPress = (field) => {
        setCurrentField(field);
        if (field.type === 'signature' || field.type === 'initials') {
            setShowSignaturePad(true);
        } else {
            setTextValue(field.value || '');
            setShowTextModal(true);
        }
    };

    const handleTextSubmit = async () => {
        if (!textValue.trim() && currentField.required) {
            Alert.alert('Required', 'This field is required.');
            return;
        }

        try {
            setSubmitting(true);
            setShowTextModal(false);

            await recipientService.submitField(recipient.id, currentField.id, textValue);

            Alert.alert('Success', 'Field updated successfully!');

            // Reload fields
            const allFields = await recipientService.getDocumentFields(documentId, recipient.id);
            const pendingFields = allFields.filter(f => !f.is_completed);
            setFields(pendingFields);

            if (pendingFields.length === 0) {
                Alert.alert('Completed', 'All fields completed!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            console.error('Submit field error:', error);
            Alert.alert('Error', 'Failed to submit field.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSignatureOK = async (signature) => {
        try {
            setSubmitting(true);
            setShowSignaturePad(false);

            // Submit signature to backend
            await recipientService.submitField(recipient.id, currentField.id, {
                image: signature
            });

            Alert.alert('Success', 'Signature applied successfully!');

            // Reload fields
            const allFields = await recipientService.getDocumentFields(documentId, recipient.id);
            const pendingFields = allFields.filter(f => !f.is_completed);
            setFields(pendingFields);

            if (pendingFields.length === 0) {
                Alert.alert('Completed', 'All fields signed!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            console.error('Submit signature error:', error);
            Alert.alert('Error', 'Failed to submit signature.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (showSignaturePad) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setShowSignaturePad(false)}>
                        <Text style={styles.backButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Sign Field</Text>
                    <View style={{ width: 50 }} />
                </View>
                <View style={styles.padContainer}>
                    <SignaturePad
                        onOK={handleSignatureOK}
                        onClear={() => { }}
                        descriptionText={currentField?.label || "Please sign your name"}
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.title} numberOfLines={1}>{filename}</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.recipientInfo}>
                    <Text style={styles.infoText}>Welcome, {recipient?.name}</Text>
                    <Text style={styles.subInfoText}>Please complete the following fields:</Text>
                </View>

                {fields.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No pending fields for this document.</Text>
                    </View>
                ) : (
                    fields.map((field) => (
                        <TouchableOpacity
                            key={field.id}
                            style={styles.fieldItem}
                            onPress={() => handleFieldPress(field)}
                        >
                            <View style={styles.fieldIcon}>
                                <Text style={styles.fieldIconText}>{field.type.charAt(0).toUpperCase()}</Text>
                            </View>
                            <View style={styles.fieldDetails}>
                                <Text style={styles.fieldLabel}>{field.label || field.type.toUpperCase()}</Text>
                                <Text style={styles.fieldPage}>Page {field.page + 1}</Text>
                            </View>
                            <View style={styles.actionIcon}>
                                <Text style={styles.actionIconText}>→</Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            <Modal
                visible={showTextModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowTextModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{currentField?.label || 'Enter Value'}</Text>
                        <TextInput
                            style={styles.textInput}
                            value={textValue}
                            onChangeText={setTextValue}
                            placeholder="Type here..."
                            autoFocus={true}
                            multiline={currentField?.type === 'textbox'}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelModalButton]}
                                onPress={() => setShowTextModal(false)}
                            >
                                <Text style={styles.cancelModalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.submitModalButton]}
                                onPress={handleTextSubmit}
                            >
                                <Text style={styles.submitModalButtonText}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {submitting && (
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color={COLORS.white} />
                    <Text style={styles.overlayText}>Submitting...</Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 15,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButtonText: {
        color: COLORS.primary,
        ...FONTS.body3,
        fontWeight: 'bold',
    },
    title: {
        flex: 1,
        textAlign: 'center',
        ...FONTS.h3,
        color: COLORS.text,
    },
    content: {
        flex: 1,
    },
    recipientInfo: {
        padding: 20,
        backgroundColor: COLORS.white,
        marginBottom: 10,
    },
    infoText: {
        ...FONTS.h3,
        color: COLORS.text,
    },
    subInfoText: {
        ...FONTS.body3,
        color: COLORS.textSecondary,
        marginTop: 5,
    },
    fieldItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 15,
        marginHorizontal: 15,
        marginVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    fieldIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fieldIconText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 18,
    },
    fieldDetails: {
        flex: 1,
        marginLeft: 15,
    },
    fieldLabel: {
        ...FONTS.body3,
        color: COLORS.text,
        fontWeight: '600',
    },
    fieldPage: {
        ...FONTS.body4,
        color: COLORS.textSecondary,
    },
    actionIcon: {
        padding: 5,
    },
    actionIconText: {
        fontSize: 20,
        color: COLORS.textSecondary,
    },
    padContainer: {
        flex: 1,
        padding: 20,
    },
    emptyContainer: {
        padding: 50,
        alignItems: 'center',
    },
    emptyText: {
        ...FONTS.body3,
        color: COLORS.textSecondary,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    overlayText: {
        color: COLORS.white,
        marginTop: 10,
        ...FONTS.body3,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        backgroundColor: COLORS.white,
        borderRadius: 15,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalTitle: {
        ...FONTS.h3,
        color: COLORS.text,
        marginBottom: 15,
    },
    textInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        ...FONTS.body3,
        color: COLORS.text,
        minHeight: 50,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 20,
    },
    modalButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        marginLeft: 10,
    },
    cancelModalButton: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    submitModalButton: {
        backgroundColor: COLORS.primary,
    },
    cancelModalButtonText: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    submitModalButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
});

export default SigningScreen;
