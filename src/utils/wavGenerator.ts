// 브라우저의 OfflineAudioContext를 활용해 실제 PCM 데이터가 담긴 .wav Blob URL을 생성하는 유틸리티
export async function generateWavBlob(type: 'pink' | 'brown' | 'white' | 'modulated', durationSec: number = 5): Promise<string> {
  const sampleRate = 44100;
  const numChannels = 1;
  const frameCount = sampleRate * durationSec;
  
  const offlineContext = new OfflineAudioContext(numChannels, frameCount, sampleRate);
  const buffer = offlineContext.createBuffer(numChannels, frameCount, sampleRate);
  const output = buffer.getChannelData(0);

  if (type === 'white') {
    for (let i = 0; i < frameCount; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  } else if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < frameCount; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }
  } else if (type === 'brown') {
    let lastOut = 0.0;
    for (let i = 0; i < frameCount; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // gain adjustment
    }
  } else if (type === 'modulated') {
    // 파도 소리 등을 위한 변조 화이트/핑크 노이즈
    for (let i = 0; i < frameCount; i++) {
      const white = Math.random() * 2 - 1;
      const mod = (Math.sin((i / sampleRate) * 2 * Math.PI * 0.2) + 1) / 2; // 0.2Hz 주기 변조
      output[i] = white * mod * 0.8;
    }
  }

  // WAV 파일 포맷 인코딩 (PCM 16-bit)
  const wavBuffer = createWavFileBuffer(buffer);
  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function createWavFileBuffer(audioBuffer: AudioBuffer): ArrayBuffer {
  const numOfChan = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const samples = audioBuffer.getChannelData(0);
  const dataLength = samples.length * (bitDepth / 8);
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  let offset = 0;
  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset++, str.charCodeAt(i));
    }
  }

  // "RIFF" chunk descriptor
  writeString('RIFF');
  view.setUint32(offset, 36 + dataLength, true); offset += 4;
  writeString('WAVE');

  // "fmt " sub-chunk
  writeString('fmt ');
  view.setUint32(offset, 16, true); offset += 4; // SubChunk1Size (16 for PCM)
  view.setUint16(offset, format, true); offset += 2; // AudioFormat
  view.setUint16(offset, numOfChan, true); offset += 2; // NumChannels
  view.setUint32(offset, sampleRate, true); offset += 4; // SampleRate
  view.setUint32(offset, sampleRate * numOfChan * (bitDepth / 8), true); offset += 4; // ByteRate
  view.setUint16(offset, numOfChan * (bitDepth / 8), true); offset += 2; // BlockAlign
  view.setUint16(offset, bitDepth, true); offset += 2; // BitsPerSample

  // "data" sub-chunk
  writeString('data');
  view.setUint32(offset, dataLength, true); offset += 4;

  // Write PCM samples
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return buffer;
}
