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
 * @typedef {object} DimState
 * @property {boolean} isDimmed
 * @property {number} opacity A number [0, 1]
 */

/**
 * Dim states of tabs.
 * Keys are tab ids and values are dim states.
 * @type {Map<number, DimState>}
 */
const states = new Map();

function getState(tabId) {
  return states.get(tabId) || { isDimmed: false, opacity: 0.7 };
}

function extendState(tabId, params) {
  const state = getState(tabId);
  states.set(tabId, {
    ...state,
    ...params,
  });
}

async function toggleDim(tab) {
  console.debug('toggle dim', tab.id);

  const state = getState(tab.id);
  state.isDimmed = !state.isDimmed;
  states.set(tab.id, state);

  await browser.tabs.sendMessage(tab.id, {
    command: state.isDimmed ? 'dim' : 'undim',
    from: 'background',
    to: 'content_script',
  });
}

async function dim(tabId) {
  console.debug('Dimming tab', tabId);
  extendState(tabId, { isDimmed: true });
  await browser.tabs.sendMessage(tabId, { command: 'dim', from: 'background', to: 'content_script' });
}

async function unDim(tabId) {
  console.debug('Undimming tab', tabId);
  extendState(tabId, { isDimmed: false });
  await browser.tabs.sendMessage(tabId, { command: 'undim', from: 'background', to: 'content_script' });
}

async function setOpacity(tabId, opacity) {
  console.debug('Setting opacity of tab', tabId);
  extendState(tabId, { opacity });
  await browser.tabs.sendMessage(tabId, {
    command: 'set-opacity',
    from: 'background',
    to: 'content_script',
    data: opacity,
  });
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
      return toggleDim(activeTab);
    }

    default:
      return Promise.resolve();
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
      return dim(activeTab.id);
    }

    case 'undim': {
      return unDim(activeTab.id);
    }

    case 'set-opacity': {
      return setOpacity(activeTab.id, message.data.opacity);
    }

    default:
      return Promise.resolve();
  }
}

function handleTabRemove(tabId) {
  console.debug(`Removing dimmer state info of tab ${tabId}`);
  states.delete(tabId);
}

browser.commands.onCommand.addListener(handleCommand);
browser.runtime.onMessage.addListener(handleMessage);
browser.tabs.onRemoved.addListener(handleTabRemove);
