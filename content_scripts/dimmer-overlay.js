/* global browser */

function toggleOverlay(state) {
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
}

(function main() {
  const state = {
    opacity: '.7',
    isDimmed: false,
    container: document.createElement('div'),
  };

  if (window.hasRun) {
    return;
  }

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
  state.container.style.transition = 'opacity .3s';
  document.body.appendChild(state.container);

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
}());
