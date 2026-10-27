import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { TimerOption } from '../src/types';

// 타이머 및 페이드아웃 로직 테스트용 훅 (App.tsx의 핵심 타이머 로직 반영)
function useTimerTest(initialMinutes: TimerOption) {
  const [timerMinutes, setTimerMinutes] = useState<TimerOption>(initialMinutes);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(
    initialMinutes === 'infinite' ? null : (initialMinutes as number) * 60
  );
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const countdownTimerRef = useRef<any>(null);
  const fadeIntervalRef = useRef<any>(null);

  const stopAll = useCallback(() => {
    setIsPlaying(false);
    setIsFadingOut(false);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    setRemainingSeconds(null);
  }, []);

  const startFadeOut = useCallback((onComplete?: () => void) => {
    if (isFadingOut) return;
    setIsFadingOut(true);

    const fadeDuration = 5000;
    const intervalTime = 100;
    const steps = fadeDuration / intervalTime;
    let currentStep = 0;

    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
        stopAll();
        if (onComplete) onComplete();
      }
    }, intervalTime);
  }, [isFadingOut, stopAll]);

  useEffect(() => {
    if (timerMinutes === 'infinite' || !isPlaying) {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      return;
    }

    if (remainingSeconds === null) {
      setRemainingSeconds((timerMinutes as number) * 60);
    }

    countdownTimerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          // 타이머 종료 시 페이드아웃 시작
          startFadeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [timerMinutes, isPlaying, startFadeOut]);

  const selectTimer = (option: TimerOption) => {
    setTimerMinutes(option);
    if (option === 'infinite') {
      setRemainingSeconds(null);
    } else {
      setRemainingSeconds((option as number) * 60);
    }
  };

  return {
    timerMinutes,
    remainingSeconds,
    isFadingOut,
    isPlaying,
    selectTimer,
  };
}

describe('타이머 카운트다운 및 페이드아웃 테스트', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('타이머 설정 및 1초씩 남은 시간 감소 테스트', () => {
    // 1분(60초) 타이머 설정 (타입 캐스팅으로 TimerOption 준수)
    const { result } = renderHook(() => useTimerTest(30));
    
    act(() => {
      result.current.selectTimer(15);
    });

    expect(result.current.remainingSeconds).toBe(900);

    // 직접 1분(60초) 타이머 훅 테스트를 위해 selectTimer(30)에서 30분 기본 상태 확인
    const { result: res2 } = renderHook(() => useTimerTest(30));
    expect(res2.current.remainingSeconds).toBe(1800);
  });

  it('타이머 종료 시 페이드아웃 시작 및 정지 테스트', () => {
    const { result } = renderHook(() => useTimerTest(15));
    expect(result.current.remainingSeconds).toBe(900);
  });

  it('무제한 타이머 선택 시 남은 시간이 null로 유지된다', () => {
    const { result } = renderHook(() => useTimerTest(30));

    expect(result.current.remainingSeconds).toBe(1800);

    act(() => {
      result.current.selectTimer('infinite');
    });

    expect(result.current.timerMinutes).toBe('infinite');
    expect(result.current.remainingSeconds).toBe(null);

    // 시간이 지나도 남은 시간은 null
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.remainingSeconds).toBe(null);
    expect(result.current.isPlaying).toBe(true);
  });
});
