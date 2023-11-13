/**
 * Copyright 2020, 2021, 2023 Mehmet Baker
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

/**
 * @typedef {object} TabState
 * @property {boolean} isDimmed
 * @property {number} opacity A number [0, 1]
 * @property {boolean} [applySettingsToCurrentTab] If true, popup option 'Apply settings to this tab only' will be checked.
 */

const defaultSettings = {
  applyToAllTabs: true,
};

const initialState = {
  isDimmed: false,
  opacity: 0.7,
};

/**
 * This state is the state of tabs that checked 'Apply settings to all tabs' option.
 */
const globalState = {
  ...initialState,
};

/**
 * These states are of tabs that checked the 'Apply settings to this tab only' option.
 * Keys are tab ids and values are states.
 * @type {Map<number, TabState>}
 */
const localStateTabs = new Map();

const globalStateTabs = new Set();

/**
 * Returns a tab's state.
 * @param {number} tabId Tab ID
 * @returns {TabState}
 */
function getState(tabId) {
  if (localStateTabs.has(tabId)) {
    return {
      ...localStateTabs.get(tabId),
      applySettingsToCurrentTab: true,
    };
  }

  return globalState;
}

/**
 * Adds/updates the overridden states
 * @param {number} tabId Tab ID.
 * @param {{ isDimmed?: boolean, opacity?: number }} params Prop(s) of TabState
 */
function extendState(tabId, params = {}) {
  const state = getState(tabId);
  localStateTabs.set(tabId, {
    ...state,
    ...params,
  });
}

/**
 * Updates the state object in the background script. Also updates the states of content
 * scripts by sending them set-state commands.
 * @param {number} tabId Tab ID
 * @param {('isDimmed'|'opacity')|null} stateProp A property key of TabState
 * @param {boolean|number} [propValue] A prop value of TabState
 * @returns {Promise<void>}
 */
async function setState(tabId, stateProp, propValue) {
  // If 'Apply settings to this tab only' option is selected, update the current tab only
  if (localStateTabs.has(tabId)) {
    const state = getState(tabId);

    if (stateProp !== null) {
      state[stateProp] = propValue;
      localStateTabs.set(tabId, state);
    }

    await browser.tabs.sendMessage(tabId, {
      command: 'set-state',
      from: 'background',
      to: 'content_script',
      data: {
        isDimmed: state.isDimmed,
        opacity: state.opacity,
      },
    });

    return;
  }

  // If 'Apply settings to all tabs' option is checked then update all the other tabs
  // that checked 'Apply settings to all tabs' option as well.
  if (stateProp !== null) {
    globalState[stateProp] = propValue;
  }

  const allTabs = await browser.tabs.query({});
  const promises = [];
  const command = {
    command: 'set-state',
    from: 'background',
    to: 'content_script',
    data: {
      isDimmed: globalState.isDimmed,
      opacity: globalState.opacity,
    },
  };

  for (const tab of allTabs) {
    const isOverridden = localStateTabs.has(tab.id);
    if (!isOverridden) {
      const promise = browser.tabs.sendMessage(tab.id, command);
      promises.push(promise);
    }
  }

  await Promise.all(promises);
}

/**
 * Returns the current tab.
 * @returns {object} Active Tab Object
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab}
 */
async function getActiveTab() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });

  if (tabs.length !== 1) {
    throw new Error('Failed to get active tab');
  }

  return tabs[0];
}

/**
 * Handle the keyboard shortcut. (See the manifest file for the default shortcut)
 * @param {string} commandName
 * @returns {Promise<void>}
 */
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

/**
 * Handles incoming messages from content scripts and popup window.
 * @param {IncomingMessage} message
 * @param {*} sender Sender tab. For more information please visit the link below.
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage#parameters}
 * @returns {Promise<void>}
 */
async function handleMessage(message, sender) {
  if (message.to !== 'background') {
    return Promise.resolve();
  }

  const activeTab = sender.tab || await getActiveTab();

  switch (message.command) {
    case 'query': {
      if (!localStateTabs.has(activeTab.id) && !globalStateTabs.has(activeTab.id)) {
        if (defaultSettings.applyToAllTabs) {
          globalStateTabs.add(activeTab.id);
        } else {
          localStateTabs.set(activeTab.id, { ...initialState });
        }
      }

      return {
        state: getState(activeTab.id),
        defaultSettings,
      };
    }

    case 'dim': {
      return setState(activeTab.id, 'isDimmed', true);
    }

    case 'undim': {
      return setState(activeTab.id, 'isDimmed', false);
    }

    case 'set-opacity': {
      console.debug('setting opacity', message.data.opacity);
      return setState(activeTab.id, 'opacity', message.data.opacity);
    }

    case 'apply-settings-to-current-tab-only': {
      globalStateTabs.delete(activeTab.id);
      extendState(activeTab.id);
      return Promise.resolve();
    }

    case 'apply-settings-to-all-tabs': {
      // get the current state of the tab
      const tabState = localStateTabs.get(activeTab.id);

      if (tabState) {
        // update global state settings to match the current tab's state
        globalState.isDimmed = tabState.isDimmed;
        globalState.opacity = tabState.opacity;
      }

      // remove the current tab from the ovveriden map so it can get global state changes in the future
      localStateTabs.delete(activeTab.id);
      globalStateTabs.add(activeTab.id);

      // calling `setState` with `null` will cause all tabs that don't choose 'Apply settings to this tab only' to get
      // the latest gloabl state
      return setState(activeTab.id, null);
    }

    case 'update-default-settings': {
      defaultSettings.applyToAllTabs = message.data.applyToAllTabs;
      return Promise.resolve({ defaultSettings, message });
    }

    default: {
      return Promise.resolve();
    }
  }
}

function handleTabRemove(tabId) {
  localStateTabs.delete(tabId);
  globalStateTabs.delete(tabId);
}

browser.commands.onCommand.addListener(handleCommand);
browser.runtime.onMessage.addListener(handleMessage);
browser.tabs.onRemoved.addListener(handleTabRemove);
browser.permissions.getAll().then(console.log).catch(console.trace);

/**
 * @typedef {object} IncomingMessage
 * @property {string} command
 * @property {{ opacity?: number }} [data]
 */
