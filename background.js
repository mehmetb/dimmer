/* global browser */

const loadedTabs = new Set();

async function executeContentScript(tab) {
  if (!loadedTabs.has(tab.id)) {
    await browser.tabs.executeScript(tab.id, { file: '/content_scripts/dimmer-overlay.js' });

    loadedTabs.add(tab.id);
  }

  return tab;
}

async function toggleDim(tab) {
  await executeContentScript(tab);
  await browser.tabs.sendMessage(tab.id, { command: 'toggle-dim', from: 'background', to: 'content_script' });
}

browser.commands.onCommand.addListener((commandName) => {
  switch (commandName) {
    case 'toggle-dim': {
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then((tabs) => {
          if (tabs.length !== 1) {
            throw new Error('Couldn\'t query the active tab');
          }

          return toggleDim(tabs[0]);
        })
        .catch((ex) => console.error(ex.message));
      break;
    }

    default:
      break;
  }
});

browser.runtime.onMessage.addListener((message) => {
  if (message.to !== 'background') {
    return Promise.resolve();
  }

  switch (message.command) {
    case 'query': {
      return browser.tabs
        .query({ active: true, currentWindow: true })
        .then((tabs) => {
          if (tabs.length !== 1) {
            return Promise.reject(new Error('Couldn\'t query the active tab.'));
          }

          return Promise.resolve(tabs[0]);
        })
        .then(executeContentScript)
        .then((tab) => browser.tabs.sendMessage(tab.id, { command: 'query', from: 'background', to: 'content_script' }))
        .catch((ex) => console.error(ex.message));
    }

    default:
      break;
  }

  return Promise.resolve();
});

browser.tabs.onRemoved.addListener((tabId) => {
  // Delete state of the removed tab
  loadedTabs.delete(tabId);
});
