import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

const STORAGE_KEYS = {
  DURATION: '@giro/duration',
  FOCUS_COUNT: '@giro/focus_count',
};

// Types
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface UsePomodoroProps {
  initialDuration?: number; // in milliseconds
  onComplete?: () => void;
}

export const usePomodoro = ({ initialDuration = 25 * 60 * 1000, onComplete }: UsePomodoroProps = {}) => {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [duration, setDuration] = useState(initialDuration);
  const [completedCycles, setCompletedCycles] = useState(0); 

  const endTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  // Load persistence
  useEffect(() => {
    (async () => {
      try {
        const [savedDuration, savedCount] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.DURATION),
          AsyncStorage.getItem(STORAGE_KEYS.FOCUS_COUNT),
        ]);

        if (savedDuration) {
          const d = parseInt(savedDuration, 10);
          setDuration(d);
          setTimeLeft(d);
        }
        if (savedCount) {
          setCompletedCycles(parseInt(savedCount, 10));
        }
      } catch (e) {
        console.error('Failed to load persistence', e);
      }
    })();
  }, []);

  const saveFocusCount = async (count: number) => {
      try {
          await AsyncStorage.setItem(STORAGE_KEYS.FOCUS_COUNT, count.toString());
      } catch (e) {}
  };

  // Handle App State Changes (Background/Foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground
        if (status === 'running' && endTimeRef.current) {
          const now = Date.now();
          const remaining = endTimeRef.current - now;
          if (remaining <= 0) {
            completeTimer();
          } else {
            setTimeLeft(remaining);
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [status]);

  // Timer Tick Logic
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        if (endTimeRef.current) {
          const now = Date.now();
          const remaining = endTimeRef.current - now;
          
          if (remaining <= 0) {
            completeTimer();
          } else {
            setTimeLeft(remaining);
          }
        }
      }, 100); // Check every 100ms for smoothness
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => clearInterval(intervalRef.current!);
  }, [status]);

  const startTimer = useCallback(async () => {
    if (timeLeft <= 0) {
        resetTimer();
        return;
    }

    // Request permissions first
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    const now = Date.now();
    const end = now + timeLeft;
    endTimeRef.current = end;
    setStatus('running');

    // Schedule notification
    if (finalStatus === 'granted') {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Tempo esgotado! \uD83C\uDF89", // Party popper
          body: "Seu ciclo de foco terminou. Hora de descansar!",
          sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(end)
        },
      });
    }
  }, [timeLeft]);

  const pauseTimer = useCallback(async () => {
    if (status === 'running') {
      setStatus('paused');
      await Notifications.cancelAllScheduledNotificationsAsync();
      // Calculate remaining time precisely
      if (endTimeRef.current) {
        const now = Date.now();
        const remaining = Math.max(0, endTimeRef.current - now);
        setTimeLeft(remaining);
      }
    }
  }, [status]);

  const resetTimer = useCallback(async () => {
    setStatus('idle');
    setTimeLeft(duration);
    endTimeRef.current = null;
    await Notifications.cancelAllScheduledNotificationsAsync();
  }, [duration]);

  const completeTimer = useCallback(async () => {
    setStatus('completed');
    setTimeLeft(0);
    endTimeRef.current = null;
    
    // Update count
    setCompletedCycles(prev => {
        const newCount = prev + 1;
        saveFocusCount(newCount);
        return newCount;
    });

    if (onComplete) onComplete();
  }, [onComplete]);

  const setTimerDuration = useCallback((ms: number) => {
    // Only allow changing duration if not running (or force reset)
    if (status !== 'running') {
        setDuration(ms);
        setTimeLeft(ms);
        setStatus('idle'); // Reset status on manual change
        AsyncStorage.setItem(STORAGE_KEYS.DURATION, ms.toString()).catch(() => {});
    }
  }, [status]);

  return {
    status,
    timeLeft,
    duration,
    completedCycles,
    startTimer,
    pauseTimer,
    resetTimer,
    setTimerDuration,
    progress: 1 - (timeLeft / duration) // useful for circular progress
  };
};
