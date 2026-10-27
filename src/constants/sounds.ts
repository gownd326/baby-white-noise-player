export interface SoundItem {
  id: string;
  name: string;
  icon: string;
  src: string;
}

export const SOUNDS: SoundItem[] = [
  { id: 'rain', name: '토독토독 빗소리', icon: 'CloudRain', src: '/audio/rain.mp3' },
  { id: 'womb', name: '엄마 배 속 소리', icon: 'Heart', src: '/audio/womb.mp3' },
  { id: 'wave', name: '시원한 파도 소리', icon: 'Waves', src: '/audio/wave.mp3' },
  { id: 'vacuum', name: '청소기 소리', icon: 'Wind', src: '/audio/vacuum.mp3' },
  { id: 'wind', name: '자연의 바람 소리', icon: 'Wind', src: '/audio/wind.mp3' },
  { id: 'waterfall', name: '웅장한 폭포 소리', icon: 'Droplets', src: '/audio/waterfall.mp3' }
];
