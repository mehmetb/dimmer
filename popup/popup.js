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

async function getCurrentTab() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });

  if (tabs.length !== 1) {
    throw new Error('Failed to get current tab');
  }

  return tabs[0];
}

const currentTabPromise = getCurrentTab();
const undimButton = document.querySelector('button.default');
const dimButton = document.querySelector('button.primary');
const rangeInput = document.querySelector('input[type=range]');

async function sendCommandToActiveTab(command, data) {
  try {
    const tab = await currentTabPromise;

    await browser.tabs.sendMessage(tab.id, {
      command,
      data,
      from: 'popup',
      to: 'content_script',
    });
  } catch (ex) {
    console.error(ex.message);
  }
}

function onRangeChanged() {
  sendCommandToActiveTab('set-opacity', rangeInput.value);
}

async function onUndimClicked() {
  await sendCommandToActiveTab('undim');
  window.close();
}

async function onDimClicked() {
  await sendCommandToActiveTab('dim');
  window.close();
}

rangeInput.addEventListener('input', onRangeChanged);
dimButton.addEventListener('click', onDimClicked);
undimButton.addEventListener('click', onUndimClicked);

async function init() {
  try {
    const { opacity } = await browser.runtime.sendMessage({
      command: 'query',
      from: 'popup',
      to: 'background',
    });

    rangeInput.value = opacity;
  } catch (ex) {
    console.error(ex.message);
  }
}

init();
