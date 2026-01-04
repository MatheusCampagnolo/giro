import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CircularSlider } from '../components/CircularSlider';
import { PresetButtons } from '../components/PresetButtons';
import { usePomodoro } from '../hooks/usePomodoro';

const { width } = Dimensions.get('window');

const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function Index() {
    const insets = useSafeAreaInsets();
    const {
        status,
        timeLeft,
        startTimer,
        pauseTimer,
        resetTimer,
        setTimerDuration,
        duration
    } = usePomodoro();

    const isRunning = status === 'running';
    const focusOpacity = useSharedValue(1);

    useEffect(() => {
        focusOpacity.value = withTiming(isRunning ? 0 : 1, { duration: 500 });
    }, [isRunning]);

    const animatedFocusStyle = useAnimatedStyle(() => ({
        opacity: focusOpacity.value,
        transform: [{ translateY: withTiming(isRunning ? 20 : 0) }],
    }));

    const handleStartPause = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    }, [isRunning, pauseTimer, startTimer]);

    const handleReset = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        resetTimer();
    }, [resetTimer]);

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

            {/* Header / Top Section */}
            <View style={styles.header}>
                <Text style={styles.appName}>Giro</Text>
                <TouchableOpacity style={styles.settingsButton}>
                    <Ionicons name="settings-outline" size={24} color="#94A3B8" />
                </TouchableOpacity>
            </View>

            {/* Presets - Added to top as requested */}
            <View style={{ width: '100%', paddingBottom: 20 }}>
                <PresetButtons onSelect={setTimerDuration} disabled={isRunning} />
            </View>

            {/* Main Timer Display */}
            <View style={styles.timerContainer}>
                <View style={styles.sliderWrapper}>
                    <CircularSlider
                        duration={isRunning || status === 'paused' ? timeLeft : duration}
                        maxDuration={60 * 60 * 1000} // 60 mins max on slider
                        onUpdate={(val) => setTimerDuration(val)}
                        disabled={isRunning || status !== 'idle'}
                    />
                    {/* Center Time Display */}
                    <View style={styles.timeDisplay}>
                        <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>
                        <Text style={styles.statusText}>
                            {status === 'idle' ? 'Pronto para focar' :
                                status === 'running' ? 'Foco total' :
                                    status === 'paused' ? 'Pausado' : 'Concluído'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Main Control Button - Removed Presets from here */}
            <View style={styles.controlsSection}>
                {/* Spacer or additional controls if needed */}
            </View>

            <View style={styles.actionButtonContainer}>
                {status !== 'idle' && (
                    <TouchableOpacity
                        style={[styles.smallButton, { marginRight: 20 }]}
                        onPress={handleReset}
                    >
                        <Ionicons name="refresh" size={24} color="#EF4444" />
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.mainButton, isRunning ? styles.stopButton : styles.startButton]}
                    onPress={handleStartPause}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name={isRunning ? "pause" : "play"}
                        size={32}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A', // Slate 900
        alignItems: 'center',
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginTop: 10,
        marginBottom: 40,
    },
    appName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#F8FAFC',
        letterSpacing: -0.5,
    },
    settingsButton: {
        padding: 8,
    },
    timerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sliderWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeDisplay: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeText: {
        fontSize: 56,
        fontWeight: '800',
        color: '#F8FAFC',
        fontVariant: ['tabular-nums'],
        letterSpacing: 2,
    },
    statusText: {
        fontSize: 14,
        color: '#94A3B8', // Slate 400
        marginTop: 4,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    controlsSection: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20, // Reduced margin
    },
    actionButtonContainer: {
        paddingBottom: 40, // Use padding instead of absolute positioning if possible, but stuck to absolute for now
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },

    mainButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    startButton: {
        backgroundColor: '#4F46E5', // Indigo 600
    },
    stopButton: {
        backgroundColor: '#F59E0B', // Amber 500
    },
    smallButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#1E293B',
        alignItems: 'center',
        justifyContent: 'center',
    }
});
