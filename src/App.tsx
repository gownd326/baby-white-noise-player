import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SOUNDS, SoundItem, TimerOption } from './types';
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
  // 음원별 재생 상태 및 볼륨 (localStorage 로드)
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

  // 전체 볼륨
  const [masterVolume, setMasterVolume] = useState<number>(() => {
    const saved = localStorage.getItem('baby_white_noise_master_vol');
    return saved !== null ? parseFloat(saved) : 1.0;
  });

  // 전체 재생 여부
  const [isGlobalPlaying, setIsGlobalPlaying] = useState<boolean>(false);

  // 총 재생 시간 (초)
  const [totalPlaySeconds, setTotalPlaySeconds] = useState<number>(0);

  // 타이머 관련 (TimerOption 형식 고수)
  const [timerMinutes, setTimerMinutes] = useState<TimerOption>(30);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  // Wake Lock 연동
  const { requestWakeLock, releaseWakeLock } = useWakeLock();

  // HTML Audio 객체들을 관리하는 맵 ref
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  // 페이드아웃 타이머/인터벌 ref
  const fadeIntervalRef = useRef<any>(null);
  const totalTimerRef = useRef<any>(null);
  const countdownTimerRef = useRef<any>(null);
  const fadeStepRef = useRef<number>(0);

  // localStorage 저장
  useEffect(() => {
    localStorage.setItem('baby_white_noise_states', JSON.stringify(soundStates));
  }, [soundStates]);

  useEffect(() => {
    localStorage.setItem('baby_white_noise_master_vol', masterVolume.toString());
  }, [masterVolume]);

  // 오디오 엘리먼트 초기화 및 관리
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

  // 총 재생 시간 카운터 (최소 1개 이상 재생 중일 때 증가)
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
      const activePlaying = Object.values(soundStates).some((s) => s.isPlaying);
      if (!activePlaying) {
        releaseWakeLock();
      }
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

  // 정지 함수
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

  // 페이드 아웃 시작 함수 (5초간 점진적 감소 후 정지)
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

      if (progress >= 1) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        stopAllSounds();
      } else {
        SOUNDS.forEach((sound) => {
          const audio = audioElementsRef.current.get(sound.id);
          const initVol = initialVolumes[sound.id] ?? 0;
          if (audio) {
            audio.volume = Math.max(0, initVol * (1 - progress));
          }
        });
      }
    }, intervalTime);
  }, [isFadingOut, stopAllSounds]);

  // 타이머 관리
  useEffect(() => {
    if (timerMinutes === 'infinite') {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      setRemainingSeconds(null);
      return;
    }

    const anyPlaying = Object.values(soundStates).some((s) => s.isPlaying);
    if (anyPlaying) {
      if (remainingSeconds === null) {
        setRemainingSeconds((timerMinutes as number) * 60);
      }

      if (!countdownTimerRef.current) {
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
      }
    } else {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    }

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [timerMinutes, soundStates, remainingSeconds, startFadeOutAndStop]);

  // 개별 사운드 토글
  const handleToggleSound = (id: string) => {
    setSoundStates((prev) => {
      const current = prev[id];
      const nextPlaying = !current.isPlaying;
      return {
        ...prev,
        [id]: { ...current, isPlaying: nextPlaying },
      };
    });

    if (!Object.values(soundStates).some((s) => s.isPlaying) && timerMinutes !== 'infinite') {
      setRemainingSeconds((timerMinutes as number) * 60);
    }
  };

  // 개별 볼륨 조절
  const handleVolumeChange = (id: string, vol: number) => {
    setSoundStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], volume: vol },
    }));
  };

  // 전체 재생/정지 버튼 클릭
  const handleGlobalToggle = () => {
    if (isGlobalPlaying) {
      stopAllSounds();
    } else {
      const hasAnyOn = Object.values(soundStates).some((s) => s.isPlaying);
      if (!hasAnyOn) {
        setSoundStates((prev) => ({
          ...prev,
          rain: { ...prev.rain, isPlaying: true },
        }));
      } else {
        setIsGlobalPlaying(true);
      }
      if (timerMinutes !== 'infinite' && remainingSeconds === null) {
        setRemainingSeconds((timerMinutes as number) * 60);
      }
    }
  };

  // 타이머 설정 변경
  const handleSelectTimer = (mins: TimerOption) => {
    setTimerMinutes(mins);
    if (mins === 'infinite') {
      setRemainingSeconds(null);
    } else {
      setRemainingSeconds(mins * 60);
    }
    setIsTimerModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#121826] text-[#F1F5F9] flex flex-col justify-between selection:bg-[#818CF8] selection:text-white font-sans">
      {/* 헤더 컴포넌트 */}
      <Header
        totalPlaySeconds={totalPlaySeconds}
        remainingSeconds={remainingSeconds}
        timerMinutes={timerMinutes}
        onOpenTimer={() => setIsTimerModalOpen(true)}
      />

      {/* 메인 영역: 백색소음 카드 그리드 */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-center">
        {SOUNDS.map((sound: SoundItem) => {
          const state = soundStates[sound.id] || { isPlaying: false, volume: 0.7 };
          return (
            <PlayerCard
              key={sound.id}
              sound={sound}
              isPlaying={state.isPlaying && isGlobalPlaying}
              volume={state.volume}
              onToggle={handleToggleSound}
              onVolumeChange={handleVolumeChange}
            />
          );
        })}
      </main>

      {/* 하단 컨트롤러 */}
      <BottomController
        isGlobalPlaying={isGlobalPlaying}
        onGlobalToggle={handleGlobalToggle}
        onOpenTimer={() => setIsTimerModalOpen(true)}
        timerMinutes={timerMinutes}
        remainingSeconds={remainingSeconds}
        masterVolume={masterVolume}
        onMasterVolumeChange={setMasterVolume}
      />

      {/* 타이머 모달 */}
      <TimerModal
        isOpen={isTimerModalOpen}
        currentTimer={timerMinutes}
        onSelectTimer={handleSelectTimer}
        onClose={() => setIsTimerModalOpen(false)}
      />
    </div>
  );
}
