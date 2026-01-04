import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedProps,
    useSharedValue
} from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';

const { width } = Dimensions.get('window');
const RADIUS = width * 0.35;
const STROKE_WIDTH = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface CircularSliderProps {
    duration: number; // Current duration in ms
    maxDuration?: number; // Max duration in ms (e.g., 60 mins or 120 mins)
    onUpdate: (duration: number) => void;
    disabled?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const CircularSlider: React.FC<CircularSliderProps> = ({
    duration,
    maxDuration = 60 * 60 * 1000,
    onUpdate,
    disabled = false,
}) => {
    // Convert duration to angle (0 - 2PI)
    const progress = useSharedValue(duration / maxDuration);
    const previousFullMinute = useSharedValue(Math.floor(duration / 60000));

    useEffect(() => {
        progress.value = duration / maxDuration;
    }, [duration, maxDuration]);

    const animatedProps = useAnimatedProps(() => {
        const strokeDashoffset = CIRCUMFERENCE * (1 - progress.value);
        return {
            strokeDashoffset,
        };
    });

    const gesture = Gesture.Pan()
        .onUpdate((e) => {
            if (disabled) return;

            // Calculate center of the SVG wrapper
            const center = RADIUS + STROKE_WIDTH;

            // Calculate angle (0 to 2PI) starting from top (-PI/2)
            const relativeX = e.x - center;
            const relativeY = e.y - center;

            let angle = Math.atan2(relativeY, relativeX);

            // Rotate logic to align 0 rad with 12 o'clock position
            angle += Math.PI / 2;

            // Normalize angle to [0, 2PI] range
            if (angle < 0) angle += 2 * Math.PI;

            // Calculate progress (0.0 to 1.0)
            const newProgress = angle / (2 * Math.PI);

            // Update shared value for animation
            progress.value = newProgress;

            // Calculate corresponding time value
            const timeMs = Math.round(newProgress * maxDuration);
            const minutes = Math.floor(timeMs / 60000);

            // Trigger haptic feedback on minute change

            if (minutes !== previousFullMinute.value) {
                previousFullMinute.value = minutes;
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
            }

            runOnJS(onUpdate)(timeMs);
        });

    const size = (RADIUS + STROKE_WIDTH) * 2;

    return (
        <View style={styles.container}>
            <GestureDetector gesture={gesture}>
                <View style={{ width: size, height: size }}>
                    <Svg width={size} height={size}>
                        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                            {/* Background Track */}
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={RADIUS}
                                stroke="#1E1E1E"
                                strokeWidth={STROKE_WIDTH}
                                fill="transparent"
                            />
                            {/* Progress Arc */}
                            <AnimatedCircle
                                cx={size / 2}
                                cy={size / 2}
                                r={RADIUS}
                                stroke="#4F46E5" // Indigo 600
                                strokeWidth={STROKE_WIDTH}
                                fill="transparent"
                                strokeDasharray={CIRCUMFERENCE}
                                animatedProps={animatedProps}
                                strokeLinecap="round"
                            />
                        </G>
                    </Svg>
                </View>
            </GestureDetector>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
