import React from 'react';
import { CloudRain, Heart, Waves, Wind, Droplets, Volume2, Play, Pause } from 'lucide-react';

/**
 * @typedef {Object} SoundItem
 * @property {string} id
 * @property {string} name
 * @property {string} icon
 * @property {string} src
 */

/**
 * @typedef {Object} PlayerCardProps
 * @property {SoundItem} sound
 * @property {boolean} isPlaying
 * @property {number} volume
 * @property {(id: string) => void} onToggle
 * @property {(id: string, vol: number) => void} onVolumeChange
 */

/**
 * @param {PlayerCardProps} props
 */
export default function PlayerCard({
  sound,
  isPlaying,
  volume,
  onToggle,
  onVolumeChange,
}) {
  const renderIcon = (iconName) => {
    const props = { className: "w-6 h-6 text-[#818CF8]" };
    switch (iconName) {
      case 'CloudRain':
        return <CloudRain {...props} />;
      case 'Heart':
        return <Heart {...props} />;
      case 'Waves':
        return <Waves {...props} />;
      case 'Wind':
        return <Wind {...props} />;
      case 'Droplets':
        return <Droplets {...props} />;
      default:
        return <Wind {...props} />;
    }
  };

  return (
    <div
      className={`relative bg-[#1E293B] border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-lg ${
        isPlaying
          ? 'border-[#818CF8] shadow-[#818CF8]/10 ring-1 ring-[#818CF8]'
          : 'border-slate-700/60 hover:border-slate-600'
      }`}
    >
      {/* 상단: 아이콘, 이름, 재생 토글 버튼 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
              isPlaying ? 'bg-[#818CF8]/20' : 'bg-[#121826]'
            }`}
          >
            {renderIcon(sound.icon)}
          </div>
          <div>
            <h3 className="font-semibold text-[#F1F5F9] text-base">
              {sound.name}
            </h3>
            <p className="text-xs text-slate-400">
              {isPlaying ? '재생 중' : '정지됨'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onToggle(sound.id)}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition cursor-pointer ${
            isPlaying
              ? 'bg-[#818CF8] text-[#121826] hover:bg-[#6875e5]'
              : 'bg-[#121826] text-[#F1F5F9] hover:bg-slate-800 border border-slate-700'
          }`}
          aria-label={`${sound.name} ${isPlaying ? '정지' : '재생'}`}
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>
      </div>

      {/* 하단: 개별 볼륨 조절 슬라이더 */}
      <div className="flex items-center gap-3 pt-3 border-t border-slate-700/40">
        <Volume2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onVolumeChange(sound.id, parseFloat(e.target.value))}
          className="w-full h-2 bg-[#121826] rounded-lg appearance-none cursor-pointer accent-[#818CF8]"
          aria-label={`${sound.name} 개별 볼륨`}
        />
        <span className="text-xs font-mono text-slate-400 w-9 text-right">
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  );
}
