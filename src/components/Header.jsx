import React from 'react';
import { Moon, Clock, Hourglass } from 'lucide-react';

/**
 * @typedef {Object} HeaderProps
 * @property {number} totalPlaySeconds
 * @property {number | null} remainingSeconds
 * @property {number | 'infinite'} timerMinutes
 * @property {() => void} onOpenTimer
 */

/**
 * @param {HeaderProps} props
 */
export default function Header({
  totalPlaySeconds,
  remainingSeconds,
  timerMinutes,
  onOpenTimer,
}) {
  // 초를 MM:SS 형식으로 변환
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatRemainingTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} 남음`;
  };

  return (
    <header className="w-full bg-[#1E293B] border-b border-slate-700/50 px-4 py-4 sticky top-0 z-20 shadow-md">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* 서비스 타이틀 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#818CF8]/20 flex items-center justify-center text-[#818CF8]">
            <Moon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#F1F5F9] tracking-tight">
              아기 잠투정 방지 백색소음 플레이어
            </h1>
            <p className="text-xs text-slate-400">
              밤중 육아와 낮잠을 위한 편안한 소리 믹서
            </p>
          </div>
        </div>

        {/* 재생 시간 & 타이머 상태 표시 영역 */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* 총 재생 시간 표시 */}
          <div className="flex items-center gap-2 bg-[#121826] px-3 py-2 rounded-lg border border-slate-700/50 text-sm">
            <Clock className="w-4 h-4 text-[#818CF8]" />
            <span className="text-xs text-slate-400">총 재생</span>
            <span className="font-mono font-semibold text-[#F1F5F9]">
              {formatTime(totalPlaySeconds)}
            </span>
          </div>

          {/* 타이머 남은 시간 표시 및 버튼 */}
          <button
            onClick={onOpenTimer}
            className="flex items-center gap-2 bg-[#121826] hover:bg-slate-800 transition px-3 py-2 rounded-lg border border-slate-700/50 text-sm cursor-pointer min-h-[48px] min-w-[48px] sm:min-h-0 sm:min-w-0"
            aria-label="타이머 설정"
          >
            <Hourglass className="w-4 h-4 text-[#818CF8]" />
            <span className="font-medium text-[#F1F5F9]">
              {remainingSeconds !== null
                ? formatRemainingTime(remainingSeconds)
                : timerMinutes === 'infinite'
                ? '무제한 타이머'
                : `${timerMinutes}분 타이머`}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
