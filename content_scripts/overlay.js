/**
 * Copyright 2020 Mehmet Baker
 *
 * This file is part of dimmer.
 *
 * dimmer is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * dimmer is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with dimmer. If not, see <https://www.gnu.org/licenses/>.
 */

/* global browser */

(function main() {
  const state = {
    opacity: '.7',
    isDimmed: false,
    container: document.createElement('div'),
  };

  if (window.hasRun) {
    return;
  }

  const toggleOverlay = function toggleOverlay() {
    return new Promise((resolve) => {
      // Toggle the flag
      state.isDimmed = !state.isDimmed;

      window.requestAnimationFrame(() => {
        // Set transition
        state.container.style.transition = 'opacity .3s';

        // Reset the transition property once the transition has ended
        state.container.addEventListener('transitionend', () => {
          state.container.style.transition = '';
        }, { once: true });

        // Set the opacity of overlay
        state.container.style.opacity = state.isDimmed ? state.opacity : '0';

        // Resolve the promise
        resolve({
          opacity: state.opacity,
          isDimmed: state.isDimmed,
        });
      });
    });
  };

  // Running for the first time here
  window.hasRun = true;

  state.container.style.position = 'fixed';
  state.container.style.top = '0';
  state.container.style.right = '0';
  state.container.style.bottom = '0';
  state.container.style.left = '0';
  state.container.style.pointerEvents = 'none';
  state.container.style.zIndex = Number.MAX_SAFE_INTEGER;
  state.container.style.background = '#000';
  state.container.style.opacity = '0';

  browser.runtime.onMessage.addListener((message) => {
    if (message.to !== 'content_script') {
      return Promise.resolve(null);
    }

    switch (message.command) {
      case 'toggle-dim': {
        return toggleOverlay(state);
      }

      case 'query': {
        const { isDimmed, opacity } = state;
        return Promise.resolve({ isDimmed, opacity });
      }

      case 'set-opacity': {
        state.opacity = message.data;

        if (state.isDimmed) {
          state.container.style.opacity = state.opacity;
        }

        break;
      }

      case 'dim': {
        if (state.isDimmed === false) {
          return toggleOverlay(state);
        }

        break;
      }

      case 'undim': {
        if (state.isDimmed === true) {
          return toggleOverlay(state);
        }

        break;
      }

      default:
        break;
    }

    return Promise.resolve(null);
  });

  async function init() {
    try {
      const response = await browser.runtime.sendMessage({
        command: 'query',
        from: 'content_script',
        to: 'background',
      });

      state.isDimmed = !!response.isDimmed;
      state.opacity = String(response.opacity) || '0';
      state.container.style.opacity = state.isDimmed ? state.opacity : '0';

      setTimeout(() => {
        state.container.style.transition = 'opacity .3s';
      }, 300);
    } catch (ex) {
      console.error('Dimmer failed to initialize.');
    }
  }

  init();

  function appendContainerToDOM() {
    if (!document.body) {
      setTimeout(appendContainerToDOM);
      return;
    }

    document.body.appendChild(state.container);
  }

  appendContainerToDOM();
}());
