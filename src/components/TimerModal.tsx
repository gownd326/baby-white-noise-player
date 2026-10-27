import React from 'react';
import { X, Clock, Check } from 'lucide-react';
import { TimerOption } from '../types';

interface TimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTimer: TimerOption;
  onSelectTimer: (option: TimerOption) => void;
}

export default function TimerModal({
  isOpen,
  onClose,
  currentTimer,
  onSelectTimer,
}: TimerModalProps) {
  if (!isOpen) return null;

  const options: { label: string; value: TimerOption }[] = [
    { label: '15분', value: 15 },
    { label: '30분 (기본)', value: 30 },
    { label: '45분', value: 45 },
    { label: '60분', value: 60 },
    { label: '90분', value: 90 },
    { label: '무제한', value: 'infinite' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#1E293B] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#818CF8]" />
            <h2 className="text-lg font-bold text-[#F1F5F9]">자동 종료 타이머 설정</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="모달 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 옵션 그리드 */}
        <div className="p-6">
          <p className="text-sm text-slate-300 mb-4">
            설정된 시간이 지나면 소리가 5초간 서서히 작아지며(Fade-out) 자동으로 종료됩니다.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {options.map((opt) => {
              const isSelected = currentTimer === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  onClick={() => {
                    onSelectTimer(opt.value);
                    onClose();
                  }}
                  className={`flex items-center justify-between px-4 py-4 rounded-xl border text-left transition cursor-pointer min-h-[48px] ${
                    isSelected
                      ? 'bg-[#818CF8]/20 border-[#818CF8] text-[#F1F5F9] font-semibold'
                      : 'bg-[#121826] border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <span className="text-sm">{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#818CF8]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 하단 닫기 버튼 */}
        <div className="px-6 py-4 bg-[#121826]/50 border-t border-slate-700/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition cursor-pointer min-h-[48px] min-w-[48px]"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
