import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioMixer } from '../src/hooks/useAudioMixer';

describe('useAudioMixer 훅 단일 플레이어 원칙 테스트', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('단일 플레이어 원칙: 새로운 소음을 선택하면 기존에 재생되던 소음은 즉시 정지하고 새로 선택된 소음만 단독 재생된다', () => {
    const { result } = renderHook(() => useAudioMixer());

    // 초기 상태 확인
    expect(result.current.soundStates['rain'].isPlaying).toBe(false);
    expect(result.current.soundStates['wave'].isPlaying).toBe(false);

    // 빗소리 재생 켜기
    act(() => {
      result.current.toggleSound('rain');
    });
    expect(result.current.soundStates['rain'].isPlaying).toBe(true);
    expect(result.current.soundStates['wave'].isPlaying).toBe(false);
    expect(result.current.isGlobalPlaying).toBe(true);

    // 파도 소리 새로 선택 (단일 플레이어 원칙: 빗소리는 꺼지고 파도소리만 켜짐)
    act(() => {
      result.current.toggleSound('wave');
    });
    expect(result.current.soundStates['rain'].isPlaying).toBe(false);
    expect(result.current.soundStates['wave'].isPlaying).toBe(true);
    expect(result.current.isGlobalPlaying).toBe(true);
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
