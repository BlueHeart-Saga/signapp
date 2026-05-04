import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
    TouchableOpacity,
    FlatList,
    SafeAreaView
} from 'react-native';
import { COLORS, SIZES, FONTS, SPACING } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Enterprise Security',
        quote: 'Sign documents instantly with enterprise-grade security.\nExperience the future of digital signatures today.',
        image: require('../../assets/logo/logo.png'), // Using logo as placeholder for now
    },
    {
        id: '2',
        title: 'Workflow Automation',
        quote: 'Automate your workflows and save hours of paperwork.\nSeamlessly manage agreements from anywhere.',
        image: require('../../assets/logo/logo.png'),
    },
    {
        id: '3',
        title: 'Global Compliance',
        quote: 'Legally binding signatures in over 180 countries.\nBank-level encryption keeping your data safe.',
        image: require('../../assets/logo/logo.png'),
    },
    {
        id: '4',
        title: 'Real-time Tracking',
        quote: 'Real-time updates and live document tracking.\nStay in control of every stage of your journey.',
        image: require('../../assets/logo/logo.png'),
    },
];

const LandingScreen = ({ navigation }) => {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    const updateCurrentSlideIndex = e => {
        const contentOffsetX = e.nativeEvent.contentOffset.x;
        const currentIndex = Math.round(contentOffsetX / width);
        setCurrentSlideIndex(currentIndex);
    };

    const Footer = () => {
        return (
            <View style={styles.footerContainer}>
                {/* Indicator container */}
                <View style={styles.indicatorContainer}>
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.indicator,
                                currentSlideIndex === index && styles.activeIndicator,
                            ]}
                        />
                    ))}
                </View>

                {/* Render buttons */}
                <View style={styles.buttonContainer}>
                    {currentSlideIndex === SLIDES.length - 1 ? (
                        <View style={{ height: 50 }}>
                            <TouchableOpacity
                                style={styles.btn}
                                onPress={() => navigation.replace('Login')}>
                                <Text style={styles.btnText}>GET STARTED</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={[styles.btn, styles.btnSecondary]}
                                onPress={() => navigation.replace('Login')}>
                                <Text style={[styles.btnText, { color: COLORS.primary }]}>SKIP</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={styles.btn}
                                onPress={() => {
                                    // Normally we would scroll the FlatList here
                                }}>
                                <Text style={styles.btnText}>NEXT</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const Slide = ({ item }) => {
        return (
            <View style={styles.slide}>
                <Image
                    source={item.image}
                    style={styles.image}
                    resizeMode="contain"
                />
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.quote}>{item.quote}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                onMomentumScrollEnd={updateCurrentSlideIndex}
                data={SLIDES}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => <Slide item={item} />}
                keyExtractor={item => item.id}
            />
            <Footer />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    slide: {
        width,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SIZES.padding,
    },
    image: {
        width: width * 0.5,
        height: height * 0.25,
        marginBottom: 40,
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        ...FONTS.h1,
        color: COLORS.primary,
        marginBottom: 20,
        textAlign: 'center',
    },
    quote: {
        ...FONTS.body1,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    footerContainer: {
        height: height * 0.25,
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    indicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    indicator: {
        height: 4,
        width: 10,
        backgroundColor: COLORS.border,
        marginHorizontal: 3,
        borderRadius: 2,
    },
    activeIndicator: {
        backgroundColor: COLORS.primary,
        width: 25,
    },
    buttonContainer: {
        marginBottom: 40,
    },
    btn: {
        flex: 1,
        height: 50,
        borderRadius: SIZES.radius,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    btnText: {
        fontWeight: 'bold',
        fontSize: 15,
        color: COLORS.white,
    },
});

export default LandingScreen;
