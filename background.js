/**
 * Copyright 2020-2021 Mehmet Baker
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
 * This state represents the state of all tabs that haven't selected 'Only this tab' option.
 */
const globalState = {
  isDimmed: false,
  opacity: 0.7,
};

const overriddenStates = new Map();

function getState(tabId) {
  if (overriddenStates.has(tabId)) {
    return {
      ...overriddenStates.get(tabId),
      overrideGlobalState: true,
    };
  }
  return globalState;
}

function extendState(tabId, params = {}) {
  const state = getState(tabId);
  overriddenStates.set(tabId, {
    ...state,
    ...params,
  });
}

async function setState(tabId, stateProp, propValue) {
  // If 'Only for this tab' option is selected, update the current tab only
  if (overriddenStates.has(tabId)) {
    const state = getState(tabId);

    if (stateProp !== null) {
      state[stateProp] = propValue;
      overriddenStates.set(tabId, state);
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

  // If 'Only for this tab' is NOT selected, then update all tabs but the overriddens.

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
    const isOverridden = overriddenStates.has(tab.id);
    if (!isOverridden) {
      const promise = browser.tabs.sendMessage(tab.id, command);
      promises.push(promise);
    }
  }

  await Promise.all(promises);
}

async function getActiveTab() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });

  if (tabs.length !== 1) {
    throw new Error('Failed to get active tab');
  }

  return tabs[0];
}

async function handleCommand(commandName) {
  switch (commandName) {
    case 'toggle-dim': {
      const activeTab = await getActiveTab();
      const state = getState(activeTab.id);
      return setState(activeTab.id, 'isDimmed', !state.isDimmed);
    }

    default: {
      return Promise.resolve();
    }
  }
}

async function handleMessage(message, sender) {
  if (message.to !== 'background') {
    return Promise.resolve();
  }

  const activeTab = sender.tab || await getActiveTab();

  switch (message.command) {
    case 'query': {
      return getState(activeTab.id);
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

    case 'override-global-state': {
      extendState(activeTab.id);
      return Promise.resolve();
    }

    case 'remove-state-override': {
      overriddenStates.delete(activeTab.id);
      return setState(activeTab.id, null);
    }

    default: {
      return Promise.resolve();
    }
  }
}

function handleTabRemove(tabId) {
  overriddenStates.delete(tabId);
}

browser.commands.onCommand.addListener(handleCommand);
browser.runtime.onMessage.addListener(handleMessage);
browser.tabs.onRemoved.addListener(handleTabRemove);

