/**
 * Copyright 2020, 2021, 2023, 2024 Mehmet Baker
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
    isDimmed: true,
    opacity: 0.7,
  };

  const container = document.createElement('div');

  const toggleOverlay = () => {
    // Toggle the flag
    state.isDimmed = !state.isDimmed;

    window.requestAnimationFrame(() => {
      // Set transition
      container.style.transition = 'opacity .3s';

      // Reset the transition property once the transition has ended
      container.addEventListener(
        'transitionend',
        () => {
          container.style.transition = '';
        },
        { once: true }
      );

      // Set the opacity of overlay
      container.style.opacity = state.isDimmed ? state.opacity : '0';
    });
  };

  const sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };

  const appendContainerToDOM = () => {
    if (!document.body) {
      return sleep(1).then(appendContainerToDOM);
    }

    document.body.appendChild(container);
    return Promise.resolve();
  };

  const retrieveAndUpdateState = () => {
    return browser.runtime.sendMessage({
      to: 'background',
      command: 'get-tab-state',
    }).then((tabState) => {
      console.info('Retrieved state:', tabState);
      state.isDimmed = tabState.isDimmed;
      state.opacity = tabState.opacity;
    });
  };

  const init = () => {
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.right = '0';
    container.style.bottom = '0';
    container.style.left = '0';
    container.style.pointerEvents = 'none';
    container.style.zIndex = Number.MAX_SAFE_INTEGER;
    container.style.background = '#000';
    container.style.opacity = '0';

    Promise.all([
      retrieveAndUpdateState(),
      appendContainerToDOM(),
    ])
    .then(() => {
      container.style.opacity = state.isDimmed ? state.opacity : '0';
      return sleep(300);
    })
    .then(() => {
      container.style.transition = 'opacity .3s';
    })
    .catch((ex) => {
      console.trace(ex);
      console.error('Dimmer failed to initialize.');
    });
  };

  init();

  browser.runtime.onMessage.addListener((message) => {
    if (message.to !== 'content-script') {
      return;
    }

    switch (message.command) {
      case 'set-opacity': {
        state.opacity = message.data.opacity;
        container.style.opacity = state.isDimmed ? state.opacity : '0';
        break;
      }

      case 'dim': {
        if (!state.isDimmed) {
          toggleOverlay();
        }

        break;
      }

      case 'undim': {
        if (state.isDimmed) {
          toggleOverlay();
        }

        break;
      }

      default: {
        break;
      }
    }
  });
})();
