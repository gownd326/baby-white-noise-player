import { useState, useEffect, useRef, useCallback } from 'react';
import { SOUNDS } from '../types';

interface SoundState {
  isPlaying: boolean;
  volume: number;
}

export function useAudioMixer() {
  const [soundStates, setSoundStates] = useState<Record<string, SoundState>>(() => {
    const saved = localStorage.getItem('baby_white_noise_states');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    const initial: Record<string, SoundState> = {};
    SOUNDS.forEach((sound) => {
      initial[sound.id] = { isPlaying: false, volume: 0.7 };
    });
    return initial;
  });

  const [masterVolume, setMasterVolume] = useState<number>(() => {
    const saved = localStorage.getItem('baby_white_noise_master_vol');
    return saved !== null ? parseFloat(saved) : 1.0;
  });

  const [isGlobalPlaying, setIsGlobalPlaying] = useState<boolean>(false);
  const [totalPlaySeconds, setTotalPlaySeconds] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const totalTimerRef = useRef<any>(null);
  const fadeIntervalRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem('baby_white_noise_states', JSON.stringify(soundStates));
  }, [soundStates]);

  useEffect(() => {
    localStorage.setItem('baby_white_noise_master_vol', masterVolume.toString());
  }, [masterVolume]);

  useEffect(() => {
    SOUNDS.forEach((sound) => {
      if (!audioElementsRef.current.has(sound.id)) {
        const audio = new Audio();
        audio.loop = true;
        audio.preload = 'auto';
        audio.src = sound.src;
        audioElementsRef.current.set(sound.id, audio);
      }
    });

    return () => {
      audioElementsRef.current.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      audioElementsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const anyPlaying = Object.values(soundStates).some((s) => s.isPlaying);
    setIsGlobalPlaying(anyPlaying);

    if (anyPlaying) {
      if (!totalTimerRef.current) {
        totalTimerRef.current = setInterval(() => {
          setTotalPlaySeconds((prev) => prev + 1);
        }, 1000);
      }
    } else {
      if (totalTimerRef.current) {
        clearInterval(totalTimerRef.current);
        totalTimerRef.current = null;
      }
    }
  }, [soundStates]);

  useEffect(() => {
    SOUNDS.forEach((sound) => {
      const state = soundStates[sound.id];
      const audio = audioElementsRef.current.get(sound.id);
      if (!audio) return;

      if (!isFadingOut) {
        const effectiveVolume = Math.min(1, Math.max(0, state.volume * masterVolume));
        audio.volume = effectiveVolume;
      }

      if (state.isPlaying && isGlobalPlaying && !isFadingOut) {
        if (audio.paused) {
          audio.play().catch((err) => {
            console.log('Audio play blocked or error:', err);
          });
        }
      } else {
        if (!audio.paused && !isFadingOut) {
          audio.pause();
        }
      }
    });
  }, [soundStates, masterVolume, isGlobalPlaying, isFadingOut]);

  const toggleSound = useCallback((id: string) => {
    setSoundStates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        isPlaying: !prev[id].isPlaying,
      },
    }));
  }, []);

  const setVolume = useCallback((id: string, volume: number) => {
    setSoundStates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        volume,
      },
    }));
  }, []);

  const stopAll = useCallback(() => {
    setSoundStates((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        next[key] = { ...next[key], isPlaying: false };
      });
      return next;
    });
    setIsGlobalPlaying(false);
    setIsFadingOut(false);
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  }, []);

  const startFadeOut = useCallback((onComplete?: () => void) => {
    if (isFadingOut) return;
    setIsFadingOut(true);

    const fadeDuration = 5000;
    const intervalTime = 100;
    const steps = fadeDuration / intervalTime;

    const initialVolumes: Record<string, number> = {};
    SOUNDS.forEach((sound) => {
      const audio = audioElementsRef.current.get(sound.id);
      if (audio) {
        initialVolumes[sound.id] = audio.volume;
      }
    });

    let currentStep = 0;
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      const ratio = Math.max(0, 1 - currentStep / steps);

      SOUNDS.forEach((sound) => {
        const audio = audioElementsRef.current.get(sound.id);
        if (audio) {
          audio.volume = (initialVolumes[sound.id] || 0) * ratio;
        }
      });

      if (currentStep >= steps) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        stopAll();
        if (onComplete) onComplete();
      }
    }, intervalTime);
  }, [isFadingOut, stopAll]);

  return {
    soundStates,
    masterVolume,
    setMasterVolume,
    isGlobalPlaying,
    totalPlaySeconds,
    isFadingOut,
    toggleSound,
    setVolume,
    stopAll,
    startFadeOut,
  };
}
