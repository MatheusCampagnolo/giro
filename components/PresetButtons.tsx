import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PresetButtonsProps {
    onSelect: (duration: number) => void;
    disabled?: boolean;
}

const PRESETS = [
    { label: 'Revisão', minutes: 15, emoji: '⚡' },
    { label: 'Clássico', minutes: 25, emoji: '🍅' },
    { label: 'Foco Total', minutes: 50, emoji: '🔥' },
];

export const PresetButtons: React.FC<PresetButtonsProps> = ({ onSelect, disabled }) => {
    const handlePress = (minutes: number) => {
        if (disabled) return;
        Haptics.selectionAsync();
        onSelect(minutes * 60 * 1000);
    };

    return (
        <View style={styles.container}>
            {PRESETS.map((preset) => (
                <TouchableOpacity
                    key={preset.label}
                    style={[styles.button, disabled && styles.disabled]}
                    onPress={() => handlePress(preset.minutes)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.emoji}>{preset.emoji}</Text>
                    <Text style={styles.label}>{preset.label}</Text>
                    <Text style={styles.time}>{preset.minutes}m</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 20,
        marginTop: 20,
        gap: 12,
    },
    button: {
        flex: 1,
        backgroundColor: '#1F2937', // Gray 800
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#374151',
    },
    disabled: {
        opacity: 0.5,
    },
    emoji: {
        fontSize: 24,
        marginBottom: 8,
    },
    label: {
        color: '#D1D5DB', // Gray 300
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
    },
    time: {
        color: '#9CA3AF',
        fontSize: 10,
    },
});
