import '@testing-library/jest-dom';
import { vi } from 'vitest';

// HTMLAudioElement mock for JSDOM
window.HTMLAudioElement.prototype.play = function() {
  return Promise.resolve();
};

window.HTMLAudioElement.prototype.pause = function() {};

// Wake Lock API mock
Object.defineProperty(navigator, 'wakeLock', {
  writable: true,
  value: {
    request: async () => ({
      released: false,
      release: async () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  },
});
