import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioMixer } from '../src/hooks/useAudioMixer';

describe('useAudioMixer 훅 테스트', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('멀티 오디오 믹싱: 여러 소리를 개별적으로 켜고 볼륨을 조절할 수 있다', () => {
    const { result } = renderHook(() => useAudioMixer());

    // 초기 상태 확인
    expect(result.current.soundStates['rain'].isPlaying).toBe(false);
    expect(result.current.soundStates['womb'].isPlaying).toBe(false);

    // 빗소리 재생 켜기
    act(() => {
      result.current.toggleSound('rain');
    });
    expect(result.current.soundStates['rain'].isPlaying).toBe(true);
    expect(result.current.isGlobalPlaying).toBe(true);

    // 심장박동 소리 재생 켜기 (멀티 믹싱)
    act(() => {
      result.current.toggleSound('womb');
    });
    expect(result.current.soundStates['womb'].isPlaying).toBe(true);

    // 각 소리별 볼륨 조절
    act(() => {
      result.current.setVolume('rain', 0.4);
      result.current.setVolume('womb', 0.8);
    });

    expect(result.current.soundStates['rain'].volume).toBe(0.4);
    expect(result.current.soundStates['womb'].volume).toBe(0.8);
  });

  it('페이드아웃 테스트: startFadeOut 호출 시 5초간 점진적으로 볼륨이 줄어들고 정지한다', () => {
    const { result } = renderHook(() => useAudioMixer());

    // 소리 켜기
    act(() => {
      result.current.toggleSound('rain');
      result.current.setVolume('rain', 1.0);
    });

    expect(result.current.soundStates['rain'].isPlaying).toBe(true);
    expect(result.current.isFadingOut).toBe(false);

    // 페이드아웃 시작
    act(() => {
      result.current.startFadeOut();
    });

    expect(result.current.isFadingOut).toBe(true);

    // 5초(5000ms) 경과 시뮬레이션
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // 페이드아웃 완료 후 전체 정지 상태 확인
    expect(result.current.isGlobalPlaying).toBe(false);
    expect(result.current.isFadingOut).toBe(false);
    expect(result.current.soundStates['rain'].isPlaying).toBe(false);
  });
});
