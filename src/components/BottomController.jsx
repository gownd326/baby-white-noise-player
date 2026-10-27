import React from 'react';
import { Play, Square, Clock, Volume2 } from 'lucide-react';

/**
 * @typedef {Object} BottomControllerProps
 * @property {boolean} isGlobalPlaying
 * @property {() => void} onGlobalToggle
 * @property {number} masterVolume
 * @property {(vol: number) => void} onMasterVolumeChange
 * @property {number | 'infinite'} timerMinutes
 * @property {number | null} remainingSeconds
 * @property {() => void} onOpenTimer
 */

/**
 * @param {BottomControllerProps} props
 */
export default function BottomController({
  isGlobalPlaying,
  onGlobalToggle,
  masterVolume,
  onMasterVolumeChange,
  timerMinutes,
  remainingSeconds,
  onOpenTimer,
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1E293B] border-t border-slate-700/60 px-4 py-4 z-20 shadow-2xl backdrop-blur-md bg-opacity-95">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* 전체 재생/정지 버튼 */}
        <button
          onClick={onGlobalToggle}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition cursor-pointer min-h-[48px] shadow-md ${
            isGlobalPlaying
              ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300 hover:bg-rose-500/30'
              : 'bg-[#818CF8] text-[#121826] hover:bg-[#6875e5]'
          }`}
          aria-label={isGlobalPlaying ? '전체 정지' : '전체 재생'}
        >
          {isGlobalPlaying ? (
            <>
              <Square className="w-5 h-5 fill-current" />
              <span>전체 정지</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>전체 재생</span>
            </>
          )}
        </button>

        {/* 중앙 타이머 설정 버튼 */}
        <button
          onClick={onOpenTimer}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#121826] hover:bg-slate-800 border border-slate-700/60 px-5 py-3 rounded-xl text-sm font-medium text-[#F1F5F9] transition cursor-pointer min-h-[48px]"
          aria-label="타이머 설정 열기"
        >
          <Clock className="w-4 h-4 text-[#818CF8]" />
          <span>
            {timerMinutes === 'infinite' ? '타이머: 무제한' : `타이머: ${timerMinutes}분`}
          </span>
        </button>

        {/* 전체 볼륨 조절 영역 */}
        <div className="flex items-center gap-3 w-full sm:w-64 bg-[#121826] px-4 py-2.5 rounded-xl border border-slate-700/60">
          <Volume2 className="w-4 h-4 text-[#818CF8] flex-shrink-0" />
          <span className="text-xs text-slate-400 whitespace-nowrap">전체 볼륨</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#818CF8]"
            aria-label="전체 볼륨 조절"
          />
          <span className="text-xs font-mono text-slate-400 w-9 text-right">
            {Math.round(masterVolume * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
