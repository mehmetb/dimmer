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

const DEFAULT_SETTINGS = {
  dimUndimAllTabsSimultaneously: false,
  defaultDimLevel: 0.7,
};

function getActiveTab() {
  return browser.tabs
    .query({ active: true, currentWindow: true })
    .then((tabs) => {
      if (tabs.length > 0) {
        return Promise.resolve(tabs[0]);
      }

      return Promise.resolve();
    });
}

function getAllTabsToDimUndim() {
  return browser.storage.local.get(DEFAULT_SETTINGS).then((data) => {
    if (data.dimUndimAllTabsSimultaneously) {
      return browser.tabs.query({});
    }

    return getActiveTab().then((tab) => {
      if (!tab || tab.id === browser.tabs.TAB_ID_NONE) {
        return Promise.reject(new Error('Failed to get active tab'));
      }

      return Promise.resolve([tab]);
    });
  });
}

function getDefaultState() {
  return browser.storage.local.get(DEFAULT_SETTINGS).then((defaultSettings) => {
    return Promise.resolve({
      isDimmed: false,
      opacity: defaultSettings.defaultDimLevel,
    });
  });
}

function getTabState(tabId) {
  const stateKey = `tabState_${tabId}`;
  return browser.storage.session.get(stateKey).then((data) => {
    if (data[stateKey]) {
      return Promise.resolve(data[stateKey]);
    }

    return getDefaultState();
  });
}

function updateTabState(tabId, state) {
  const key = `tabState_${tabId}`;
  browser.storage.session.get(key).then((data) => {
    browser.storage.session.set({ [key]: { ...data[key], ...state } });
  });
}

function dimTab(tabId) {
  browser.tabs.sendMessage(tabId, { command: 'dim', to: 'content-script' });
  updateTabState(tabId, { isDimmed: true });
}

function undimTab(tabId) {
  browser.tabs.sendMessage(tabId, { command: 'undim', to: 'content-script' });
  updateTabState(tabId, { isDimmed: false });
}

function setTabOpacity(tabId, opacity) {
  browser.tabs.sendMessage(tabId, {
    command: 'set-opacity',
    to: 'content-script',
    data: { opacity },
  });
  updateTabState(tabId, { opacity });
}

function onClickDimFromPopup() {
  getAllTabsToDimUndim().then((tabs) =>
    Promise.all(tabs.map((tab) => dimTab(tab.id)))
  );
}

function onClickUndimFromPopup() {
  getAllTabsToDimUndim().then((tabs) =>
    Promise.all(tabs.map((tab) => undimTab(tab.id)))
  );
}

function onChangeOpacityFromPopup(opacity) {
  getActiveTab().then((tab) => setTabOpacity(tab.id, opacity));
}

async function handleCommand(commandName) {
  switch (commandName) {
    case 'Toggle Dim (All tabs)': {
      const activeTab = await getActiveTab();
      const state = getState(activeTab.id);
      return setState(activeTab.id, 'isDimmed', !state.isDimmed);
    }

    case 'Toggle Dim (Active tab only)': {
      const activeTab = await getActiveTab();
      const state = getState(activeTab.id);

      if (!localStateTabs.has(activeTab.id)) {
        globalStateTabs.delete(activeTab.id);
        localStateTabs.set(activeTab.id, { ...globalState });
      }

      return setState(activeTab.id, 'isDimmed', !state.isDimmed);
    }

    default: {
      return Promise.resolve();
    }
  }
}

function handleMessage(message, sender) {
  if (message.to !== 'background') {
    return;
  }

  switch (message.command) {
    case 'get-tab-state': {
      return getTabState(sender.tab.id);
    }

    case 'get-active-tab-state': {
      return getActiveTab().then((tab) => {
        if (!tab || tab.id === browser.tabs.TAB_ID_NONE) {
          return Promise.reject(new Error('Failed to get active tab'));
        }

        return getTabState(tab.id);
      });
    }

    case 'dim': {
      onClickDimFromPopup();
      break;
    }

    case 'undim': {
      onClickUndimFromPopup();
      break;
    }

    case 'set-opacity': {
      onChangeOpacityFromPopup(message.data.opacity);
      break;
    }

    default: {
      return Promise.resolve();
    }
  }
}

function handleTabRemove(tabId) {
  browser.storage.session.remove(`tabState_${tabId}`);
}

browser.commands.onCommand.addListener(handleCommand);
browser.runtime.onMessage.addListener(handleMessage);
browser.tabs.onRemoved.addListener(handleTabRemove);

browser.scripting.registerContentScripts([
  {
    id: 'dimmer-overlay',
    js: ['/content_scripts/overlay.js'],
    matches: ['<all_urls>'],
    matchOriginAsFallback: true,
    runAt: 'document_start',
    world: browser.scripting.ExecutionWorld.ISOLATED,
  },
]);
