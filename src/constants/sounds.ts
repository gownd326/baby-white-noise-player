export interface SoundDefinition {
  id: string;
  name: string;
  icon: string;
  type: 'pink' | 'brown' | 'white' | 'modulated';
  durationSec: number;
}

export const SOUNDS: SoundDefinition[] = [
  { id: 'rain', name: '토독토독 빗소리', icon: 'CloudRain', type: 'pink', durationSec: 5 },
  { id: 'womb', name: '엄마 배 속 소리', icon: 'Heart', type: 'brown', durationSec: 5 },
  { id: 'wave', name: '시원한 파도 소리', icon: 'Waves', type: 'modulated', durationSec: 8 },
  { id: 'vacuum', name: '청소기 소리', icon: 'Wind', type: 'brown', durationSec: 5 },
  { id: 'wind', name: '자연의 바람 소리', icon: 'Wind', type: 'pink', durationSec: 6 },
  { id: 'waterfall', name: '웅장한 폭포 소리', icon: 'Droplets', type: 'white', durationSec: 5 }
];
