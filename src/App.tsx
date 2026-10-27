import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SOUNDS, SoundDefinition, TimerOption } from './types';
import { generateWavBlob } from './utils/wavGenerator';
import Header from './components/Header';
import PlayerCard from './components/PlayerCard';
import TimerModal from './components/TimerModal';
import BottomController from './components/BottomController';
import useWakeLock from './hooks/useWakeLock';

interface SoundState {
  isPlaying: boolean;
  volume: number;
}

export default function App() {
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
  const [timerMinutes, setTimerMinutes] = useState<TimerOption>(30);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [wavUrls, setWavUrls] = useState<Record<string, string>>({});

  const { requestWakeLock, releaseWakeLock } = useWakeLock();

  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const fadeIntervalRef = useRef<any>(null);
  const totalTimerRef = useRef<any>(null);
  const countdownTimerRef = useRef<any>(null);
  const fadeStepRef = useRef<number>(0);

  // 앱 구동 시 오디오 버퍼 기반 .wav Blob URL 동적 생성
  useEffect(() => {
    let isMounted = true;
    async function initWavs() {
      const urls: Record<string, string> = {};
      for (const sound of SOUNDS) {
        const url = await generateWavBlob(sound.type, sound.durationSec);
        urls[sound.id] = url;
      }
      if (isMounted) {
        setWavUrls(urls);
      }
    }
    initWavs();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('baby_white_noise_states', JSON.stringify(soundStates));
  }, [soundStates]);

  useEffect(() => {
    localStorage.setItem('baby_white_noise_master_vol', masterVolume.toString());
  }, [masterVolume]);

  // WAV URL이 준비되면 Audio 객체 바인딩
  useEffect(() => {
    if (Object.keys(wavUrls).length === 0) return;

    SOUNDS.forEach((sound) => {
      const url = wavUrls[sound.id];
      if (url && !audioElementsRef.current.has(sound.id)) {
        const audio = new Audio();
        audio.loop = true;
        audio.preload = 'auto';
        audio.src = url;
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
  }, [wavUrls]);

  // 총 재생 시간 카운터
  useEffect(() => {
    const anyPlaying = Object.values(soundStates).some((s) => s.isPlaying);
    setIsGlobalPlaying(anyPlaying);

    if (anyPlaying) {
      if (!totalTimerRef.current) {
        totalTimerRef.current = setInterval(() => {
          setTotalPlaySeconds((prev) => prev + 1);
        }, 1000);
      }
      requestWakeLock();
    } else {
      if (totalTimerRef.current) {
        clearInterval(totalTimerRef.current);
        totalTimerRef.current = null;
      }
      releaseWakeLock();
    }
  }, [soundStates, requestWakeLock, releaseWakeLock]);

  // 실제 오디오 재생/정지 및 볼륨 동기화
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

  const stopAllSounds = useCallback(() => {
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
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setRemainingSeconds(null);
    releaseWakeLock();
  }, [releaseWakeLock]);

  const startFadeOutAndStop = useCallback(() => {
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

    fadeStepRef.current = 0;
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    fadeIntervalRef.current = setInterval(() => {
      fadeStepRef.current += 1;
      const progress = fadeStepRef.current / steps;
      const ratio = Math.max(0, 1 - progress);

      SOUNDS.forEach((sound) => {
        const audio = audioElementsRef.current.get(sound.id);
        if (audio) {
          audio.volume = (initialVolumes[sound.id] || 0) * ratio;
        }
      });

      if (fadeStepRef.current >= steps) {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
        stopAllSounds();
      }
    }, intervalTime);
  }, [isFadingOut, stopAllSounds]);

  // 타이머 핸들링
  useEffect(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    if (isGlobalPlaying && timerMinutes !== 'infinite') {
      const totalSecs = timerMinutes * 60;
      setRemainingSeconds(totalSecs);

      countdownTimerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
            startFadeOutAndStop();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setRemainingSeconds(null);
    }

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [isGlobalPlaying, timerMinutes, startFadeOutAndStop]);

  // 단일 플레이어 선택 방식 (기존 소음 정지 및 선택한 소음 단독 재생)
  const handleToggleSound = useCallback((id: string) => {
    setSoundStates((prev) => {
      const targetWasPlaying = prev[id]?.isPlaying ?? false;
      const next: Record<string, SoundState> = {};
      SOUNDS.forEach((sound) => {
        if (sound.id === id) {
          next[sound.id] = {
            ...(prev[sound.id] || { volume: 0.7 }),
            isPlaying: !targetWasPlaying,
          };
        } else {
          next[sound.id] = {
            ...(prev[sound.id] || { volume: 0.7 }),
            isPlaying: false,
          };
        }
      });
      return next;
    });
    if (isFadingOut) {
      setIsFadingOut(false);
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
    }
  }, [isFadingOut]);

  const handleVolumeChange = useCallback((id: string, vol: number) => {
    setSoundStates((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { isPlaying: false }),
        volume: vol,
      },
    }));
  }, []);

  const handleGlobalToggle = useCallback(() => {
    if (isGlobalPlaying) {
      stopAllSounds();
    } else {
      const activeId = Object.keys(soundStates).find((k) => soundStates[k].isPlaying) || SOUNDS[0].id;
      handleToggleSound(activeId);
    }
  }, [isGlobalPlaying, soundStates, stopAllSounds, handleToggleSound]);

  return (
    <div className="min-h-screen bg-[#121826] text-[#F1F5F9] pb-32 flex flex-col">
      <Header
        totalPlaySeconds={totalPlaySeconds}
        remainingSeconds={remainingSeconds}
        timerMinutes={timerMinutes}
        onOpenTimer={() => setIsTimerModalOpen(true)}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        <div className="bg-[#1E293B]/60 border border-slate-700/50 rounded-2xl p-6 text-center shadow-lg backdrop-blur">
          <h2 className="text-xl font-bold text-[#F1F5F9] mb-2">
            단일 플레이어 백색소음 시스템
          </h2>
          <p className="text-sm text-slate-300 max-w-lg mx-auto">
            아기가 가장 편안해 하는 소음을 선택해 주세요. 하나의 소음만 집중 재생되어 아기의 숙면을 돕습니다.
          </p>
        </div>

        {/* 6종 소음 리스트 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SOUNDS.map((sound) => {
            const state = soundStates[sound.id] || { isPlaying: false, volume: 0.7 };
            return (
              <PlayerCard
                key={sound.id}
                sound={sound}
                isPlaying={state.isPlaying}
                volume={state.volume}
                onToggle={handleToggleSound}
                onVolumeChange={handleVolumeChange}
              />
            );
          })}
        </div>
      </main>

      <BottomController
        isGlobalPlaying={isGlobalPlaying}
        onGlobalToggle={handleGlobalToggle}
        masterVolume={masterVolume}
        onMasterVolumeChange={setMasterVolume}
        timerMinutes={timerMinutes}
        remainingSeconds={remainingSeconds}
        onOpenTimer={() => setIsTimerModalOpen(true)}
      />

      <TimerModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
        currentTimer={timerMinutes}
        onSelectTimer={(opt) => setTimerMinutes(opt)}
      />
    </div>
  );
}
