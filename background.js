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


async function toggleDim(tab) {
  await browser.tabs.sendMessage(tab.id, { command: 'toggle-dim', from: 'background', to: 'content_script' });
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
      return Promise.resolve();
  }
}

browser.commands.onCommand.addListener(handleCommand);
browser.runtime.onMessage.addListener(handleMessage);
